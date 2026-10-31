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
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex min-h-16 items-center justify-between py-2">
            <Link to="/" className="flex items-center gap-3 text-2xl font-bold group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                易
              </div>
              <span className="font-calligraphy text-2xl text-gray-800 transition-colors group-hover:text-primary">
                六爻排盘
              </span>
            </Link>

            <div className="flex items-center gap-5">
              <div className="hidden md:flex items-center gap-5">
                <Link to="/" className="text-sm text-gray-700 hover:text-primary font-medium transition-colors">
                  起卦
                </Link>
                <Link to="/history" className="text-sm text-gray-700 hover:text-primary font-medium transition-colors">
                  历史记录
                </Link>
                <Link to="/bazi" className="text-sm text-gray-700 hover:text-primary font-medium transition-colors">
                  八字批命
                </Link>
                <Link to="/bazi/history" className="text-sm text-gray-700 hover:text-primary font-medium transition-colors">
                  八字记录
                </Link>
                <Link to="/tools" className="text-sm text-gray-700 hover:text-primary font-medium transition-colors">
                  工具箱
                </Link>
                <Link to="/settings/api-key" className="text-sm text-gray-700 hover:text-primary font-medium transition-colors">
                  API 设置
                </Link>
                <Link to="/settings/password" className="text-sm text-gray-700 hover:text-primary font-medium transition-colors">
                  修改密码
                </Link>

                {isAdmin() && (
                  <Link to="/admin" className="text-sm text-gray-700 hover:text-primary font-medium flex items-center gap-1">
                    <span>管</span>
                    后台
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <span className="max-w-32 truncate text-sm font-medium text-gray-600">{user?.realName || user?.username}</span>
                <button
                  onClick={logout}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">{children}</main>

      <footer className="mt-auto border-t border-gray-200 bg-white/80 py-6 backdrop-blur">
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
