import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { divinationApi } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { exportRecordToJSON, shareRecord, copyToClipboard } from '../utils/export';
import GuaDisplay from '../components/GuaDisplay';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ToastContainer from '../components/ToastContainer';
import type { DivinationRecord } from '../types';

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
        toast.success('分享文本已复制到剪贴板');
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">卦象排盘</h1>

      {/* 占问信息 */}
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
            <span className="font-semibold">起卦方法：</span>
            {record.method === 'time' ? '时间起卦' : record.method === 'number' ? '数字起卦' : '手动摇卦'}
          </p>
        </div>
      </div>

      {/* 本卦和变卦 */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <GuaDisplay
          gua={record.benGua}
          decoration={record.decoration}
          title="本卦"
          showDecoration={true}
        />

        {record.bianGua && (
          <GuaDisplay
            gua={record.bianGua}
            decoration={record.decoration}
            title="变卦"
            showDecoration={true}
          />
        )}
      </div>

      {/* 应期推断 */}
      {record.decoration.yingQi && record.decoration.yingQi.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <span className="mr-2">⏰</span>
            应期推断
            <span className="ml-2 text-xs text-gray-500 font-normal">（事情应验的时间）</span>
          </h2>

          <div className="space-y-4">
            {record.decoration.yingQi.map((yingqi, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  yingqi.type === '近应'
                    ? 'bg-green-50 border-green-500'
                    : yingqi.type === '中应'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-500'
                }`}
              >
                {/* 标题行 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      yingqi.type === '近应'
                        ? 'bg-green-500 text-white'
                        : yingqi.type === '中应'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {yingqi.type}
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {yingqi.period}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    yingqi.confidence === '高'
                      ? 'bg-green-100 text-green-700'
                      : yingqi.confidence === '中'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    可信度: {yingqi.confidence}
                  </span>
                </div>

                {/* 详细说明 */}
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {yingqi.description}
                </p>

                {/* 推断依据 */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600 mb-1">推断依据：</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {yingqi.basis.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                {/* 具体地支 */}
                {yingqi.specificBranches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-600 mr-2">
                      关键地支:
                    </span>
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

          {/* 说明 */}
          <div className="mt-4 p-3 bg-amber-50 border-l-4 border-accent rounded-r text-sm text-gray-600">
            <p className="mb-1">
              <strong>💡 应期说明：</strong>
            </p>
            <p className="text-xs leading-relaxed">
              应期是根据《增删卜易》《卜筮正宗》的传统理论推断的事情应验时间。
              实际应验需结合占问事项、用神旺衰、外部环境等因素综合判断。
              应期推断仅供参考，不可尽信。
            </p>
          </div>
        </div>
      )}

      {/* 卦辞显示 */}
      {record.decoration?.guaCi && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">📜</span>
            卦辞
          </h2>
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {record.decoration.guaCi}
            </p>
          </div>
        </div>
      )}

      {/* 爻辞显示 */}
      {record.decoration?.yaoCi && record.decoration.yaoCi.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">📖</span>
            爻辞
            <span className="ml-2 text-xs text-gray-500 font-normal">（从下往上依次为初、二、三、四、五、上爻）</span>
          </h2>
          <div className="space-y-4">
            {record.decoration.yaoCi.map((yao, idx) => (
              <div
                key={idx}
                className="bg-blue-50 border border-blue-200 p-5 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <span className="inline-block bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm mr-3">
                    {['初', '二', '三', '四', '五', '上'][idx]}爻
                  </span>
                  {record.benGua.changes[idx] && (
                    <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      动爻
                    </span>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {yao}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r text-sm text-gray-600">
            <p className="mb-1">
              <strong>💡 爻辞说明：</strong>
            </p>
            <p className="text-xs leading-relaxed">
              爻辞是周易对每一爻的判断和说明。六爻从下往上依次为：初爻、二爻、三爻、四爻、五爻、上爻。
              动爻的爻辞对占断尤为重要，需重点参考。
            </p>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={handleAnalyze}
          className="btn-primary text-lg px-8 py-3"
        >
          🤖 AI智能解卦
        </button>
        <button
          onClick={handleShare}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300"
        >
          📋 复制分享
        </button>
        <button
          onClick={handleExport}
          className="bg-accent hover:bg-amber-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300"
        >
          📥 导出JSON
        </button>
        <button
          onClick={() => navigate('/history')}
          className="btn-secondary text-lg px-8 py-3"
        >
          📚 历史记录
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300"
        >
          🔄 重新起卦
        </button>
      </div>
    </div>
    </>
  );
};

export default PaidianPage;
