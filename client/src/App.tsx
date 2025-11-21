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
import './styles/index.css';

// 主布局组件（包含导航栏的页面）
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="bg-gradient-to-r from-primary to-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">☯</span>
              六爻排盘系统
            </Link>
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="hover:text-accent transition-colors font-semibold"
              >
                起卦
              </Link>
              <Link
                to="/history"
                className="hover:text-accent transition-colors font-semibold"
              >
                历史记录
              </Link>
              <Link
                to="/tools"
                className="hover:text-accent transition-colors font-semibold"
              >
                工具箱
              </Link>

              {/* 管理员菜单 */}
              {isAdmin() && (
                <Link
                  to="/admin"
                  className="hover:text-accent transition-colors font-semibold flex items-center gap-1"
                >
                  <span>⚙️</span> 管理后台
                </Link>
              )}

              {/* 用户信息 */}
              <div className="flex items-center gap-4 ml-4 border-l border-white/30 pl-4">
                <span className="text-sm">
                  {user?.realName || user?.username}
                </span>
                <button
                  onClick={logout}
                  className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main>{children}</main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            六爻排盘系统 - 传统易经占卜与现代AI技术的结合
          </p>
          <p className="text-xs text-gray-400 mt-2">
            仅供学习娱乐，不作为决策依据
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

          {/* 管理后台路由 - 需要管理员权限 */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requireRole="admin">
                <MainLayout>
                  <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <h2 className="text-2xl font-bold mb-4">管理后台</h2>
                      <p className="text-gray-600 mb-4">管理界面开发中...</p>
                      <div className="flex gap-4 justify-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold mb-2">用户管理</h3>
                          <p className="text-sm text-gray-600">创建、编辑、删除用户</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold mb-2">角色管理</h3>
                          <p className="text-sm text-gray-600">管理角色和权限</p>
                        </div>
                      </div>
                    </div>
                  </div>
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
