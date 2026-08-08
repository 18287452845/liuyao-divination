import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  buildDeepSeekMessages,
  buildGuaRecordContext,
  createAiOutputStreamFilter,
  validateAiRequest,
} from './prompt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_REQUEST_BYTES = 200_000;

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function sseError(message: string, status = 200) {
  return new Response(`${sse({ error: message })}data: [DONE]\n\n`, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

function proxyDeepSeekStream(upstreamBody: ReadableStream<Uint8Array>) {
  let buffer = '';
  let sentDone = false;
  const encoder = new TextEncoder();
  const outputFilter = createAiOutputStreamFilter();

  const enqueueContent = (
    content: string,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) => {
    if (content) {
      controller.enqueue(encoder.encode(sse({ content })));
    }
  };

  const forwardLine = (
    rawLine: string,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) => {
    if (sentDone) return;

    const line = rawLine.trim();
    if (!line.startsWith('data:')) return;

    const payload = line.slice(5).trimStart();
    if (payload === '[DONE]') {
      enqueueContent(outputFilter.flush(), controller);
      sentDone = true;
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      return;
    }

    try {
      const parsed = JSON.parse(payload);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) {
        enqueueContent(outputFilter.push(content), controller);
      }
    } catch {
      // A malformed upstream event is ignored without discarding later events.
    }
  };

  return upstreamBody
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TransformStream<string, Uint8Array>({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach((line) => forwardLine(line, controller));
      },
      flush(controller) {
        if (buffer.trim()) {
          forwardLine(buffer, controller);
        }
        if (!sentDone) {
          enqueueContent(outputFilter.flush(), controller);
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        }
      },
    }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: '请求内容过大' }, 413);
  }

  const authHeader = req.headers.get('Authorization') || '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: '请求内容过大' }, 413);
  }

  const body = (() => {
    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  })();
  const validationError = validateAiRequest(body);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }

  let requestBody = body;

  if (body.type === 'gua' && body.mode === 'chat') {
    const { data: record, error: recordError } = await supabase
      .from('divination_records')
      .select('timestamp, question, gender, bazi, ben_gua, bian_gua, decoration')
      .eq('id', body.recordId.trim())
      .single();

    if (recordError || !record) {
      return jsonResponse({ error: '卦例不存在或无权访问' }, 404);
    }

    requestBody = {
      ...body,
      data: buildGuaRecordContext(record),
    };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('deepseek_api_key')
    .eq('id', user.id)
    .single();

  const apiKey = profile?.deepseek_api_key || Deno.env.get('DEEPSEEK_API_KEY') || '';
  const apiUrl = (Deno.env.get('DEEPSEEK_API_URL') || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-chat';

  if (!apiKey) {
    return sseError('请先在 API Key 设置中配置 DeepSeek API Key');
  }

  let upstream: Response;

  try {
    upstream = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: body.mode === 'chat' ? 0.5 : 0.6,
        messages: buildDeepSeekMessages(requestBody),
      }),
      signal: req.signal,
    });
  } catch (error) {
    if (req.signal.aborted) {
      return sseError('请求已取消', 499);
    }
    console.error('DeepSeek request failed:', error);
    return sseError('无法连接 AI 服务，请稍后重试', 502);
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    console.error(`DeepSeek responded with ${upstream.status}:`, text.slice(0, 500));
    return sseError(`DeepSeek 请求失败 (${upstream.status})`);
  }

  return new Response(proxyDeepSeekStream(upstream.body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
});
