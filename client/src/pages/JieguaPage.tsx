import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { divinationApi, analyzeGuaStream, chatGuaStream } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { shareRecord, copyToClipboard } from '../utils/export';
import { normalizeLegacyText } from '../utils/textNormalize';
import GuaDisplay from '../components/GuaDisplay';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ToastContainer from '../components/ToastContainer';
import ScrollToTop from '../components/ScrollToTop';
import AiChatPanel from '../components/AiChatPanel';
import type { DivinationRecord } from '../types';
import type { AiChatMessage } from '../types/ai';
import { useRef } from 'react';

const CHAT_STORAGE_PREFIX = 'liuyao-chat:';
const CHAT_MAX_LENGTH = 500;
const CHAT_MAX_STORED_MESSAGES = 20;
const CHAT_SUGGESTIONS = [
  '用神为什么这样取？',
  '应期的判断依据是什么？',
  '哪些动爻变化最关键？',
];

function getStoredChatMessages(recordId: string): AiChatMessage[] {
  try {
    const stored = sessionStorage.getItem(`${CHAT_STORAGE_PREFIX}${recordId}`);
    if (!stored) return [];

    const messages = JSON.parse(stored);
    if (!Array.isArray(messages)) return [];

    return messages
      .filter((message): message is AiChatMessage => (
        Boolean(message) &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0
      ))
      .slice(-CHAT_MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

const JieguaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DivinationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const chatHadContentRef = useRef(false);
  const chatPreviousMessagesRef = useRef<AiChatMessage[]>([]);
  const chatQuestionRef = useRef('');
  const toast = useToast();

  useEffect(() => {
    if (id) {
      loadRecord(id);
    }
  }, [id]);

  const loadRecord = async (recordId: string) => {
    try {
      const data = await divinationApi.getRecordById(recordId);
      setRecord(data);
      setChatMessages(getStoredChatMessages(recordId));
      if (data.aiAnalysis) {
        setAnalysis(data.aiAnalysis);
      }
    } catch (error) {
      console.error('加载卦象失败:', error);
      toast.error('加载卦象失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!record) return;

    chatAbortControllerRef.current?.abort();
    chatAbortControllerRef.current = null;
    setAnalyzing(true);
    setChatting(false);
    setAnalysis('');
    setChatMessages([]);
    setChatError('');
    sessionStorage.removeItem(`${CHAT_STORAGE_PREFIX}${record.id}`);

    try {
      await analyzeGuaStream(
        buildGuaContext(record),
        (content) => {
          setAnalysis((prev) => prev + content);
        },
        (error) => {
          console.error('解卦失败:', error);
          toast.error(`解卦失败：${error}`);
          setAnalyzing(false);
        },
        () => {
          toast.success('AI 解卦完成');
          setAnalyzing(false);
        }
      );
    } catch (error: any) {
      console.error('解卦出错:', error);
      const errorMsg = error.message || '解卦出错，请稍后重试';
      toast.error(errorMsg);
      setAnalyzing(false);
    }
  };

  const buildGuaContext = (currentRecord: DivinationRecord) => ({
    benGua: currentRecord.benGua,
    bianGua: currentRecord.bianGua,
    decoration: currentRecord.decoration,
    question: currentRecord.question,
    gender: currentRecord.gender,
    bazi: currentRecord.bazi,
    timestamp: currentRecord.timestamp,
  });

  const handleChatSubmit = async (suggestedQuestion?: string) => {
    if (!record || !analysis || chatting) return;

    const question = (suggestedQuestion ?? chatInput).trim();
    if (!question) return;
    if (question.length > CHAT_MAX_LENGTH) {
      setChatError(`追问不能超过 ${CHAT_MAX_LENGTH} 个字符`);
      return;
    }

    const userMessage: AiChatMessage = { role: 'user', content: question };
    const previousMessages = chatMessages.slice(-CHAT_MAX_STORED_MESSAGES);
    const history = [...previousMessages, userMessage];
    const controller = new AbortController();

    chatAbortControllerRef.current = controller;
    chatHadContentRef.current = false;
    chatPreviousMessagesRef.current = previousMessages;
    chatQuestionRef.current = question;
    setChatInput('');
    setChatError('');
    setChatting(true);
    setChatMessages([...history, { role: 'assistant', content: '' }]);

    await chatGuaStream(
      {
        recordId: String(record.id),
        question,
        analysis,
        messages: previousMessages,
      },
      (content) => {
        chatHadContentRef.current = true;
        setChatMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (next[lastIndex]?.role === 'assistant') {
            next[lastIndex] = { ...next[lastIndex], content: next[lastIndex].content + content };
          }
          return next;
        });
      },
      (error) => {
        chatAbortControllerRef.current = null;
        setChatMessages(previousMessages);
        setChatInput(question);
        setChatError(error);
        setChatting(false);
      },
      () => {
        chatAbortControllerRef.current = null;
        setChatting(false);
      },
      { signal: controller.signal }
    );
  };

  const handleStopChat = () => {
    const controller = chatAbortControllerRef.current;
    if (!controller) return;

    controller.abort();
    chatAbortControllerRef.current = null;
    setChatting(false);

    if (!chatHadContentRef.current) {
      setChatMessages(chatPreviousMessagesRef.current);
      setChatInput(chatQuestionRef.current);
    }

    toast.warning(chatHadContentRef.current ? '已停止生成，当前回答已保留' : '已取消本次追问');
  };

  const handleClearChat = () => {
    if (!record) return;

    setChatMessages([]);
    setChatInput('');
    setChatError('');
    sessionStorage.removeItem(`${CHAT_STORAGE_PREFIX}${record.id}`);
  };

  const handleShare = async () => {
    if (!record) return;

    try {
      const shareText = shareRecord({
        ...record,
        aiAnalysis: analysis || record.aiAnalysis,
      });
      const success = await copyToClipboard(shareText);

      if (success) {
        toast.success('分享内容已复制到剪贴板');
      } else {
        toast.error('复制失败，请手动复制');
      }
    } catch (error) {
      console.error('分享失败:', error);
      toast.error('分享失败，请稍后重试');
    }
  };

  const handleCopyAnalysis = async () => {
    if (!analysis) {
      toast.warning('暂无解卦内容可复制');
      return;
    }

    try {
      const success = await copyToClipboard(analysis);

      if (success) {
        toast.success('解卦内容已复制到剪贴板');
      } else {
        toast.error('复制失败，请手动复制');
      }
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请稍后重试');
    }
  };

  useEffect(() => {
    if (!analyzing && analysis && id) {
      divinationApi.updateAiAnalysis(id, analysis).catch(console.error);
    }
  }, [analyzing, analysis, id]);

  useEffect(() => {
    if (!record || chatting) return;

    const key = `${CHAT_STORAGE_PREFIX}${record.id}`;
    const completedMessages = chatMessages
      .filter((message) => message.content.trim().length > 0)
      .slice(-CHAT_MAX_STORED_MESSAGES);

    if (completedMessages.length > 0) {
      sessionStorage.setItem(key, JSON.stringify(completedMessages));
    } else {
      sessionStorage.removeItem(key);
    }
  }, [record?.id, chatMessages, chatting]);

  useEffect(() => () => {
    chatAbortControllerRef.current?.abort();
  }, []);

  const formatBazi = (bazi?: DivinationRecord['bazi']) => {
    if (!bazi) return '';
    const parts: string[] = [];
    if (bazi.year) parts.push(`年柱 ${bazi.year}`);
    if (bazi.month) parts.push(`月柱 ${bazi.month}`);
    if (bazi.day) parts.push(`日柱 ${bazi.day}`);
    if (bazi.hour) parts.push(`时柱 ${bazi.hour}`);
    return parts.join(' | ');
  };

  const formatGender = (gender?: string) => {
    if (!gender) return '未知';
    return normalizeLegacyText(gender);
  };

  if (loading) {
    return (
      <>
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <LoadingSkeleton />
        </div>
      </>
    );
  }

  if (!record) {
    return (
      <>
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xl text-red-600">卦象不存在</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            返回首页
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ScrollToTop />
      <div className="container mx-auto px-4 py-8 max-w-[1440px]">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">AI 智能解卦</h1>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] xl:gap-8 items-start">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="card">
              <h2 className="text-lg font-semibold mb-3 text-gray-700">占问信息</h2>
              <p className="text-base leading-relaxed text-gray-800">{record.question}</p>
              <p className="text-sm text-gray-600 mt-2">性别：{formatGender(record.gender)}</p>
              {formatBazi(record.bazi) && <p className="text-sm text-gray-600 mt-1">八字：{formatBazi(record.bazi)}</p>}
              <p className="text-sm text-gray-500 mt-2">{new Date(record.timestamp).toLocaleString('zh-CN')}</p>
            </div>

            <GuaDisplay gua={record.benGua} decoration={record.decoration} title="本卦" showDecoration={true} />

            {record.bianGua && <GuaDisplay gua={record.bianGua} title="变卦" showDecoration={false} />}

            {record.decoration.traditionalAnalysis && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-3 text-gray-700">传统规则初判</h2>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-gray-500">类别</p>
                    <p className="font-semibold text-gray-800">{record.decoration.traditionalAnalysis.categoryLabel}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-gray-500">倾向</p>
                    <p className="font-semibold text-primary">{record.decoration.traditionalAnalysis.finalTendency}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-gray-500">用神</p>
                    <p className="font-semibold text-gray-800">{record.decoration.traditionalAnalysis.yongShen.primaryRelative}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-gray-500">置信度</p>
                    <p className="font-semibold text-gray-800">
                      {Math.round(record.decoration.traditionalAnalysis.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {record.decoration.traditionalAnalysis.reasoningSteps.slice(0, 4).map((step, index) => (
                    <li key={index} className="leading-relaxed">
                      {index + 1}. {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <section className="space-y-6 min-w-0">
            <div className="card min-h-[520px]">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">AI 解卦分析</h2>

              {!analysis && !analyzing && (
                <div className="text-center py-16">
                  <p className="text-gray-500 mb-6">点击下方按钮开始 AI 解卦。</p>
                  <button onClick={handleAnalyze} className="btn-primary text-lg px-8 py-3">
                    开始解卦
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">AI 正在分析卦象，请稍候...</p>
                </div>
              )}

              {analysis && (
                <div>
                  <div className="markdown-content prose prose-slate max-w-none mb-6">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-primary mb-4 mt-6" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-gray-800 mb-3 mt-5" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4" {...props} />,
                        p: ({ node, ...props }) => <p className="text-gray-700 leading-relaxed mb-3" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 text-gray-700" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 text-gray-700" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-1 ml-4" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
                        em: ({ node, ...props }) => <em className="italic text-amber-700" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <code className="block bg-gray-100 p-4 rounded-lg mb-3 overflow-x-auto" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        },
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-primary pl-4 py-2 mb-3 text-gray-600 italic bg-gray-50" {...props} />
                        ),
                        hr: ({ node, ...props }) => <hr className="my-6 border-gray-300" {...props} />,
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-gray-300" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                        th: ({ node, ...props }) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props} />,
                        td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                      }}
                    >
                      {analysis}
                    </ReactMarkdown>
                  </div>

                  {!analyzing && (
                    <div className="flex gap-3 flex-wrap">
                      <button onClick={handleAnalyze} className="btn-secondary flex-1 min-w-[160px]">
                        重新解卦
                      </button>
                      <button
                        onClick={handleCopyAnalysis}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 min-w-[160px]"
                      >
                        复制解卦内容
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {analysis && !analyzing && (
              <AiChatPanel
                messages={chatMessages}
                value={chatInput}
                onValueChange={setChatInput}
                onSubmit={handleChatSubmit}
                loading={chatting}
                error={chatError}
                maxLength={CHAT_MAX_LENGTH}
                suggestions={CHAT_SUGGESTIONS}
                onStop={handleStopChat}
                onClear={handleClearChat}
                placeholder="继续追问，例如：这个卦的应期应该怎么看？"
              />
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button onClick={() => navigate(`/paidian/${id}`)} className="btn-secondary min-w-0">
                返回排盘
              </button>
              <button
                onClick={handleShare}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 min-w-0"
              >
                复制分享
              </button>
              <button onClick={() => navigate('/history')} className="btn-secondary min-w-0">
                历史记录
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 min-w-0"
              >
                重新起卦
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default JieguaPage;
