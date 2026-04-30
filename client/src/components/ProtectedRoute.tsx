import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: string;
  requireRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirePermission,
  requireRole,
}) => {
  const { user, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requirePermission && !hasPermission(requirePermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">限</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-6">您没有访问此页面的权限，请联系管理员。</p>
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

  if (requireRole && !hasRole(requireRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">限</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-6">
            此功能仅限{requireRole === 'admin' ? '管理员' : requireRole}使用。
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
