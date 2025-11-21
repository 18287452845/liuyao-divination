/**
 * 认证上下文
 * 管理全局的用户认证状态
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: string;
  username: string;
  email?: string;
  realName?: string;
  avatar?: string;
  roles: Array<{
    code: string;
    name: string;
  }>;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string, realName?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 从localStorage恢复认证状态
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // 登录
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }

      // 保存token和用户信息
      const userData: User = {
        userId: data.data.userId,
        username: data.data.username,
        roles: data.data.roles,
        permissions: [], // 登录后再获取完整用户信息
      };

      setAccessToken(data.data.accessToken);
      setUser(userData);

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // 获取完整用户信息
      await fetchCurrentUser(data.data.accessToken);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  // 注册
  const register = async (username: string, password: string, email?: string, realName?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email, realName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }

      // 注册成功后自动登录
      await login(username, password);
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  };

  // 获取当前用户完整信息
  const fetchCurrentUser = async (token?: string) => {
    try {
      const authToken = token || accessToken;
      if (!authToken) return;

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData: User = {
          userId: data.data.userId,
          username: data.data.username,
          email: data.data.email,
          realName: data.data.realName,
          avatar: data.data.avatar,
          roles: data.data.roles,
          permissions: data.data.permissions,
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // 登出
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  // 更新用户信息
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // 检查是否有某个权限
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // 管理员拥有所有权限
    if (user.roles.some(role => role.code === 'admin')) {
      return true;
    }

    return user.permissions.includes(permission);
  };

  // 检查是否有某个角色
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.some(r => r.code === role);
  };

  // 是否是管理员
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const value: AuthContextType = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    hasRole,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
