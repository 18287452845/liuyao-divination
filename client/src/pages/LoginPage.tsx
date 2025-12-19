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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">
                用户名
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="请输入用户名"
              />
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="请输入密码"
              />
            </div>

            {/* 注册额外字段 */}
            {!isLogin && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700 ml-1">
                    邀请码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="inviteCode"
                    value={formData.inviteCode}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="请输入邀请码"
                  />
                  <p className="text-xs text-gray-500 ml-1">
                    注册需要邀请码，请联系管理员获取
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700 ml-1">
                    邮箱（可选）
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="请输入邮箱"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700 ml-1">
                    真实姓名（可选）
                  </label>
                  <input
                    type="text"
                    name="realName"
                    value={formData.realName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="请输入真实姓名"
                  />
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
              className="w-full btn-primary mt-2"
            >
              {loading ? '处理中...' : isLogin ? '立即登录' : '立即注册'}
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
