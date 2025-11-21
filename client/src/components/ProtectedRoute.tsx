/**
 * 受保护的路由组件
 * 需要登录才能访问的页面使用此组件包裹
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: string; // 需要的权限
  requireRole?: string; // 需要的角色
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirePermission,
  requireRole,
}) => {
  const { user, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查权限
  if (requirePermission && !hasPermission(requirePermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-6">
            您没有访问此页面的权限，请联系管理员
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 检查角色
  if (requireRole && !hasRole(requireRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-6">
            此功能仅限{requireRole === 'admin' ? '管理员' : 'VIP用户'}使用
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
