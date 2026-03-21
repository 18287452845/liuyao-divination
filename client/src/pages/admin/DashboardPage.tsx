import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

interface Statistics {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  todayLogins: number;
  totalDivinations: number;
  todayDivinations: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Statistics>({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    todayLogins: 0,
    totalDivinations: 0,
    todayDivinations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const [usersRes, rolesRes, divinationStats, loginStats, sessionStats] = await Promise.all([
        api.get('/users', { params: { page: 1, pageSize: 1 } }),
        api.get('/roles/all'),
        api.get('/statistics'),
        api.get('/logs/login', {
          params: {
            page: 1,
            pageSize: 1,
            startDate: formatLocalDateTime(startOfToday),
            endDate: formatLocalDateTime(endOfToday),
          },
        }),
        api.get('/sessions/statistics'),
      ]);

      setStats({
        totalUsers: usersRes.data?.data?.total || 0,
        activeUsers: sessionStats.data?.data?.activeUsers || 0,
        totalRoles: rolesRes.data?.data?.length || 0,
        todayLogins: loginStats.data?.data?.total || 0,
        totalDivinations: divinationStats.data?.total || 0,
        todayDivinations: divinationStats.data?.todayTotal || 0,
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: string;
    color: string;
    link?: string;
  }> = ({ title, value, icon, color, link }) => {
    const content = (
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-800">
              {loading ? '...' : value.toLocaleString()}
            </p>
          </div>
          <div className="text-4xl">{icon}</div>
        </div>
      </div>
    );

    return link ? <Link to={link}>{content}</Link> : content;
  };

  const QuickAction: React.FC<{
    title: string;
    description: string;
    icon: string;
    link: string;
    color: string;
  }> = ({ title, description, icon, link, color }) => (
    <Link
      to={link}
      className={`block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-t-4 ${color}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">控制台</h1>
        <p className="text-gray-600">查看系统概览并进入常用管理功能。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="总用户数" value={stats.totalUsers} icon="人" color="border-blue-500" link="/admin/users" />
        <StatCard title="活跃用户" value={stats.activeUsers} icon="活" color="border-green-500" />
        <StatCard title="角色数量" value={stats.totalRoles} icon="权" color="border-purple-500" link="/admin/roles" />
        <StatCard title="今日登录" value={stats.todayLogins} icon="登" color="border-yellow-500" link="/admin/login-logs" />
        <StatCard title="总占卜数" value={stats.totalDivinations} icon="卦" color="border-red-500" />
        <StatCard title="今日占卜" value={stats.todayDivinations} icon="今" color="border-orange-500" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAction title="创建用户" description="添加新的系统用户" icon="新" link="/admin/users" color="border-blue-500" />
          <QuickAction title="角色管理" description="配置角色与权限" icon="权" link="/admin/roles" color="border-purple-500" />
          <QuickAction title="生成邀请码" description="创建注册邀请码" icon="码" link="/admin/invites" color="border-green-500" />
          <QuickAction title="查看日志" description="查看登录与操作日志" icon="志" link="/admin/login-logs" color="border-yellow-500" />
          <QuickAction title="会话管理" description="管理用户在线会话" icon="会" link="/admin/sessions" color="border-red-500" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
