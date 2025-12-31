import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { baziApi } from '../utils/baziApi';
import type { BaziRecord } from '../types/bazi';

/**
 * 八字历史记录页面
 *
 * 显示用户的所有八字记录列表
 */
const BaziHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<BaziRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadRecords();
  }, [page, search]);

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await baziApi.getRecords({
        search: search || undefined,
        limit: pageSize,
        offset: page * pageSize
      });
      if (response.success && response.data) {
        setRecords(response.data.records);
        setTotal(response.data.total);
      } else {
        throw new Error(response.message || '加载失败');
      }
    } catch (err: any) {
      console.error('加载历史记录失败:', err);
      setError(err.response?.data?.message || err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      const response = await baziApi.deleteRecord(id);
      if (response.success) {
        loadRecords();
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || '删除失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题栏 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">八字历史记录</h1>
            <p className="text-sm text-gray-500 mt-1">共 {total} 条记录</p>
          </div>
          <button
            onClick={() => navigate('/bazi')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            新建八字
          </button>
        </div>

        {/* 搜索框 */}
        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="搜索姓名..."
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* 记录列表 */}
      {!loading && records.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 mb-4">暂无记录</p>
          <button
            onClick={() => navigate('/bazi')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建第一条记录
          </button>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {record.name || '未命名'}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {record.gender}
                    </span>
                    {record.aiAnalysis && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                        已批注
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500">出生时间</span>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(record.birthDatetime).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">四柱</span>
                      <p className="text-sm font-medium text-gray-700">
                        {record.yearPillar} {record.monthPillar} {record.dayPillar} {record.hourPillar}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">起运年龄</span>
                      <p className="text-sm font-medium text-gray-700">{record.qiyunAge}岁</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">创建时间</span>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(record.timestamp).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  {record.question && (
                    <p className="text-sm text-gray-600 line-clamp-2">{record.question}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/bazi/display/${record.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    查看
                  </button>
                  {record.aiAnalysis ? (
                    <button
                      onClick={() => navigate(`/bazi/ai-analysis/${record.id}`)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      批注
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/bazi/ai-analysis/${record.id}`)}
                      className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm"
                    >
                      AI批注
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-700">
            第 {page + 1} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default BaziHistoryPage;
