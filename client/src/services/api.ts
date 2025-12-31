/**
 * API请求工具
 * 封装了所有与后端的HTTP通信
 */

const API_BASE_URL = '/api';

/**
 * 获取认证头
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * 处理API响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Token过期或无效，清除本地存储并跳转登录
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('认证失败，请重新登录');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

// ==================== 认证相关API ====================

export const authApi = {
  // 修改密码
  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

// ==================== 用户管理API ====================

export interface User {
  id: string;
  username: string;
  email?: string;
  real_name?: string;
  avatar?: string;
  status: number;
  last_login_at?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at: string;
  roles: string[];
  roleCodes: string[];
}

export interface CreateUserData {
  username: string;
  password: string;
  email?: string;
  realName?: string;
  roleIds?: string[];
}

export interface UpdateUserData {
  email?: string;
  realName?: string;
  avatar?: string;
  roleIds?: string[];
}

export const userApi = {
  // 获取用户列表
  getUsers: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/users?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      success: boolean;
      data: { list: User[]; total: number; page: number; pageSize: number };
    }>(response);
  },

  // 获取用户详情
  getUserById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: User }>(response);
  },

  // 创建用户
  createUser: async (data: CreateUserData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 更新用户
  updateUser: async (id: string, data: UpdateUserData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 删除用户
  deleteUser: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 修改用户状态
  updateUserStatus: async (id: string, status: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 重置用户密码
  resetPassword: async (id: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

// ==================== 角色管理API ====================

export interface Role {
  id: string;
  role_name: string;
  role_code: string;
  description?: string;
  status: number;
  created_at: string;
  updated_at: string;
  user_count?: number;
  permission_count?: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  permission_name: string;
  permission_code: string;
  module: string;
  description?: string;
}

export interface CreateRoleData {
  roleName: string;
  roleCode: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  roleName?: string;
  description?: string;
  permissionIds?: string[];
}

export const roleApi = {
  // 获取角色列表
  getRoles: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/roles?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      success: boolean;
      data: { list: Role[]; total: number; page: number; pageSize: number };
    }>(response);
  },

  // 获取所有角色（用于下拉选择）
  getAllRoles: async () => {
    const response = await fetch(`${API_BASE_URL}/roles/all`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Role[] }>(response);
  },

  // 获取角色详情
  getRoleById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Role }>(response);
  },

  // 创建角色
  createRole: async (data: CreateRoleData) => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 更新角色
  updateRole: async (id: string, data: UpdateRoleData) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 删除角色
  deleteRole: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 修改角色状态
  updateRoleStatus: async (id: string, status: number) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // 获取所有权限
  getPermissions: async () => {
    const response = await fetch(`${API_BASE_URL}/permissions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      success: boolean;
      data: { list: Permission[]; grouped: { [module: string]: Permission[] } };
    }>(response);
  },

  // 为角色分配权限
  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissionIds }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};
