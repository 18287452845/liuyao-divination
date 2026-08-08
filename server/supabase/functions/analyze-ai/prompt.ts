export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export const CHAT_QUESTION_MAX_LENGTH = 500;
export const CHAT_HISTORY_MAX_MESSAGES = 20;

const CHAT_CONTEXT_MESSAGES = 8;
const CHAT_MESSAGE_MAX_LENGTH = 4000;
const ANALYSIS_MAX_LENGTH = 40000;

const GENERATED_DISCLAIMER_MARKERS = [
  '以上内容由',
  '以上分析由',
  '本内容由',
  '本分析由',
  '仅供娱乐参考',
  '命理分析虽有趣',
  '愿你在人生的旅途中',
];

const STREAM_OUTPUT_GUARD_LENGTH = 96;

const SYSTEM_PROMPT =
  [
    '你只提供传统命理分析，不做绝对化承诺，不替代法律、医疗或投资建议。',
    '涉及时间时必须以用户消息中的北京时间为准；回答必须基于已验证的排盘数据。',
    '回答结束于实质分析或具体建议，不得添加 AI 署名、内容来源、娱乐参考声明或套话式祝福结语。',
  ].join('\n');

function findGeneratedDisclaimerIndex(content: string) {
  return GENERATED_DISCLAIMER_MARKERS.reduce((earliest, marker) => {
    const index = content.indexOf(marker);
    return index >= 0 && (earliest < 0 || index < earliest) ? index : earliest;
  }, -1);
}

function cleanOutputPrefix(content: string) {
  return content
    .replace(/(?:\r?\n\s*(?:---|\*\*\*)\s*)+$/g, '')
    .trimEnd();
}

export function stripGeneratedDisclaimer(content: string) {
  const markerIndex = findGeneratedDisclaimerIndex(content);
  return markerIndex < 0 ? content : cleanOutputPrefix(content.slice(0, markerIndex));
}

export function createAiOutputStreamFilter() {
  let pending = '';
  let blocked = false;

  return {
    push(content: string) {
      if (blocked || !content) return '';

      pending += content;
      const markerIndex = findGeneratedDisclaimerIndex(pending);
      if (markerIndex >= 0) {
        blocked = true;
        const safeContent = cleanOutputPrefix(pending.slice(0, markerIndex));
        pending = '';
        return safeContent;
      }

      if (pending.length <= STREAM_OUTPUT_GUARD_LENGTH) return '';

      const splitIndex = pending.length - STREAM_OUTPUT_GUARD_LENGTH;
      const safeContent = pending.slice(0, splitIndex);
      pending = pending.slice(splitIndex);
      return safeContent;
    },
    flush() {
      if (blocked) return '';

      const safeContent = stripGeneratedDisclaimer(pending);
      pending = '';
      return safeContent;
    },
  };
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

export function sanitizeChatHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((message): message is ChatMessage => (
      Boolean(message) &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0
    ))
    .slice(-CHAT_CONTEXT_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: (message.role === 'assistant'
        ? stripGeneratedDisclaimer(message.content)
        : message.content
      ).trim().slice(0, CHAT_MESSAGE_MAX_LENGTH),
    }))
    .filter((message) => message.content.length > 0);
}

export function validateAiRequest(body: any): string | null {
  if (!body || typeof body !== 'object') {
    return '请求内容无效';
  }

  if (body.type !== 'gua' && body.type !== 'bazi') {
    return '不支持的分析类型';
  }

  const mode = body.mode || 'analysis';
  if (mode !== 'analysis' && mode !== 'chat') {
    return '不支持的分析模式';
  }

  if (mode !== 'chat') {
    return null;
  }

  if (typeof body.question !== 'string' || body.question.trim().length === 0) {
    return '请输入追问内容';
  }

  if (body.question.trim().length > CHAT_QUESTION_MAX_LENGTH) {
    return `追问不能超过 ${CHAT_QUESTION_MAX_LENGTH} 个字符`;
  }

  if (body.messages !== undefined && !Array.isArray(body.messages)) {
    return '对话历史格式无效';
  }

  if (Array.isArray(body.messages) && body.messages.length > CHAT_HISTORY_MAX_MESSAGES) {
    return `对话历史不能超过 ${CHAT_HISTORY_MAX_MESSAGES} 条`;
  }

  if (typeof body.analysis !== 'string' || body.analysis.trim().length === 0) {
    return '请先完成首次 AI 分析';
  }

  if (body.analysis.length > ANALYSIS_MAX_LENGTH) {
    return '首次 AI 分析内容过长';
  }

  if (body.type === 'gua' && (
    typeof body.recordId !== 'string' ||
    body.recordId.trim().length === 0 ||
    body.recordId.length > 128
  )) {
    return '卦例编号无效';
  }

  return null;
}

function parseJsonField(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function buildGuaRecordContext(record: Record<string, unknown>) {
  return {
    benGua: parseJsonField(record.ben_gua),
    bianGua: parseJsonField(record.bian_gua),
    decoration: parseJsonField(record.decoration),
    question: record.question,
    gender: record.gender,
    bazi: parseJsonField(record.bazi),
    timestamp: record.timestamp,
  };
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

function buildBaziChatContext(body: any) {
  return [
    '你正在基于同一份八字排盘继续回答用户追问，不得重新编造四柱、大运或用户未提供的信息。',
    buildTimeContext(body),
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

function buildGuaChatContext(body: any) {
  return [
    '你正在基于同一组六爻排盘继续回答用户追问，不得重新起卦，不得改写本卦、变卦、动爻、世应或用神。',
    buildTimeContext(body),
    buildZengshanGuidance(),
    `卦象数据：${compactJson(body.data || {}, 16000)}`,
    '回答要求：直接回应追问；必须回到当前卦的用神、旺衰、月建日辰、动变、空亡、飞伏或应期依据；不重复整篇首次分析。',
  ].join('\n');
}

export function buildDeepSeekMessages(body: any): DeepSeekMessage[] {
  const mode = body.mode || 'analysis';
  const isBazi = body.type === 'bazi';

  if (mode !== 'chat') {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: isBazi ? buildBaziAnalysisPrompt(body) : buildGuaAnalysisPrompt(body),
      },
    ];
  }

  const analysis = stripGeneratedDisclaimer(body.analysis)
    .trim()
    .slice(0, ANALYSIS_MAX_LENGTH);
  const history = sanitizeChatHistory(body.messages);

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: isBazi ? buildBaziChatContext(body) : buildGuaChatContext(body),
    },
    { role: 'assistant', content: analysis },
    ...history,
    { role: 'user', content: body.question.trim() },
  ];
}
