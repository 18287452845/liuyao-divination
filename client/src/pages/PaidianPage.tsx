import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { divinationApi } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { exportRecordToJSON, shareRecord, copyToClipboard } from '../utils/export';
import GuaDisplay from '../components/GuaDisplay';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ToastContainer from '../components/ToastContainer';
import type { DivinationMethod, DivinationRecord } from '../types';

const methodLabels: Record<DivinationMethod, string> = {
  time: '时间起卦',
  number: '数字起卦',
  manual: '手动摇卦',
  input: '手动输入',
};

const confidenceStyles = {
  高: 'bg-green-100 text-green-700',
  中: 'bg-blue-100 text-blue-700',
  低: 'bg-gray-100 text-gray-700',
};

const responseStyles = {
  近应: 'bg-green-50 border-green-500',
  中应: 'bg-blue-50 border-blue-500',
  远应: 'bg-gray-50 border-gray-500',
};

const responseBadgeStyles = {
  近应: 'bg-green-500 text-white',
  中应: 'bg-blue-500 text-white',
  远应: 'bg-gray-500 text-white',
};

const PaidianPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DivinationRecord | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error('加载卦象失败:', error);
      toast.error('加载卦象失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    navigate(`/jiegua/${id}`);
  };

  const handleExport = () => {
    if (!record) return;

    try {
      exportRecordToJSON(record);
      toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请稍后重试');
    }
  };

  const handleShare = async () => {
    if (!record) return;

    try {
      const shareText = shareRecord(record);
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

  if (loading) {
    return (
      <>
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">卦象排盘</h1>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">占问信息</h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-semibold">占问事项：</span>
              {record.question}
            </p>
            <p>
              <span className="font-semibold">起卦时间：</span>
              {new Date(record.timestamp).toLocaleString('zh-CN')}
            </p>
            <p>
              <span className="font-semibold">起卦方式：</span>
              {methodLabels[record.method] || record.method}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <GuaDisplay gua={record.benGua} decoration={record.decoration} title="本卦" showDecoration={true} />

          {record.bianGua && (
            <GuaDisplay gua={record.bianGua} decoration={record.decoration} title="变卦" showDecoration={true} />
          )}
        </div>

        {record.decoration.yingQi && record.decoration.yingQi.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">应期推断</h2>

            <div className="space-y-4">
              {record.decoration.yingQi.map((yingqi, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${responseStyles[yingqi.type] || responseStyles.远应}`}
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${responseBadgeStyles[yingqi.type] || responseBadgeStyles.远应}`}
                      >
                        {yingqi.type}
                      </span>
                      <span className="text-lg font-bold text-gray-800">{yingqi.period}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${confidenceStyles[yingqi.confidence] || confidenceStyles.低}`}
                    >
                      可信度：{yingqi.confidence}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3 leading-relaxed">{yingqi.description}</p>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600 mb-1">推断依据：</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {yingqi.basis.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {yingqi.specificBranches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-600 mr-2">关键地支：</span>
                      {yingqi.specificBranches.map((branch, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 mr-2"
                        >
                          {branch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border-l-4 border-accent rounded-r text-sm text-gray-600">
              应期推断用于辅助判断事情可能应验的时间点，实际还需结合占问背景、用神旺衰和现实环境综合分析。
            </div>
          </div>
        )}

        {record.decoration?.guaCi && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">卦辞</h2>
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{record.decoration.guaCi}</p>
            </div>
          </div>
        )}

        {record.decoration?.yaoCi && record.decoration.yaoCi.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">爻辞</h2>
            <div className="space-y-4">
              {record.decoration.yaoCi.map((yao, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 p-5 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3 gap-3 flex-wrap">
                    <span className="inline-block bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                      {['初', '二', '三', '四', '五', '上'][idx]}爻
                    </span>
                    {record.benGua.changes[idx] && (
                      <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        动爻
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{yao}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r text-sm text-gray-600">
              爻辞按照初、二、三、四、五、上的顺序展示。若该爻为动爻，通常需要重点参考其变化含义。
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={handleAnalyze} className="btn-primary text-lg px-8 py-3">
            AI 智能解卦
          </button>
          <button
            onClick={handleShare}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300"
          >
            复制分享
          </button>
          <button
            onClick={handleExport}
            className="bg-accent hover:bg-amber-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300"
          >
            导出 JSON
          </button>
          <button onClick={() => navigate('/history')} className="btn-secondary text-lg px-8 py-3">
            历史记录
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300"
          >
            重新起卦
          </button>
        </div>
      </div>
    </>
  );
};

export default PaidianPage;
