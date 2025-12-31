import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { baziApi } from '../utils/baziApi';
import BaziChart from '../components/BaziChart';
import DayunDisplay from '../components/DayunDisplay';
import type { BaziRecord } from '../types/bazi';

/**
 * 八字展示页面
 *
 * 显示完整的八字排盘结果，包括四柱、大运等信息
 */
const BaziDisplayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<BaziRecord | null>(null);

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

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这条记录吗？')) return;

    try {
      const response = await baziApi.deleteRecord(id);
      if (response.success) {
        navigate('/bazi/history');
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || '删除失败');
    }
  };

  const calculateCurrentAge = () => {
    if (!record) return undefined;
    const now = Date.now();
    const ageMs = now - record.birthDatetime;
    return Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
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

  if (error || !record) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error || '记录不存在'}</p>
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 基本信息卡片 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {record.name ? `${record.name}的八字` : '八字排盘'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(record.birthDatetime).toLocaleString('zh-CN')}
              {record.birthLocation && ` · ${record.birthLocation}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/bazi/ai-analysis/${id}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              AI批注
            </button>
            <button
              onClick={() => navigate('/bazi/history')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              历史记录
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              删除
            </button>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">性别：</span>
            <span className="font-medium">{record.gender}</span>
          </div>
          <div>
            <span className="text-gray-500">起运年龄：</span>
            <span className="font-medium">{record.qiyunAge}岁</span>
          </div>
          <div>
            <span className="text-gray-500">当前年龄：</span>
            <span className="font-medium">{calculateCurrentAge()}岁</span>
          </div>
          <div>
            <span className="text-gray-500">真太阳时：</span>
            <span className="font-medium">{record.useTrueSolarTime ? '是' : '否'}</span>
          </div>
        </div>

        {record.question && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-gray-600">问题：</span>
            <p className="text-sm text-gray-800 mt-1">{record.question}</p>
          </div>
        )}
      </div>

      {/* 四柱八字 */}
      <BaziChart
        bazi={record.baziData.bazi}
        shiShen={record.baziData.shiShen}
        wuXing={record.baziData.wuXing}
        showDetails={true}
      />

      {/* 大运排盘 */}
      <DayunDisplay
        dayun={record.dayunData}
        currentAge={calculateCurrentAge()}
        showDetails={true}
      />

      {/* 地支关系 */}
      {record.baziData.relations && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">地支关系</h2>
          <div className="space-y-3">
            {record.baziData.relations.liuHe.length > 0 && (
              <div>
                <span className="font-medium text-green-600">六合：</span>
                {record.baziData.relations.liuHe.map((rel, idx) => (
                  <span key={idx} className="ml-2 text-sm text-gray-700">
                    {rel.description}
                  </span>
                ))}
              </div>
            )}
            {record.baziData.relations.sanHe.length > 0 && (
              <div>
                <span className="font-medium text-blue-600">三合：</span>
                {record.baziData.relations.sanHe.map((rel, idx) => (
                  <span key={idx} className="ml-2 text-sm text-gray-700">
                    {rel.description}
                  </span>
                ))}
              </div>
            )}
            {record.baziData.relations.liuChong.length > 0 && (
              <div>
                <span className="font-medium text-red-600">六冲：</span>
                {record.baziData.relations.liuChong.map((rel, idx) => (
                  <span key={idx} className="ml-2 text-sm text-gray-700">
                    {rel.description}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 空亡 */}
      {record.baziData.kongWang && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">空亡</h2>
          <p className="text-gray-700">
            {record.baziData.kongWang[0]}、{record.baziData.kongWang[1]}
          </p>
        </div>
      )}
    </div>
  );
};

export default BaziDisplayPage;
