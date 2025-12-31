import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Role {
  id: string;
  roleName: string;
  roleCode: string;
  description?: string;
  status: 0 | 1;
  userCount: number;
  permissionCount: number;
  createdAt: string;
}

interface Permission {
  id: string;
  permissionName: string;
  permissionCode: string;
  module: string;
  description?: string;
}

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<{ [key: string]: Permission[] }>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    roleName: '',
    roleCode: '',
    description: '',
    permissionIds: [] as string[],
  });

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

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
    fetchRoles();
    fetchPermissions();
  }, [page, search]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/roles', {
        params: { page, pageSize, search },
      });
      setRoles(response.data.data.list);
      setTotal(response.data.data.total);
    } catch (error) {
      console.error('获取角色失败:', error);
      toast.error('获取角色失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions');
      setGroupedPermissions(response.data.data.grouped);
    } catch (error) {
      console.error('获取权限失败:', error);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const response = await api.get(`/roles/${roleId}`);
      return response.data.data.permissions || [];
    } catch (error) {
      console.error('获取角色权限失败:', error);
      return [];
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setRoleForm({
      roleName: '',
      roleCode: '',
      description: '',
      permissionIds: [],
    });
    setShowModal(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description || '',
      permissionIds: [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, {
          roleName: roleForm.roleName,
          description: roleForm.description,
          permissionIds: roleForm.permissionIds,
        });
        toast.success('角色更新成功');
      } else {
        await api.post('/roles', roleForm);
        toast.success('角色创建成功');
      }
      setShowModal(false);
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleAssignPermissions = async (role: Role) => {
    setSelectedRole(role);
    const rolePermissions = await fetchRolePermissions(role.id);
    setSelectedPermissions(rolePermissions.map((p: any) => p.id));
    setShowPermissionModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await api.post(`/roles/${selectedRole.id}/permissions`, {
        permissionIds: selectedPermissions,
      });
      toast.success('权限分配成功');
      setShowPermissionModal(false);
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '权限分配失败');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: 0 | 1) => {
    try {
      await api.patch(`/roles/${id}/status`, {
        status: currentStatus === 1 ? 0 : 1,
      });
      toast.success('状态更新成功');
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '状态更新失败');
    }
  };

  const handleDelete = (role: Role) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除角色',
      message: `确定要删除角色 ${role.roleName} 吗？此操作无法撤销。`,
      action: async () => {
        try {
          await api.delete(`/roles/${role.id}`);
          toast.success('删除成功');
          fetchRoles();
        } catch (error: any) {
          toast.error(error.response?.data?.message || '删除失败');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModule = (module: string) => {
    const modulePermissions = groupedPermissions[module] || [];
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    const allSelected = modulePermissionIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !modulePermissionIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePermissionIds])]);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">角色权限管理</h1>
          <p className="text-gray-600 mt-1">管理系统角色和权限分配</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span>+</span> 创建角色
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="搜索角色名称/代码/描述..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">角色名称</th>
              <th className="p-4 font-semibold text-gray-600">角色代码</th>
              <th className="p-4 font-semibold text-gray-600">描述</th>
              <th className="p-4 font-semibold text-gray-600">用户数</th>
              <th className="p-4 font-semibold text-gray-600">权限数</th>
              <th className="p-4 font-semibold text-gray-600">状态</th>
              <th className="p-4 font-semibold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">暂无数据</td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-gray-800">{role.roleName}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-gray-600">{role.roleCode}</span>
                  </td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">
                    {role.description || '-'}
                  </td>
                  <td className="p-4">
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {role.userCount} 人
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {role.permissionCount} 项
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusToggle(role.id, role.status)}
                      className={`text-xs px-3 py-1 rounded-full ${
                        role.status === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {role.status === 1 ? '正常' : '禁用'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAssignPermissions(role)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        分配权限
                      </button>
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
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
              {editingRole ? '编辑角色' : '创建角色'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleForm.roleName}
                  onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色代码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleForm.roleCode}
                  onChange={(e) => setRoleForm({ ...roleForm, roleCode: e.target.value })}
                  disabled={!!editingRole}
                  required={!editingRole}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingRole ? '更新' : '创建'}
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

      {/* Permission Assignment Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              为 {selectedRole.roleName} 分配权限
            </h2>
            <div className="space-y-4">
              {Object.keys(groupedPermissions).map((module) => (
                <div key={module} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={groupedPermissions[module].every((p) =>
                        selectedPermissions.includes(p.id)
                      )}
                      onChange={() => toggleModule(module)}
                      className="w-4 h-4"
                    />
                    <h3 className="font-bold text-gray-800">{module}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    {groupedPermissions[module].map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">{permission.permissionName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSavePermissions}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
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

export default RoleManagementPage;
