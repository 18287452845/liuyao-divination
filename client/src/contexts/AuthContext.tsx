import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { clearStoredAuth, fetchWithAutoRefresh } from '../utils/tokenRefresh';

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

function formatApiError(data: any, fallback: string) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return `${data.message || fallback}：${data.errors.join('；')}`;
  }

  return data?.message || fallback;
}

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

  const fetchCurrentUser = async () => {
    try {
      const response = await fetchWithAutoRefresh('/api/auth/me');
      const data = await response.json();

      if (!response.ok || !data.success) {
        clearStoredAuth();
        setUser(null);
        setAccessToken(null);
        return;
      }

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
      setAccessToken(localStorage.getItem('accessToken'));
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('获取用户信息失败:', error);
      clearStoredAuth();
      setUser(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (storedUser && (storedToken || storedRefreshToken)) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        await fetchCurrentUser();
      } else {
        clearStoredAuth();
      }

      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(formatApiError(data, '登录失败'));
      }

      const userData: User = {
        userId: data.data.userId,
        username: data.data.username,
        roles: data.data.roles,
        permissions: [],
      };

      setAccessToken(data.data.accessToken);
      setUser(userData);

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      await fetchCurrentUser();
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string, email?: string, realName?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email, realName }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(formatApiError(data, '注册失败'));
      }

      await login(username, password);
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    clearStoredAuth();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    if (user.roles.some((role) => role.code === 'admin')) {
      return true;
    }

    return user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.code === role);
  };

  const isAdmin = (): boolean => hasRole('admin');

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
