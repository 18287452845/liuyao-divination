import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { baziApi, analyzeBaziStream } from '../utils/baziApi';
import type { BaziRecord } from '../types/bazi';

/**
 * 八字AI批注页面
 *
 * 使用AI流式分析八字，实时显示分析结果
 */
const BaziAiAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<BaziRecord | null>(null);
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    if (id) {
      loadRecord(id);
    }
  }, [id]);

  const loadRecord = async (recordId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await baziApi.getRecordById(recordId);
      if (response.success && response.data) {
        setRecord(response.data);
        if (response.data.aiAnalysis) {
          setAnalysis(response.data.aiAnalysis);
        }
      } else {
        throw new Error(response.message || '加载失败');
      }
    } catch (err: any) {
      console.error('加载八字记录失败:', err);
      setError(err.response?.data?.message || err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!record || !id) return;

    setAnalyzing(true);
    setError('');
    setAnalysis('');

    try {
      await analyzeBaziStream(
        {
          recordId: id,
          baziData: record.baziData,
          dayunData: record.dayunData.steps.slice(0, 5),
          name: record.name,
          gender: record.gender,
          question: record.question
        },
        (content) => {
          setAnalysis((prev) => prev + content);
        },
        (errorMsg) => {
          setError(errorMsg);
          setAnalyzing(false);
        },
        () => {
          setAnalyzing(false);
        }
      );
    } catch (err: any) {
      console.error('AI分析失败:', err);
      setError(err.message || 'AI分析失败');
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/bazi')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 标题栏 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">AI批注分析</h1>
            <p className="text-sm text-gray-500 mt-1">
              {record.name && `${record.name} · `}
              {record.yearPillar}{record.monthPillar}{record.dayPillar}{record.hourPillar}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/bazi/display/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回排盘
            </button>
          </div>
        </div>
      </div>

      {/* 分析控制 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {!analysis && !analyzing && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-6">点击下方按钮开始AI批注分析</p>
            <button
              onClick={handleAnalyze}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              开始AI分析
            </button>
          </div>
        )}

        {analyzing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-purple-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span>AI正在分析中...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {analysis && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">分析结果</h2>
              {!analyzing && (
                <button
                  onClick={handleAnalyze}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  重新分析
                </button>
              )}
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {analysis}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">温馨提示</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• AI分析基于传统八字理论，结合现代AI技术生成</li>
          <li>• 分析结果仅供参考，不构成任何决策依据</li>
          <li>• 分析过程采用流式输出，内容会逐步显示</li>
          <li>• 分析完成后会自动保存到记录中</li>
        </ul>
      </div>
    </div>
  );
};

export default BaziAiAnalysisPage;
