# 认证系统设置指南

本文档说明如何初始化和使用六爻排盘系统的认证和权限管理功能。

## 功能概述

已实现以下功能：
- ✅ 用户注册和登录（JWT认证）
- ✅ 基于角色的访问控制（RBAC）
- ✅ 细粒度权限管理
- ✅ 用户管理（CRUD）
- ✅ 角色管理（CRUD）
- ✅ 权限分配
- ✅ 受保护的路由

## 数据库初始化

### 1. 创建认证相关表

```bash
# 进入MySQL
mysql -u root -p123456

# 创建认证表
mysql -u root -p123456 < server/sql/auth_tables.sql

# 插入初始数据（角色、权限、默认管理员）
mysql -u root -p123456 < server/sql/auth_init_data.sql
```

### 2. 默认账号

系统会自动创建以下测试账号：

**管理员账号：**
- 用户名：`admin`
- 密码：`admin123`
- 角色：系统管理员
- 权限：所有权限

**普通用户账号：**
- 用户名：`testuser`
- 密码：`test123`
- 角色：普通用户
- 权限：基础占卜功能

## 环境配置

### 服务端配置

在 `server/.env` 中添加JWT配置：

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**重要：** 生产环境请务必修改 `JWT_SECRET` 为复杂的随机字符串！

### 安装依赖

```bash
# 安装服务端新增的依赖
cd server
npm install

# bcryptjs - 密码加密
# jsonwebtoken - JWT token生成和验证
```

## 权限系统说明

### 角色（Roles）

系统预定义了3个角色：

1. **admin（系统管理员）**
   - 拥有所有权限
   - 可以管理用户、角色、权限

2. **user（普通用户）**
   - 创建占卜：`divination:create`
   - 查看自己的占卜：`divination:view`
   - 删除自己的占卜：`divination:delete`

3. **vip（VIP用户）**
   - 所有占卜功能
   - AI分析功能：`divination:aiAnalysis`
   - 无次数限制

### 权限（Permissions）

权限按模块划分：

**占卜模块（divination）：**
- `divination:create` - 创建占卜
- `divination:view` - 查看占卜
- `divination:delete` - 删除占卜
- `divination:viewAll` - 查看所有用户占卜
- `divination:aiAnalysis` - 使用AI分析

**用户管理（user）：**
- `user:create` - 创建用户
- `user:view` - 查看用户
- `user:edit` - 编辑用户
- `user:delete` - 删除用户
- `user:status` - 启用/禁用用户

**角色管理（role）：**
- `role:create` - 创建角色
- `role:view` - 查看角色
- `role:edit` - 编辑角色
- `role:delete` - 删除角色
- `role:assignPermission` - 分配权限

**权限管理（permission）：**
- `permission:view` - 查看权限
- `permission:manage` - 管理权限

## API端点

### 认证相关

```
POST /api/auth/login           # 登录
POST /api/auth/register        # 注册
GET  /api/auth/me              # 获取当前用户信息
POST /api/auth/change-password # 修改密码
PUT  /api/auth/profile         # 更新资料
POST /api/auth/refresh         # 刷新Token
POST /api/auth/logout          # 登出
```

### 用户管理（需要管理员权限）

```
GET    /api/users              # 获取用户列表
GET    /api/users/:id          # 获取用户详情
POST   /api/users              # 创建用户
PUT    /api/users/:id          # 更新用户
DELETE /api/users/:id          # 删除用户
PATCH  /api/users/:id/status   # 修改用户状态
POST   /api/users/:id/reset-password # 重置密码
```

### 角色管理（需要管理员权限）

```
GET    /api/roles              # 获取角色列表
GET    /api/roles/all          # 获取所有角色（下拉）
GET    /api/roles/:id          # 获取角色详情
POST   /api/roles              # 创建角色
PUT    /api/roles/:id          # 更新角色
DELETE /api/roles/:id          # 删除角色
PATCH  /api/roles/:id/status   # 修改角色状态
POST   /api/roles/:id/permissions # 分配权限
```

### 权限管理

```
GET /api/permissions           # 获取所有权限
```

## 前端使用

### 1. AuthContext

在 `App.tsx` 中包裹 `AuthProvider`：

```typescript
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* 路由配置 */}
    </AuthProvider>
  );
}
```

### 2. 使用认证信息

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, hasPermission, isAdmin, logout } = useAuth();

  if (hasPermission('divination:aiAnalysis')) {
    // 显示AI分析功能
  }

  if (isAdmin()) {
    // 显示管理员功能
  }

  return (
    <div>
      <p>欢迎，{user?.username}</p>
      <button onClick={logout}>退出登录</button>
    </div>
  );
}
```

### 3. 保护路由

```typescript
import ProtectedRoute from './components/ProtectedRoute';

<Route
  path="/admin"
  element={
    <ProtectedRoute requireRole="admin">
      <AdminPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/divination"
  element={
    <ProtectedRoute requirePermission="divination:create">
      <DivinationPage />
    </ProtectedRoute>
  }
/>
```

### 4. API请求

```typescript
import { userApi, roleApi } from './services/api';

// 获取用户列表
const { data } = await userApi.getUsers({ page: 1, pageSize: 20 });

// 创建用户
await userApi.createUser({
  username: 'newuser',
  password: 'password123',
  roleIds: ['role-user-001'],
});

// 获取角色列表
const roles = await roleApi.getAllRoles();
```

## 开发流程

### 添加新权限

1. 在 `server/sql/auth_init_data.sql` 中添加权限：

```sql
INSERT INTO permissions (id, permission_name, permission_code, description, module, status) VALUES
('perm-new-001', '新功能', 'feature:new', '允许使用新功能', 'feature', 1);
```

2. 为角色分配权限：

```sql
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-new-001', 'role-admin-001', 'perm-new-001');
```

3. 在路由中使用权限：

```typescript
router.get('/new-feature', authenticate, requirePermissions('feature:new'), handler);
```

### 添加新角色

1. 在数据库中创建角色
2. 为角色分配权限
3. 在用户管理界面分配给用户

## 安全建议

1. **生产环境必须修改JWT_SECRET**
2. **使用HTTPS传输敏感数据**
3. **定期更新密码策略**
4. **限制登录失败次数**
5. **记录审计日志**
6. **定期审查权限分配**

## 故障排除

### 登录失败

1. 检查数据库是否正确初始化
2. 验证用户状态是否为启用（status=1）
3. 确认密码哈希是否正确生成

### Token无效

1. 检查JWT_SECRET配置
2. 验证Token是否过期
3. 确认Authorization header格式：`Bearer <token>`

### 权限不足

1. 检查用户的角色分配
2. 验证角色的权限配置
3. 确认权限代码是否正确

## 下一步计划

前端管理界面开发：
- [ ] 管理后台布局
- [ ] 用户管理页面
- [ ] 角色管理页面
- [ ] 权限管理页面
- [ ] 完整的App.tsx路由配置

## 联系支持

如有问题，请查看：
- 项目README.md
- CLAUDE.md（开发指南）
- 服务端日志输出
