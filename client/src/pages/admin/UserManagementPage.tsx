import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import ConfirmDialog from '../../components/ConfirmDialog';

interface User {
  id: string;
  username: string;
  email?: string;
  realName?: string;
  status: 0 | 1;
  roles?: string;
  roleCodes?: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface Role {
  id: string;
  roleName: string;
  roleCode: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    email: '',
    realName: '',
    roleIds: [] as string[],
  });

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
    fetchUsers();
    fetchRoles();
  }, [page, search, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: { page, pageSize, search, status: statusFilter },
      });
      setUsers(response.data.data.list);
      setTotal(response.data.data.total);
    } catch (error) {
      console.error('获取用户失败:', error);
      toast.error('获取用户失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles/all');
      setRoles(response.data);
    } catch (error) {
      console.error('获取角色失败:', error);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      email: '',
      realName: '',
      roleIds: [],
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      email: user.email || '',
      realName: user.realName || '',
      roleIds: [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          email: userForm.email,
          realName: userForm.realName,
          roleIds: userForm.roleIds,
        });
        toast.success('用户更新成功');
      } else {
        await api.post('/users', userForm);
        toast.success('用户创建成功');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: 0 | 1) => {
    try {
      await api.patch(`/users/${id}/status`, {
        status: currentStatus === 1 ? 0 : 1,
      });
      toast.success('状态更新成功');
      fetchUsers();
    } catch (error: any) {
      toast.error('状态更新失败');
    }
  };

  const handleResetPassword = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: '重置密码',
      message: `确定要重置用户 ${user.username} 的密码吗？`,
      action: async () => {
        try {
          await api.post(`/users/${user.id}/reset-password`);
          toast.success('密码重置成功');
        } catch (error: any) {
          toast.error(error.response?.data?.message || '密码重置失败');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDelete = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除用户',
      message: `确定要删除用户 ${user.username} 吗？此操作无法撤销。`,
      action: async () => {
        try {
          await api.delete(`/users/${user.id}`);
          toast.success('删除成功');
          fetchUsers();
        } catch (error: any) {
          toast.error(error.response?.data?.message || '删除失败');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-600 mt-1">管理系统用户和权限</p>
        </div>
        <button onClick={handleCreate} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <span>+</span> 创建用户
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索用户名/邮箱/姓名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">全部状态</option>
            <option value="1">正常</option>
            <option value="0">禁用</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">用户名</th>
              <th className="p-4 font-semibold text-gray-600">姓名</th>
              <th className="p-4 font-semibold text-gray-600">邮箱</th>
              <th className="p-4 font-semibold text-gray-600">角色</th>
              <th className="p-4 font-semibold text-gray-600">状态</th>
              <th className="p-4 font-semibold text-gray-600">最后登录</th>
              <th className="p-4 font-semibold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">暂无数据</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-gray-800">{user.username}</span>
                  </td>
                  <td className="p-4 text-gray-600">{user.realName || '-'}</td>
                  <td className="p-4 text-gray-600">{user.email || '-'}</td>
                  <td className="p-4">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {user.roles || '无角色'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusToggle(user.id, user.status)}
                      className={`text-xs px-3 py-1 rounded-full ${
                        user.status === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status === 1 ? '正常' : '禁用'}
                    </button>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm"
                      >
                        重置密码
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingUser ? '编辑用户' : '创建用户'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名 {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  disabled={!!editingUser}
                  required={!editingUser}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                <input
                  type="text"
                  value={userForm.realName}
                  onChange={(e) => setUserForm({ ...userForm, realName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  multiple
                  value={userForm.roleIds}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      roleIds: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">按住 Ctrl/Cmd 可多选</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingUser ? '更新' : '创建'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
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
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default UserManagementPage;
