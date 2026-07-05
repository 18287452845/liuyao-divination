import { createClient } from 'npm:@supabase/supabase-js@2';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function formatChinaTime(value: unknown) {
  const date = typeof value === 'number' || typeof value === 'string'
    ? new Date(value)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return '未提供有效时间';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function compactJson(value: unknown, maxLength = 12000) {
  const text = JSON.stringify(value || {});
  return text.length > maxLength ? `${text.slice(0, maxLength)}...（已截断）` : text;
}

function buildTimeContext(body: any) {
  const requestTime = body.requestTimestamp || Date.now();
  const divinationTime = body.data?.timestamp ?? body.timestamp;
  const birthTime = body.birthDatetime ?? body.data?.birthDatetime;

  return [
    `当前北京时间：${formatChinaTime(requestTime)}。`,
    `当前 Unix 毫秒时间戳：${requestTime}。`,
    divinationTime
      ? `本次起卦时间：${formatChinaTime(divinationTime)}，Unix 毫秒时间戳：${divinationTime}。`
      : '本次起卦时间：未提供，若问题涉及时间，请以“当前北京时间”为准。',
    birthTime
      ? `出生时间：${formatChinaTime(birthTime)}，Unix 毫秒时间戳：${birthTime}。`
      : '',
    '涉及“现在、今天、近期、当前年份、年龄、应期”等判断时，必须以上述北京时间和起卦/出生时间为准。',
  ].filter(Boolean).join('\n');
}

function buildZengshanGuidance() {
  return [
    '《增删卜易》式六爻分析框架：',
    '1. 先按占事类别确定用神；若用神不现，再看伏神、月建或相关爻，不可随意改用神。',
    '2. 得用神后，先看月建、日辰定旺衰，再看空亡、月破、日冲、日合、墓绝。',
    '3. 分清元神、忌神、仇神：生用者为元神，克用者为忌神，克元神而助忌神者为仇神。',
    '4. 重点看动爻与变爻：动爻有权，回头生克、化进退、化合冲、化空破墓绝会改变成败。',
    '5. 世应代表主客与人我关系，不能只看卦名吉凶；六神可作辅助，不可压过用神旺衰。',
    '6. 飞伏、两现、独发、暗动、合冲刑害、旬空出空都要回到“是否能生扶用神或制忌神”判断。',
    '7. 应期从用神、动爻、变爻、冲合、填实、出空、值日值月取，不要脱离卦象编造日期。',
  ].join('\n');
}

function formatChatHistory(messages: ChatMessage[] = []) {
  return messages
    .slice(-8)
    .map((message) => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`)
    .join('\n');
}

function buildBaziAnalysisPrompt(body: any) {
  return [
    '你是一位严谨的传统八字命理分析助手。请结合四柱、十神、五行、地支关系和大运，用中文给出结构化分析。',
    buildTimeContext(body),
    '分析要求：先看日主与月令，再看五行强弱、十神组合、地支关系、大运阶段；避免绝对化断语。',
    `姓名：${body.name || '未提供'}`,
    `性别：${body.gender || '未提供'}`,
    `关注问题：${body.question || '综合分析'}`,
    `八字数据：${compactJson(body.baziData)}`,
    `大运数据：${compactJson(body.dayunData || [])}`,
  ].join('\n');
}

function buildBaziChatPrompt(body: any) {
  return [
    '你正在基于同一份八字排盘继续回答用户追问，不得重新编造四柱、大运或用户未提供的信息。',
    buildTimeContext(body),
    `用户追问：${body.question || '未提供'}`,
    `已有 AI 分析：${body.analysis || '未提供'}`,
    `临时对话历史：\n${formatChatHistory(body.messages || []) || '无'}`,
    `八字数据：${compactJson(body.baziData)}`,
    `大运数据：${compactJson(body.dayunData || [])}`,
    '回答要求：直接回应追问；必要时引用四柱、十神、五行、大运依据；不重复整篇首次分析。',
  ].join('\n');
}

function buildGuaAnalysisPrompt(body: any) {
  return [
    '你是一位严谨的传统六爻解卦助手。请结合本卦、变卦、世应、六亲、六神、动爻、空亡和用户问题，用中文给出结构化分析。',
    buildTimeContext(body),
    buildZengshanGuidance(),
    '输出结构建议：结论摘要、用神取法、旺衰与生克、动变与飞伏、应期、风险与建议。',
    '不得只按卦名泛泛而谈；不得重新起卦；不得脱离传入的卦象数据。',
    `问题：${body.question || body.data?.question || '未提供'}`,
    `卦象数据：${compactJson(body.data || body, 18000)}`,
  ].join('\n');
}

function buildGuaChatPrompt(body: any) {
  return [
    '你正在基于同一组六爻排盘继续回答用户追问，不得重新起卦，不得改写本卦、变卦、动爻、世应或用神。',
    buildTimeContext(body),
    buildZengshanGuidance(),
    `用户追问：${body.question || '未提供'}`,
    `已有 AI 解卦：${body.analysis || '未提供'}`,
    `临时对话历史：\n${formatChatHistory(body.messages || []) || '无'}`,
    `卦象数据：${compactJson(body.data || {}, 16000)}`,
    '回答要求：直接回应追问；必须回到当前卦的用神、旺衰、月建日辰、动变、空亡、飞伏或应期依据；不重复整篇首次分析。',
  ].join('\n');
}

function buildPrompt(body: any) {
  const mode = body.mode || 'analysis';

  if (body.type === 'bazi') {
    return mode === 'chat' ? buildBaziChatPrompt(body) : buildBaziAnalysisPrompt(body);
  }

  return mode === 'chat' ? buildGuaChatPrompt(body) : buildGuaAnalysisPrompt(body);
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
      temperature: body.mode === 'chat' ? 0.5 : 0.6,
      messages: [
        {
          role: 'system',
          content: '你只提供传统命理分析，不做绝对化承诺，不替代法律、医疗或投资建议。涉及时间时必须以用户消息中的北京时间为准；回答必须基于用户传入的排盘数据。',
        },
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
            // Ignore malformed chunks from the upstream stream.
          }
        }
      },
    }));

  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
});
