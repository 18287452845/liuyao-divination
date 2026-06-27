import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  register: (
    username: string,
    password: string,
    email?: string,
    realName?: string,
    inviteCode?: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function usernameToAuthEmail(username: string): string {
  const normalized = username.trim().toLowerCase();
  return normalized.includes('@') ? normalized : `${normalized}@auth.liuyao.app`;
}

async function fetchUserProfile(authUserId: string): Promise<User> {
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, username, email, real_name, avatar')
    .eq('id', authUserId)
    .single();

  if (profileError) {
    throw profileError;
  }

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('roles(id, role_code, role_name)')
    .eq('user_id', authUserId);

  if (rolesError) {
    throw rolesError;
  }

  const roles = (userRoles || [])
    .map((item: any) => item.roles)
    .filter(Boolean)
    .map((role: any) => ({
      id: role.id as string,
      code: role.role_code as string,
      name: role.role_name as string,
    }));

  let permissions: string[] = [];

  if (roles.length > 0) {
    const { data: rolePermissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('role_id, permissions(permission_code)')
      .in(
        'role_id',
        roles.map((role) => role.id)
      );

    if (permissionsError) {
      throw permissionsError;
    }

    permissions = Array.from(
      new Set(
        (rolePermissions || [])
          .map((item: any) => item.permissions?.permission_code)
          .filter(Boolean)
      )
    );
  }

  return {
    userId: profile.id,
    username: profile.username,
    email: profile.email || undefined,
    realName: profile.real_name || undefined,
    avatar: profile.avatar || undefined,
    roles: roles.map(({ code, name }) => ({ code, name })),
    permissions,
  };
}

function storeSession(session: Session | null, user: User | null) {
  if (!session || !user) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return;
  }

  localStorage.setItem('accessToken', session.access_token);
  localStorage.setItem('refreshToken', session.refresh_token);
  localStorage.setItem('user', JSON.stringify(user));
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

  const loadSessionUser = async (session: Session | null) => {
    if (!session?.user?.id) {
      setUser(null);
      setAccessToken(null);
      storeSession(null, null);
      return;
    }

    const userData = await fetchUserProfile(session.user.id);
    setUser(userData);
    setAccessToken(session.access_token);
    storeSession(session, userData);
  };

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          await loadSessionUser(session);
        }
      } catch (error) {
        console.error('鑾峰彇鐢ㄦ埛淇℃伅澶辫触:', error);
        if (mounted) {
          setUser(null);
          setAccessToken(null);
          storeSession(null, null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setTimeout(() => {
        if (!mounted) {
          return;
        }

        void loadSessionUser(session).catch((error) => {
          console.error('同步登录状态失败:', error);
          setUser(null);
          setAccessToken(null);
          storeSession(null, null);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(username),
      password,
    });

    if (error) {
      throw new Error(error.message || '鐧诲綍澶辫触');
    }

    await loadSessionUser(data.session);
  };

  const register = async (
    username: string,
    password: string,
    email?: string,
    realName?: string,
    _inviteCode?: string
  ) => {
    const cleanUsername = username.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      throw new Error('用户名长度必须为 3-20 位，只能包含字母、数字和下划线');
    }

    const { data, error } = await supabase.auth.signUp({
      email: usernameToAuthEmail(cleanUsername),
      password,
      options: {
        data: {
          username: cleanUsername,
          real_name: realName || null,
          contact_email: email || null,
        },
      },
    });

    if (error) {
      throw new Error(error.message || '娉ㄥ唽澶辫触');
    }

    if (!data.session || !data.user) {
      throw new Error('注册已提交，但当前 Supabase 项目要求邮箱确认。请关闭邮箱确认，或使用真实邮箱完成确认后登录。');
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      username: cleanUsername,
      password: '',
      email: email || null,
      real_name: realName || null,
      status: 1,
      last_password_change: new Date().toISOString(),
    });

    if (profileError) {
      throw new Error(profileError.message || '鍒涘缓鐢ㄦ埛璧勬枡澶辫触');
    }

    await loadSessionUser(data.session);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    storeSession(null, null);
    void supabase.auth.signOut();
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
