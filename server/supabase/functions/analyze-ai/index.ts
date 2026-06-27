import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function buildPrompt(body: any) {
  if (body.type === 'bazi') {
    return [
      '你是一位严谨的传统八字命理分析助手。请结合四柱、十神、五行、地支关系和大运，用中文给出结构化分析。',
      `姓名：${body.name || '未提供'}`,
      `性别：${body.gender || '未提供'}`,
      `关注问题：${body.question || '综合分析'}`,
      `八字数据：${JSON.stringify(body.baziData || {})}`,
      `大运数据：${JSON.stringify(body.dayunData || [])}`,
    ].join('\n');
  }

  return [
    '你是一位严谨的传统六爻解卦助手。请结合本卦、变卦、世应、六亲、六神、动爻、空亡和用户问题，用中文给出结构化分析。',
    `问题：${body.question || body.data?.question || '未提供'}`,
    `卦象数据：${JSON.stringify(body.data || body)}`,
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const { data: profile } = await supabase
    .from('users')
    .select('deepseek_api_key')
    .eq('id', user.id)
    .single();

  const apiKey = profile?.deepseek_api_key || Deno.env.get('DEEPSEEK_API_KEY') || '';
  const apiUrl = (Deno.env.get('DEEPSEEK_API_URL') || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-chat';

  if (!apiKey) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(sse({ error: '请先在 API Key 设置中配置 DeepSeek API Key' })));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const upstream = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.6,
      messages: [
        { role: 'system', content: '你只提供传统命理分析，不做绝对化承诺，不替代法律、医疗或投资建议。' },
        { role: 'user', content: buildPrompt(body) },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return new Response(sse({ error: text || `DeepSeek 请求失败 (${upstream.status})` }) + 'data: [DONE]\n\n', {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const stream = upstream.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TransformStream<string, Uint8Array>({
      transform(chunk, controller) {
        const encoder = new TextEncoder();
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(sse({ content })));
            }
          } catch {
            // Ignore partial JSON chunks from the upstream stream.
          }
        }
      },
    }));

  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
});
