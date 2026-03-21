import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/admin', label: '控制台', icon: '盘' },
  { path: '/admin/users', label: '用户管理', icon: '人' },
  { path: '/admin/roles', label: '角色权限', icon: '权' },
  { path: '/admin/invites', label: '邀请码', icon: '码' },
  { path: '/admin/login-logs', label: '登录日志', icon: '志' },
  { path: '/admin/sessions', label: '会话管理', icon: '会' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathMap: Record<string, string> = {
      '/admin': '控制台',
      '/admin/users': '用户管理',
      '/admin/roles': '角色权限',
      '/admin/invites': '邀请码管理',
      '/admin/login-logs': '登录日志',
      '/admin/sessions': '会话管理',
    };

    return pathMap[location.pathname] || '管理后台';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>管</span>
            <span>管理后台</span>
          </h2>
        </div>

        <nav className="p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/admin" className="hover:text-primary transition-colors">
              管理后台
            </Link>
            {location.pathname !== '/admin' && (
              <>
                <span>/</span>
                <span className="text-gray-800 font-medium">{getBreadcrumbs()}</span>
              </>
            )}
          </div>
        </div>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
