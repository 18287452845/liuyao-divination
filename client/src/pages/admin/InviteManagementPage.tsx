import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import ConfirmDialog from '../../components/ConfirmDialog';

interface InviteCode {
  id: string;
  code: string;
  name?: string;
  description?: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  status: 0 | 1;
  createdAt: string;
}

const InviteManagementPage: React.FC = () => {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    description: '',
    maxUses: 1,
    expiresAt: '',
    isRandom: true
  });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  const toast = useToast();

  useEffect(() => {
    fetchCodes();
  }, [page, search]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/invite-codes', {
        params: { page, pageSize, search }
      });
      setCodes(response.data.data.list);
      setTotal(response.data.data.total);
    } catch (error) {
      console.error('获取邀请码失败:', error);
      toast.error('获取邀请码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let code = createForm.code;
      if (createForm.isRandom) {
        const randomRes = await api.get('/invite-codes/generate/random');
        code = randomRes.data.data.code;
      }

      await api.post('/invite-codes', {
        ...createForm,
        code
      });

      toast.success('邀请码创建成功');
      setShowCreateModal(false);
      fetchCodes();
      // Reset form
      setCreateForm({
        code: '',
        name: '',
        description: '',
        maxUses: 1,
        expiresAt: '',
        isRandom: true
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建邀请码失败');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除邀请码',
      message: '确定要删除这个邀请码吗？此操作无法撤销。',
      action: async () => {
        try {
          await api.delete(`/invite-codes/${id}`);
          toast.success('删除成功');
          fetchCodes();
        } catch (error: any) {
          toast.error(error.response?.data?.message || '删除失败');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleStatusToggle = async (id: string, currentStatus: 0 | 1) => {
    try {
      await api.patch(`/invite-codes/${id}/status`, {
        status: currentStatus === 1 ? 0 : 1
      });
      toast.success('状态更新成功');
      fetchCodes();
    } catch (error: any) {
      toast.error('状态更新失败');
    }
  };

  return (
    <div className="container mx-auto px-4">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">邀请码管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span> 创建邀请码
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索邀请码/名称/描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-grow"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">邀请码</th>
              <th className="p-4 font-semibold text-gray-600">名称/备注</th>
              <th className="p-4 font-semibold text-gray-600">使用情况</th>
              <th className="p-4 font-semibold text-gray-600">过期时间</th>
              <th className="p-4 font-semibold text-gray-600">状态</th>
              <th className="p-4 font-semibold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">暂无数据</td>
              </tr>
            ) : (
              codes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-primary select-all">{item.code}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{item.name || '-'}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className={`h-2 rounded-full ${item.usedCount >= item.maxUses ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((item.usedCount / item.maxUses) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.usedCount}/{item.maxUses}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '永久有效'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusToggle(item.id, item.status)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        item.status === 1
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {item.status === 1 ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      disabled={item.usedCount > 0}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > pageSize && (
          <div className="p-4 border-t flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2">
              {page} / {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-gray-800 mb-6">创建邀请码</h3>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    邀请码生成方式
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={createForm.isRandom}
                        onChange={() => setCreateForm(prev => ({ ...prev, isRandom: true }))}
                      />
                      <span>随机生成</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!createForm.isRandom}
                        onChange={() => setCreateForm(prev => ({ ...prev, isRandom: false }))}
                      />
                      <span>手动输入</span>
                    </label>
                  </div>
                </div>

                {!createForm.isRandom && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      邀请码
                    </label>
                    <input
                      type="text"
                      value={createForm.code}
                      onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                      className="input-field"
                      placeholder="请输入6-20位大写字母或数字"
                      pattern="[A-Z0-9]{6,20}"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    名称 (可选)
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="input-field"
                    placeholder="例如：微信群邀请、活动发放"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    备注 (可选)
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="备注说明..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      最大使用次数
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={createForm.maxUses}
                      onChange={(e) => setCreateForm({ ...createForm, maxUses: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      过期时间 (可选)
                    </label>
                    <input
                      type="datetime-local"
                      value={createForm.expiresAt}
                      onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type="danger"
      />
    </div>
  );
};

export default InviteManagementPage;
