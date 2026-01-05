import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { divinationApi, analyzeGuaStream } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { shareRecord, copyToClipboard } from '../utils/export';
import GuaDisplay from '../components/GuaDisplay';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ToastContainer from '../components/ToastContainer';
import ScrollToTop from '../components/ScrollToTop';
import type { DivinationRecord } from '../types';

const JieguaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DivinationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
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

    setAnalyzing(true);
    setAnalysis('');

    try {
      await analyzeGuaStream(
        {
          benGua: record.benGua,
          bianGua: record.bianGua,
          decoration: record.decoration,
          question: record.question
        },
        (content) => {
          setAnalysis((prev) => prev + content);
        },
        (error) => {
          console.error('解卦失败:', error);
          toast.error('解卦失败: ' + error);
        },
        () => {
          // 流式传输完成时调用
          toast.success('AI解卦完成');
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

  const handleShare = async () => {
    if (!record) return;

    try {
      const shareText = shareRecord(record);
      const success = await copyToClipboard(shareText);

      if (success) {
        toast.success('分享文本已复制到剪贴板');
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
    // 当分析完成后保存
    if (!analyzing && analysis && id) {
      divinationApi.updateAiAnalysis(id, analysis).catch(console.error);
    }
  }, [analyzing, analysis, id]);

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
          <button
            onClick={() => navigate('/')}
            className="btn-primary mt-4"
          >
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">AI智能解卦</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 左侧：卦象信息 */}
        <div className="space-y-6">
          {/* 占问信息 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">占问事项</h2>
            <p className="text-lg text-gray-800">{record.question}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(record.timestamp).toLocaleString('zh-CN')}
            </p>
          </div>

          {/* 本卦 */}
          <GuaDisplay
            gua={record.benGua}
            decoration={record.decoration}
            title="本卦"
            showDecoration={true}
          />

          {/* 变卦 */}
          {record.bianGua && (
            <GuaDisplay
              gua={record.bianGua}
              title="变卦"
              showDecoration={false}
            />
          )}
        </div>

        {/* 右侧：AI解析 */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">AI解卦分析</h2>

            {!analysis && !analyzing && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-6">点击下方按钮开始AI解卦</p>
                <button
                  onClick={handleAnalyze}
                  className="btn-primary text-lg px-8 py-3"
                >
                  开始解卦
                </button>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">AI正在解卦中，请稍候...</p>
              </div>
            )}

            {analysis && (
              <div>
                <div className="markdown-content prose prose-slate max-w-none mb-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 自定义标题样式
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-primary mb-4 mt-6" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 mb-3 mt-5" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4" {...props} />,
                      // 自定义段落样式
                      p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-3" {...props} />,
                      // 自定义列表样式
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 text-gray-700" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 text-gray-700" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1 ml-4" {...props} />,
                      // 自定义强调样式
                      strong: ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-amber-700" {...props} />,
                      // 自定义代码块样式
                      code: ({node, className, children, ...props}) => {
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
                      // 自定义引用块样式
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-primary pl-4 py-2 mb-3 text-gray-600 italic bg-gray-50" {...props} />
                      ),
                      // 自定义分隔线样式
                      hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                      // 自定义表格样式
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full border border-gray-300" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                      th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props} />,
                      td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                </div>

                {!analyzing && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleAnalyze}
                      className="btn-secondary flex-1"
                    >
                      🔄 重新解卦
                    </button>
                    <button
                      onClick={handleCopyAnalysis}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300"
                    >
                      📋 复制解卦
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate(`/paidian/${id}`)}
              className="flex-1 btn-secondary min-w-[120px]"
            >
              ↩️ 返回排盘
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 min-w-[120px]"
            >
              📋 复制分享
            </button>
            <button
              onClick={() => navigate('/history')}
              className="flex-1 btn-secondary min-w-[120px]"
            >
              📚 历史记录
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 min-w-[120px]"
            >
              🔄 重新起卦
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default JieguaPage;
