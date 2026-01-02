/**
 * 登录页面
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(true); // true=登录, false=注册
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    realName: '',
    inviteCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // 登录
        await login(formData.username, formData.password);
        navigate('/');
      } else {
        // 注册
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            email: formData.email || undefined,
            realName: formData.realName || undefined,
            inviteCode: formData.inviteCode,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '注册失败');
        }

        // 注册成功后自动登录
        await login(formData.username, formData.password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo和标题 */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-red-700 text-white rounded-full flex items-center justify-center text-5xl shadow-xl mb-6 border-4 border-white/50">
            ☯
          </div>
          <h1 className="text-4xl font-calligraphy text-gray-800 mb-2 text-shadow">六爻排盘系统</h1>
          <p className="text-gray-600 font-serif tracking-widest">传统智慧 · 现代科技</p>
        </div>

        {/* 登录/注册表单 */}
        <div className="glass-card animate-fade-in">
          {/* 切换标签 */}
          <div className="flex mb-8 bg-gray-100/50 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${isLogin
                  ? 'bg-white text-primary shadow-md scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${!isLogin
                  ? 'bg-white text-primary shadow-md scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  用户名
                </span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  autoComplete="username"
                  className="w-full bg-white/80 border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none
                    focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10
                    transition-all duration-300 text-gray-800 placeholder-gray-400
                    hover:border-gray-300 hover:bg-white"
                  placeholder="请输入用户名"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300"></div>
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  密码
                </span>
              </label>
              <div className="relative group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full bg-white/80 border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none
                    focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10
                    transition-all duration-300 text-gray-800 placeholder-gray-400
                    hover:border-gray-300 hover:bg-white"
                  placeholder="请输入密码"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300"></div>
              </div>
            </div>

            {/* 注册额外字段 */}
            {!isLogin && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 ml-1">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      邀请码 <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="inviteCode"
                      value={formData.inviteCode}
                      onChange={handleInputChange}
                      required
                      autoComplete="off"
                      className="w-full bg-white/80 border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none
                        focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10
                        transition-all duration-300 text-gray-800 placeholder-gray-400
                        hover:border-gray-300 hover:bg-white"
                      placeholder="请输入邀请码"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300"></div>
                  </div>
                  <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    注册需要邀请码，请联系管理员获取
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 ml-1">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      邮箱（可选）
                    </span>
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                      className="w-full bg-white/80 border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none
                        focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10
                        transition-all duration-300 text-gray-800 placeholder-gray-400
                        hover:border-gray-300 hover:bg-white"
                      placeholder="请输入邮箱"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 ml-1">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      真实姓名（可选）
                    </span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="realName"
                      value={formData.realName}
                      onChange={handleInputChange}
                      autoComplete="name"
                      className="w-full bg-white/80 border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none
                        focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10
                        transition-all duration-300 text-gray-800 placeholder-gray-400
                        hover:border-gray-300 hover:bg-white"
                      placeholder="请输入真实姓名"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary via-red-600 to-primary text-white font-bold py-4 px-6 rounded-xl
                shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5
                active:translate-y-0 transition-all duration-300 mt-4
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  处理中...
                </>
              ) : isLogin ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  立即登录
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  立即注册
                </>
              )}
            </button>
          </form>

          {/* 底部版权 */}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500 font-serif">
          <p>© 2024 六爻排盘系统 · 传统文化数字化平台</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
