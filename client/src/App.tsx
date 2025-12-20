import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DivinationPage from './pages/DivinationPage';
import PaidianPage from './pages/PaidianPage';
import JieguaPage from './pages/JieguaPage';
import HistoryPage from './pages/HistoryPage';
import ToolsPage from './pages/ToolsPage';
import ApiKeySettingsPage from './pages/ApiKeySettingsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import InviteManagementPage from './pages/admin/InviteManagementPage';
import './styles/index.css';

// 主布局组件（包含导航栏的页面）
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 glass border-b-0 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-18 py-2">
            <Link to="/" className="text-2xl font-bold flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                ☯
              </div>
              <span className="font-calligraphy text-3xl text-gray-800 group-hover:text-primary transition-colors">六爻排盘</span>
            </Link>
            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-gray-700 hover:text-primary font-medium transition-colors">起卦</Link>
                <Link to="/history" className="text-gray-700 hover:text-primary font-medium transition-colors">历史记录</Link>
                <Link to="/tools" className="text-gray-700 hover:text-primary font-medium transition-colors">工具箱</Link>
                <Link to="/settings/api-key" className="text-gray-700 hover:text-primary font-medium transition-colors">API设置</Link>
                <Link to="/settings/password" className="text-gray-700 hover:text-primary font-medium transition-colors">修改密码</Link>

                {/* 管理员菜单 */}
                {isAdmin() && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary font-medium flex items-center gap-1">
                    <span>⚙️</span> 后台
                  </Link>
                )}
              </div>

              {/* 用户信息 */}
              <div className="flex items-center gap-4 pl-6 border-l-2 border-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  {user?.realName || user?.username}
                </span>
                <button
                  onClick={logout}
                  className="text-sm bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-4 py-1.5 rounded-full transition-all duration-300 border border-gray-200 hover:border-red-200"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-white/80 backdrop-blur border-t border-gray-200 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 font-serif">
            六爻排盘系统 · 传统易经占卜与现代AI技术的完美融合
          </p>
          <p className="text-xs text-gray-400 mt-2">
            © 2024 LiuYao Divination System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 公开路由 - 登录页 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 受保护的路由 - 需要登录 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DivinationPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/paidian/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PaidianPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jiegua/:id"
            element={
              <ProtectedRoute requirePermission="divination:aiAnalysis">
                <MainLayout>
                  <JieguaPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <HistoryPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ToolsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/api-key"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ApiKeySettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/password"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ChangePasswordPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* 管理后台路由 - 需要管理员权限 */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <MainLayout>
                  <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <h2 className="text-2xl font-bold mb-4">管理后台</h2>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 opacity-50 cursor-not-allowed">
                          <h3 className="font-semibold mb-2">用户管理</h3>
                          <p className="text-sm text-gray-600">开发中...</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 opacity-50 cursor-not-allowed">
                          <h3 className="font-semibold mb-2">角色管理</h3>
                          <p className="text-sm text-gray-600">开发中...</p>
                        </div>
                        <Link to="/admin/invites" className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="font-semibold mb-2 text-purple-700">邀请码管理</h3>
                          <p className="text-sm text-gray-600">创建、管理注册邀请码</p>
                        </Link>
                      </div>
                    </div>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/invites"
            element={
              <ProtectedRoute requireRole="admin">
                <MainLayout>
                  <InviteManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
