import { supabase } from '../lib/supabase';

export const authApi = {
  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      throw new Error('认证失败，请重新登录');
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.oldPassword,
    });

    if (verifyError) {
      throw new Error('旧密码错误');
    }

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (error) {
      throw new Error(error.message || '修改密码失败');
    }

    return { success: true, message: '密码修改成功' };
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
