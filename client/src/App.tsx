import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import './styles/index.css';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DivinationPage = lazy(() => import('./pages/DivinationPage'));
const PaidianPage = lazy(() => import('./pages/PaidianPage'));
const JieguaPage = lazy(() => import('./pages/JieguaPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const ApiKeySettingsPage = lazy(() => import('./pages/ApiKeySettingsPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const BaziInputPage = lazy(() => import('./pages/BaziInputPage'));
const BaziDisplayPage = lazy(() => import('./pages/BaziDisplayPage'));
const BaziAiAnalysisPage = lazy(() => import('./pages/BaziAiAnalysisPage'));
const BaziHistoryPage = lazy(() => import('./pages/BaziHistoryPage'));
const InviteManagementPage = lazy(() => import('./pages/admin/InviteManagementPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const RoleManagementPage = lazy(() => import('./pages/admin/RoleManagementPage'));
const LoginLogsPage = lazy(() => import('./pages/admin/LoginLogsPage'));
const SessionManagementPage = lazy(() => import('./pages/admin/SessionManagementPage'));

const PageFallback: React.FC = () => (
  <div className="min-h-[240px] flex items-center justify-center text-gray-500">
    加载中...
  </div>
);

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 glass border-b-0 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-18 py-2">
            <Link to="/" className="text-2xl font-bold flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                易
              </div>
              <span className="font-calligraphy text-3xl text-gray-800 group-hover:text-primary transition-colors">
                六爻排盘
              </span>
            </Link>

            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-gray-700 hover:text-primary font-medium transition-colors">
                  起卦
                </Link>
                <Link to="/history" className="text-gray-700 hover:text-primary font-medium transition-colors">
                  历史记录
                </Link>
                <Link to="/bazi" className="text-gray-700 hover:text-primary font-medium transition-colors">
                  八字批命
                </Link>
                <Link to="/bazi/history" className="text-gray-700 hover:text-primary font-medium transition-colors">
                  八字记录
                </Link>
                <Link to="/tools" className="text-gray-700 hover:text-primary font-medium transition-colors">
                  工具箱
                </Link>
                <Link to="/settings/api-key" className="text-gray-700 hover:text-primary font-medium transition-colors">
                  API 设置
                </Link>
                <Link to="/settings/password" className="text-gray-700 hover:text-primary font-medium transition-colors">
                  修改密码
                </Link>

                {isAdmin() && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary font-medium flex items-center gap-1">
                    <span>管</span>
                    后台
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-4 pl-6 border-l-2 border-gray-200">
                <span className="text-sm font-medium text-gray-600">{user?.realName || user?.username}</span>
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

      <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">{children}</main>

      <footer className="bg-white/80 backdrop-blur border-t border-gray-200 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 font-serif">六爻排盘系统 · 传统易经占卜与现代 AI 分析结合平台</p>
          <p className="text-xs text-gray-400 mt-2">© 2024 LiuYao Divination System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

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

          <Route
            path="/bazi"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BaziInputPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bazi/display/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BaziDisplayPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bazi/ai-analysis/:id"
            element={
              <ProtectedRoute requirePermission="bazi:aiAnalysis">
                <MainLayout>
                  <BaziAiAnalysisPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bazi/history"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BaziHistoryPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminLayout>
                  <DashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminLayout>
                  <UserManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminLayout>
                  <RoleManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/invites"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminLayout>
                  <InviteManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/login-logs"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminLayout>
                  <LoginLogsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminLayout>
                  <SessionManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;
