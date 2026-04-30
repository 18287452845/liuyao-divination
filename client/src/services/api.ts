import { clearStoredAuth, fetchWithAutoRefresh, getStoredAccessToken } from '../utils/tokenRefresh';
import { normalizeLegacyData, normalizeLegacyText } from '../utils/textNormalize';

const API_BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = getStoredAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function formatApiError(data: any, fallback: string) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return `${normalizeLegacyText(data.message || fallback)}：${data.errors
      .map((item: string) => normalizeLegacyText(item))
      .join('；')}`;
  }

  return normalizeLegacyText(data?.message || fallback);
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    clearStoredAuth(true);
    throw new Error('认证失败，请重新登录');
  }

  if (!response.ok) {
    throw new Error(formatApiError(data, '请求失败'));
  }

  return normalizeLegacyData(data);
}

export const authApi = {
  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const response = await fetchWithAutoRefresh(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

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

  getUserById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: User }>(response);
  },

  createUser: async (data: CreateUserData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  updateUser: async (id: string, data: UpdateUserData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  deleteUser: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  updateUserStatus: async (id: string, status: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  resetPassword: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string; data?: { newPassword: string } }>(response);
  },
};

export interface Role {
  id: string;
  role_name: string;
  role_code: string;
  description?: string;
  status: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  permission_name: string;
  permission_code: string;
  description?: string;
  module: string;
  status: number;
}

export const roleApi = {
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

  getAllRoles: async () => {
    const response = await fetch(`${API_BASE_URL}/roles/all`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Role[]>(response);
  },

  getRoleById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Role }>(response);
  },

  createRole: async (data: Partial<Role>) => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  updateRole: async (id: string, data: Partial<Role>) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  deleteRole: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  updateRoleStatus: async (id: string, status: number) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  getPermissions: async () => {
    const response = await fetch(`${API_BASE_URL}/permissions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; data: Permission[] }>(response);
  },

  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissionIds }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

