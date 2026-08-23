import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeepSeekMessages,
  buildGuaRecordContext,
  CHAT_HISTORY_MAX_MESSAGES,
  CHAT_QUESTION_MAX_LENGTH,
  createAiOutputStreamFilter,
  sanitizeChatHistory,
  stripGeneratedDisclaimer,
  validateAiRequest,
} from '../src/utils/aiPrompt';

const baseChatRequest = {
  type: 'gua',
  mode: 'chat',
  recordId: 'record-1',
  question: '应期为什么落在这个月？',
  analysis: '首次解卦结论',
  messages: [],
  data: {
    question: '求职能否成功',
    timestamp: 1710000000000,
    benGua: { name: '乾为天' },
  },
};

test('六爻追问校验问题长度、记录编号和历史上限', () => {
  assert.equal(validateAiRequest(baseChatRequest), null);
  assert.match(
    validateAiRequest({ ...baseChatRequest, question: '问'.repeat(CHAT_QUESTION_MAX_LENGTH + 1) }) || '',
    /不能超过/,
  );
  assert.match(validateAiRequest({ ...baseChatRequest, recordId: '' }) || '', /卦例编号/);
  assert.match(
    validateAiRequest({
      ...baseChatRequest,
      messages: Array.from({ length: CHAT_HISTORY_MAX_MESSAGES + 1 }, () => ({
        role: 'user',
        content: '继续',
      })),
    }) || '',
    /对话历史/,
  );
});

test('只把最近八条有效消息带入模型上下文', () => {
  const history = sanitizeChatHistory([
    { role: 'system', content: '非法角色' },
    ...Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `消息 ${index}`,
    })),
    { role: 'assistant', content: '   ' },
  ]);

  assert.equal(history.length, 8);
  assert.equal(history[0].content, '消息 2');
  assert.equal(history[7].content, '消息 9');
});

test('模型消息保持首次解卦、历史轮次与当前追问的聊天顺序', () => {
  const messages = buildDeepSeekMessages({
    ...baseChatRequest,
    messages: [
      { role: 'user', content: '先看用神' },
      { role: 'assistant', content: '用神取官鬼' },
    ],
  });

  assert.deepEqual(messages.map((message) => message.role), [
    'system',
    'user',
    'assistant',
    'user',
    'assistant',
    'user',
  ]);
  assert.equal(messages[2].content, '首次解卦结论');
  assert.equal(messages.at(-1)?.content, baseChatRequest.question);
  assert.match(messages[1].content, /乾为天/);
});

test('服务端卦例数据兼容 jsonb 对象和历史 JSON 字符串', () => {
  const context = buildGuaRecordContext({
    timestamp: 1710000000000,
    question: '测试问题',
    gender: '男',
    ben_gua: JSON.stringify({ name: '乾为天' }),
    bian_gua: { name: '坤为地' },
    decoration: JSON.stringify({ sixRelatives: ['父母'] }),
    bazi: null,
  });

  assert.deepEqual(context.benGua, { name: '乾为天' });
  assert.deepEqual(context.bianGua, { name: '坤为地' });
  assert.deepEqual(context.decoration, { sixRelatives: ['父母'] });
});

test('解卦和八字输出会移除 DeepSeek 娱乐参考尾注', () => {
  const analysis = '# 结论\n\n用神得日月生扶，事情可成。';
  const disclaimer = '以上内容由DeepSeek生成，仅供娱乐参考。命理分析虽有趣，但现实生活才是我们真正需要关注和领域。';

  assert.equal(stripGeneratedDisclaimer(`${analysis}\n\n---\n\n${disclaimer}`), analysis);
  assert.equal(stripGeneratedDisclaimer('建议脚踏实地推进计划。'), '建议脚踏实地推进计划。');
});

test('流式输出在尾注被拆分为多个分片时仍会拦截', () => {
  const filter = createAiOutputStreamFilter();
  const chunks = [
    '# 结论\n\n'.repeat(12),
    '宜继续观察动爻变化。\n\n---\n\n以上内',
    '容由DeepSeek生成，仅供娱乐参考。',
    '愿你在人生的旅途中，脚踏实地。',
  ];
  const output = chunks.map((chunk) => filter.push(chunk)).join('') + filter.flush();

  assert.match(output, /宜继续观察动爻变化/);
  assert.doesNotMatch(output, /DeepSeek|娱乐参考|命理分析虽有趣/);
});

test('模型系统提示明确禁止署名、娱乐参考和祝福尾注', () => {
  const messages = buildDeepSeekMessages({
    type: 'bazi',
    mode: 'analysis',
    baziData: {},
    dayunData: [],
  });

  assert.match(messages[0].content, /AI 署名/);
  assert.match(messages[0].content, /娱乐参考声明/);
  assert.match(messages[0].content, /祝福结语/);
});
