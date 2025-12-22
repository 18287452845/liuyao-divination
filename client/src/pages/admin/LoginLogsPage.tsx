import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

interface LoginLog {
  id: string;
  userId?: string;
  username: string;
  realName?: string;
  ipAddress: string;
  loginStatus: 0 | 1;
  statusText: string;
  loginTime: string;
  failReason?: string;
}

const LoginLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toast = useToast();

  useEffect(() => {
    fetchLogs();
  }, [page, search, statusFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs/login', {
        params: {
          page,
          pageSize,
          search,
          status: statusFilter,
          startDate,
          endDate
        },
      });
      setLogs(response.data.data.list);
      setTotal(response.data.data.total);
    } catch (error) {
      console.error('获取登录日志失败:', error);
      toast.error('获取登录日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/logs/login/export', {
        params: { search, status: statusFilter, startDate, endDate },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `login_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('导出成功');
    } catch (error: any) {
      toast.error('导出失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">登录日志</h1>
          <p className="text-gray-600 mt-1">查看系统登录记录</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>📥</span> 导出日志
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="搜索用户名/IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">全部状态</option>
            <option value="1">登录成功</option>
            <option value="0">登录失败</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="开始日期"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="结束日期"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">总登录次数</p>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">成功登录</p>
          <p className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.loginStatus === 1).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">失败登录</p>
          <p className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.loginStatus === 0).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">登录时间</th>
              <th className="p-4 font-semibold text-gray-600">用户名</th>
              <th className="p-4 font-semibold text-gray-600">真实姓名</th>
              <th className="p-4 font-semibold text-gray-600">IP地址</th>
              <th className="p-4 font-semibold text-gray-600">状态</th>
              <th className="p-4 font-semibold text-gray-600">失败原因</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">暂无数据</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(log.loginTime).toLocaleString('zh-CN')}
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-800">{log.username}</span>
                  </td>
                  <td className="p-4 text-gray-600">{log.realName || '-'}</td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-gray-600">{log.ipAddress}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        log.loginStatus === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {log.statusText}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {log.failReason || '-'}
                  </td>
                </tr>
              ))
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
    </div>
  );
};

export default LoginLogsPage;
