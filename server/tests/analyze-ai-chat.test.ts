import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeepSeekMessages,
  buildGuaRecordContext,
  CHAT_HISTORY_MAX_MESSAGES,
  CHAT_QUESTION_MAX_LENGTH,
  sanitizeChatHistory,
  validateAiRequest,
} from '../supabase/functions/analyze-ai/prompt.ts';

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
