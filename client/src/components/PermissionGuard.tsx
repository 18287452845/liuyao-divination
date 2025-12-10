/**
 * 权限控制组件
 * 根据用户权限控制UI元素的显示
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean; // 是否需要所有权限/角色，默认false（只需要其中一个）
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 权限守卫组件
 * 根据权限或角色控制子组件的显示
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasRole, isAdmin } = useAuth();

  // 管理员拥有所有权限
  if (isAdmin()) {
    return <>{children}</>;
  }

  // 检查权限
  if (permission || permissions.length > 0) {
    const permsToCheck = permission ? [permission] : permissions;
    
    if (requireAll) {
      // 需要所有权限
      const hasAllPermissions = permsToCheck.every(perm => hasPermission(perm));
      if (!hasAllPermissions) {
        return <>{fallback}</>;
      }
    } else {
      // 只需要其中一个权限
      const hasAnyPermission = permsToCheck.some(perm => hasPermission(perm));
      if (!hasAnyPermission) {
        return <>{fallback}</>;
      }
    }
  }

  // 检查角色
  if (role || roles.length > 0) {
    const rolesToCheck = role ? [role] : roles;
    
    if (requireAll) {
      // 需要所有角色
      const hasAllRoles = rolesToCheck.every(r => hasRole(r));
      if (!hasAllRoles) {
        return <>{fallback}</>;
      }
    } else {
      // 只需要其中一个角色
      const hasAnyRole = rolesToCheck.some(r => hasRole(r));
      if (!hasAnyRole) {
        return <>{fallback}</>;
      }
    }
  }

  // 如果没有权限或角色要求，直接显示
  if (!permission && permissions.length === 0 && !role && roles.length === 0) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

/**
 * 简单的权限检查组件
 */
interface HasPermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({
  permission,
  children,
  fallback = null
}) => {
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
};

/**
 * 简单的角色检查组件
 */
interface HasRoleProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HasRole: React.FC<HasRoleProps> = ({
  role,
  children,
  fallback = null
}) => {
  return (
    <PermissionGuard role={role} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
};

/**
 * 管理员权限检查组件
 */
interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({
  children,
  fallback = null
}) => {
  const { isAdmin } = useAuth();
  
  return isAdmin() ? <>{children}</> : <>{fallback}</>;
};

/**
 * 权限检查Hook
 * 返回权限检查函数
 */
export const usePermissionCheck = () => {
  const { hasPermission, hasRole, isAdmin } = useAuth();

  const checkPermission = (permission: string): boolean => {
    return hasPermission(permission);
  };

  const checkRole = (role: string): boolean => {
    return hasRole(role);
  };

  const checkAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(perm => hasPermission(perm));
  };

  const checkAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(perm => hasPermission(perm));
  };

  const checkAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const checkAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  };

  return {
    checkPermission,
    checkRole,
    checkAnyPermission,
    checkAllPermissions,
    checkAnyRole,
    checkAllRoles,
    isAdmin
  };
};

/**
 * 权限常量
 */
export const PERMISSIONS = {
  // 占卜模块
  DIVINATION_CREATE: 'divination:create',
  DIVINATION_VIEW: 'divination:view',
  DIVINATION_DELETE: 'divination:delete',
  DIVINATION_VIEW_ALL: 'divination:viewAll',
  DIVINATION_AI_ANALYSIS: 'divination:aiAnalysis',

  // 用户管理
  USER_CREATE: 'user:create',
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_STATUS: 'user:status',

  // 角色管理
  ROLE_CREATE: 'role:create',
  ROLE_VIEW: 'role:view',
  ROLE_EDIT: 'role:edit',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN_PERMISSION: 'role:assignPermission',

  // 权限管理
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_MANAGE: 'permission:manage',

  // 审计管理
  AUDIT_VIEW: 'audit:view',
  AUDIT_EXPORT: 'audit:export',
  AUDIT_CLEANUP: 'audit:cleanup',

  // 邀请码管理
  INVITE_VIEW: 'invite:view',
  INVITE_CREATE: 'invite:create',
  INVITE_EDIT: 'invite:edit',
  INVITE_DELETE: 'invite:delete',

  // 系统管理
  SYSTEM_INFO: 'system:info',
  SYSTEM_CONFIG: 'system:config',

  // 数据管理
  DATA_EXPORT: 'data:export',
  DATA_IMPORT: 'data:import',
  DATA_BACKUP: 'data:backup'
} as const;

/**
 * 角色常量
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIP: 'vip'
} as const;

export default PermissionGuard;