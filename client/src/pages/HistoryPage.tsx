import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { divinationApi } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { exportRecordsToJSON } from '../utils/export';
import ToastContainer from '../components/ToastContainer';
import ConfirmDialog from '../components/ConfirmDialog';
import VerificationModal from '../components/VerificationModal';
import type { DivinationRecord } from '../types';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const toast = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; recordId: string | null }>({
    isOpen: false,
    recordId: null
  });
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    record: DivinationRecord | null;
  }>({
    isOpen: false,
    record: null
  });

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    loadRecords(debouncedSearch);
  }, [debouncedSearch]);

  const loadRecords = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const data = await divinationApi.getRecords({
        search: searchQuery,
        limit: 50
      });
      setRecords(data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      toast.error('加载历史记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteDialog({ isOpen: true, recordId: id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.recordId) return;

    try {
      await divinationApi.deleteRecord(deleteDialog.recordId);
      toast.success('删除成功');
      loadRecords(search);
    } catch (error) {
      console.error('删除记录失败:', error);
      toast.error('删除记录失败，请稍后重试');
    } finally {
      setDeleteDialog({ isOpen: false, recordId: null });
    }
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.warning('暂无记录可导出');
      return;
    }

    try {
      exportRecordsToJSON(records);
      toast.success(`成功导出 ${records.length} 条记录`);
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请稍后重试');
    }
  };

  const handleVerify = (record: DivinationRecord) => {
    setVerificationModal({ isOpen: true, record });
  };

  const handleVerificationSubmit = async (data: {
    actual_result: string;
    accuracy_rating: number;
    user_notes?: string;
  }) => {
    if (!verificationModal.record) return;

    try {
      await divinationApi.updateVerification(verificationModal.record.id, data);
      toast.success('验证成功');
      setVerificationModal({ isOpen: false, record: null });
      loadRecords(search);
    } catch (error) {
      console.error('验证失败:', error);
      toast.error('验证失败，请稍后重试');
    }
  };

  const methodMap = {
    time: '时间起卦',
    number: '数字起卦',
    manual: '手动摇卦',
    input: '手动输入'
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="确认删除"
        message="确定要删除这条记录吗？删除后将无法恢复。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, recordId: null })}
      />
      {verificationModal.isOpen && verificationModal.record && (
        <VerificationModal
          record={verificationModal.record}
          onClose={() => setVerificationModal({ isOpen: false, record: null })}
          onSubmit={handleVerificationSubmit}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">历史记录</h1>

        {/* 搜索栏 */}
        <div className="card mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索占问事项... (自动搜索)"
              className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => {
                setSearch('');
              }}
              className="btn-secondary px-8"
            >
              重置
            </button>
            <button
              onClick={handleExport}
              className="bg-accent hover:bg-amber-600 text-white font-semibold py-2 px-8 rounded-lg shadow-md transition-all duration-300"
              title="导出所有记录为JSON文件"
            >
              📥 导出
            </button>
          </div>
          {debouncedSearch && (
            <p className="text-sm text-gray-500">
              搜索 "{debouncedSearch}" 的结果：{records.length} 条
            </p>
          )}
        </div>

      {/* 记录列表 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-xl">加载中...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-6">暂无记录</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            开始起卦
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {records.map((record) => (
            <div key={record.id} className="card hover:shadow-xl transition-shadow cursor-pointer">
              <div onClick={() => navigate(`/paidian/${record.id}`)}>
                {/* 卦名 */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {record.benGua.name}
                    {record.bianGua && (
                      <span className="text-lg text-gray-500 ml-2">
                        → {record.bianGua.name}
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600 line-clamp-2">{record.question}</p>
                </div>

                {/* 信息 */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 flex-wrap">
                  <span>{new Date(record.timestamp).toLocaleString('zh-CN')}</span>
                  <span className="px-2 py-1 bg-secondary/10 text-secondary rounded">
                    {methodMap[record.method as keyof typeof methodMap]}
                  </span>
                  {record.aiAnalysis && (
                    <span className="px-2 py-1 bg-accent/10 text-accent rounded">
                      已解卦
                    </span>
                  )}
                  {record.isVerified && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                      ✓ 已验证
                      {record.accuracyRating && (
                        <span className="ml-1">
                          ({record.accuracyRating}⭐)
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* 简略卦象 */}
                <div className="flex gap-1 mb-4">
                  {record.benGua.lines.slice().reverse().map((line, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-2 rounded ${
                        line === 1 ? 'bg-primary' : 'bg-secondary'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/paidian/${record.id}`)}
                  className="flex-1 py-2 px-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  查看
                </button>
                <button
                  onClick={() => navigate(`/jiegua/${record.id}`)}
                  className="flex-1 py-2 px-4 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors"
                >
                  解卦
                </button>
                {!record.isVerified ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerify(record);
                    }}
                    className="flex-1 py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    title="验证卦象结果"
                  >
                    ✓ 验证
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerify(record);
                    }}
                    className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="修改验证信息"
                  >
                    ✏️ 编辑
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record.id);
                  }}
                  className="py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary px-8 py-3"
          >
            返回首页
          </button>
        </div>
      </div>
    </>
  );
};

export default HistoryPage;
