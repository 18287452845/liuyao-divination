import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Session {
  id: string;
  userId: string;
  username: string;
  realName?: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
}

const SessionManagementPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const toast = useToast();

  useEffect(() => {
    fetchSessions();
  }, [page, search]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sessions', {
        params: { page, pageSize, search },
      });
      setSessions(response.data.data.list);
      setTotal(response.data.data.total);
    } catch (error) {
      console.error('获取会话失败:', error);
      toast.error('获取会话失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateSession = (session: Session) => {
    setConfirmDialog({
      isOpen: true,
      title: '强制下线',
      message: `确定要强制用户 ${session.username} 下线吗？`,
      action: async () => {
        try {
          await api.delete(`/sessions/${session.id}`);
          toast.success('会话已失效');
          fetchSessions();
        } catch (error: any) {
          toast.error(error.response?.data?.message || '操作失败');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleInvalidateAllUserSessions = (session: Session) => {
    setConfirmDialog({
      isOpen: true,
      title: '强制全部下线',
      message: `确定要强制用户 ${session.username} 的所有会话下线吗？`,
      action: async () => {
        try {
          await api.delete(`/sessions/user/${session.userId}/all`);
          toast.success('所有会话已失效');
          fetchSessions();
        } catch (error: any) {
          toast.error(error.response?.data?.message || '操作失败');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const formatUserAgent = (ua: string) => {
    if (ua.includes('Chrome')) return '🌐 Chrome';
    if (ua.includes('Firefox')) return '🦊 Firefox';
    if (ua.includes('Safari')) return '🧭 Safari';
    if (ua.includes('Edge')) return '🔷 Edge';
    return '💻 其他';
  };

  const getActivityStatus = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 5) return { text: '活跃', color: 'bg-green-100 text-green-700' };
    if (minutes < 30) return { text: '空闲', color: 'bg-yellow-100 text-yellow-700' };
    return { text: '不活跃', color: 'bg-gray-100 text-gray-700' };
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">会话管理</h1>
          <p className="text-gray-600 mt-1">管理用户活跃会话</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="搜索用户名/姓名/IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">活跃会话总数</p>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">活跃用户</p>
          <p className="text-2xl font-bold text-green-600">
            {new Set(sessions.map(s => s.userId)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">当前页会话</p>
          <p className="text-2xl font-bold text-purple-600">{sessions.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">用户</th>
              <th className="p-4 font-semibold text-gray-600">IP地址</th>
              <th className="p-4 font-semibold text-gray-600">浏览器</th>
              <th className="p-4 font-semibold text-gray-600">最后活动</th>
              <th className="p-4 font-semibold text-gray-600">状态</th>
              <th className="p-4 font-semibold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">暂无活跃会话</td>
              </tr>
            ) : (
              sessions.map((session) => {
                const activityStatus = getActivityStatus(session.lastActivity);
                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-800">{session.username}</div>
                        <div className="text-xs text-gray-500">{session.realName || '-'}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm text-gray-600">{session.ipAddress}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatUserAgent(session.userAgent)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(session.lastActivity).toLocaleString('zh-CN')}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full ${activityStatus.color}`}>
                        {activityStatus.text}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleInvalidateSession(session)}
                          className="text-orange-600 hover:text-orange-800 text-sm"
                        >
                          强制下线
                        </button>
                        <button
                          onClick={() => handleInvalidateAllUserSessions(session)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          全部下线
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default SessionManagementPage;
