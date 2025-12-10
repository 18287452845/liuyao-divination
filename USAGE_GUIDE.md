# 认证和权限管理使用指南

## 🚀 快速开始

### 1. 数据库迁移

#### 方法一：PowerShell (推荐)
```powershell
# 进入server目录
cd server

# 执行迁移
.\migrate-database.ps1
```

#### 方法二：Windows批处理
```cmd
# 进入server目录
cd server

# 执行迁移
migrate-database.bat
```

#### 方法三：手动MySQL命令
```bash
# 进入server目录
cd server

# 执行迁移（MySQL）
mysql -u root -p123456 < sql/02_auth_permissions_migration.sql
```

#### 方法四：验证迁移脚本
```bash
cd server
node test-migration.js
```

#### 方法五：Linux/macOS验证
```bash
cd server
./verify-migration.sh
```

### 2. 启动服务

```bash
# 启动后端
cd server
npm install
npm run dev

# 启动前端
cd client
npm install
npm run dev
```

### 3. 登录验证

使用默认管理员账号登录：
- 用户名: `admin`
- 密码: `admin123`

## 📋 功能特性

### 🔐 增强的认证功能

#### 密码策略
- **最小长度**: 8个字符
- **复杂度要求**: 必须包含大小写字母、数字和特殊字符
- **常见密码检查**: 防止使用弱密码
- **密码强度**: 自动评估密码强度（弱/中等/强/非常强）

#### 登录安全
- **失败锁定**: 5次登录失败后锁定30分钟
- **会话管理**: JWT Token机制，支持主动登出
- **设备记录**: 记录登录IP和用户代理

### 🎫 邀请码管理

#### 创建邀请码
```javascript
// API调用示例
POST /api/invite-codes
{
  "code": "INVITE2024",
  "name": "2024年邀请码",
  "description": "新年专用邀请码",
  "maxUses": 100,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### 批量生成
```javascript
POST /api/invite-codes/batch
{
  "count": 10,
  "name": "批量邀请码",
  "maxUses": 1
}
```

#### 使用邀请码注册
```javascript
POST /api/auth/register
{
  "username": "newuser",
  "password": "SecurePass123!",
  "email": "user@example.com",
  "inviteCode": "INVITE2024"
}
```

### 📊 审计日志

#### 查看日志
```javascript
GET /api/audit-logs?page=1&pageSize=20&status=1
```

#### 导出日志
```javascript
GET /api/audit-logs/export?format=csv&startDate=2024-01-01&endDate=2024-12-31
```

#### 日志类型
- `LOGIN`: 登录操作
- `LOGOUT`: 登出操作
- `REGISTER`: 用户注册
- `CREATE_USER`: 创建用户
- `UPDATE_USER`: 更新用户
- `DELETE_USER`: 删除用户
- `CREATE_ROLE`: 创建角色
- `UPDATE_ROLE`: 更新角色
- `DELETE_ROLE`: 删除角色
- `CREATE_DIVINATION`: 创建占卜
- `AI_ANALYSIS`: AI分析

### 🛡️ 权限控制

#### 权限列表
| 模块 | 权限代码 | 描述 |
|------|----------|------|
| 占卜 | `divination:create` | 创建占卜记录 |
| 占卜 | `divination:view` | 查看占卜记录 |
| 占卜 | `divination:delete` | 删除占卜记录 |
| 占卜 | `divination:aiAnalysis` | 使用AI分析功能 |
| 用户 | `user:create` | 创建用户 |
| 用户 | `user:view` | 查看用户信息 |
| 用户 | `user:edit` | 编辑用户信息 |
| 用户 | `user:delete` | 删除用户 |
| 角色 | `role:create` | 创建角色 |
| 角色 | `role:view` | 查看角色信息 |
| 角色 | `role:edit` | 编辑角色信息 |
| 角色 | `role:delete` | 删除角色 |
| 审计 | `audit:view` | 查看审计日志 |
| 审计 | `audit:export` | 导出审计日志 |
| 邀请 | `invite:create` | 创建邀请码 |
| 邀请 | `invite:view` | 查看邀请码 |
| 邀请 | `invite:edit` | 编辑邀请码 |
| 邀请 | `invite:delete` | 删除邀请码 |

## 🎯 前端使用

### 权限控制组件

```tsx
import { PermissionGuard, HasPermission, AdminOnly } from './components/PermissionGuard';

// 基础权限检查
<PermissionGuard permission="user:create">
  <Button>创建用户</Button>
</PermissionGuard>

// 多权限检查（需要其中一个）
<PermissionGuard permissions={["user:create", "user:edit"]}>
  <div>用户管理内容</div>
</PermissionGuard>

// 角色检查
<HasRole role="admin">
  <AdminPanel />
</HasRole>

// 管理员专用
<AdminOnly>
  <SystemSettings />
</AdminOnly>
```

### 使用权限Hook

```tsx
import { usePermissionCheck } from './components/PermissionGuard';

function UserComponent() {
  const { checkPermission, checkRole, isAdmin } = usePermissionCheck();

  const canCreateUser = checkPermission('user:create');
  const isAdminUser = isAdmin();
  const isModerator = checkRole('moderator');

  return (
    <div>
      {canCreateUser && <Button>创建用户</Button>}
      {isAdminUser && <AdminPanel />}
    </div>
  );
}
```

## 🔧 API接口

### 认证相关

```bash
# 登录
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# 注册
POST /api/auth/register
{
  "username": "newuser",
  "password": "SecurePass123!",
  "email": "user@example.com",
  "inviteCode": "INVITE2024"
}

# 获取当前用户信息
GET /api/auth/me
Authorization: Bearer <token>

# 修改密码
POST /api/auth/change-password
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123!"
}

# 登出
POST /api/auth/logout
Authorization: Bearer <token>
```

### 邀请码管理

```bash
# 获取邀请码列表
GET /api/invite-codes?page=1&pageSize=20

# 获取邀请码统计
GET /api/invite-codes/statistics

# 创建邀请码
POST /api/invite-codes
{
  "code": "NEWCODE",
  "name": "新邀请码",
  "maxUses": 10
}

# 批量创建
POST /api/invite-codes/batch
{
  "count": 5,
  "name": "批量邀请码"
}

# 更新邀请码
PUT /api/invite-codes/:id
{
  "name": "更新的名称",
  "maxUses": 20
}

# 修改状态
PATCH /api/invite-codes/:id/status
{
  "status": 0  # 0-禁用 1-启用
}

# 删除邀请码
DELETE /api/invite-codes/:id
```

### 审计日志

```bash
# 获取日志列表
GET /api/audit-logs?page=1&pageSize=20&userId=user123&action=LOGIN

# 获取统计
GET /api/audit-logs/statistics

# 导出日志
GET /api/audit-logs/export?format=csv&startDate=2024-01-01

# 清理日志
POST /api/audit-logs/cleanup
{
  "days": 90
}
```

## 🧪 测试

### 运行API测试

```bash
cd server
node test-api.js
```

### 测试内容
- ✅ 管理员登录
- ✅ 普通用户登录
- ✅ 获取用户信息
- ✅ 邀请码管理
- ✅ 审计日志
- ✅ 权限验证
- ✅ 未授权访问保护
- ✅ Token验证
- ✅ 用户注册

## 🔒 安全最佳实践

### 1. 密码安全
- 使用强密码策略
- 定期更换密码
- 避免密码复用

### 2. 会话管理
- 及时登出
- 避免在公共设备保存密码
- 定期检查活跃会话

### 3. 权限管理
- 遵循最小权限原则
- 定期审查用户权限
- 及时撤销离职员工权限

### 4. 审计监控
- 定期查看审计日志
- 关注异常登录行为
- 及时处理安全事件

## 📞 故障排除

### 常见问题

**Q: 登录失败次数过多被锁定怎么办？**
A: 等待30分钟后自动解锁，或联系管理员手动解锁。

**Q: 邀请码无法使用？**
A: 检查邀请码是否过期、是否达到使用上限、是否被禁用。

**Q: 权限不足怎么办？**
A: 联系管理员申请相应权限，或检查当前用户角色。

**Q: 审计日志不完整？**
A: 检查系统时间是否正确，确认相关功能是否正常启用。

### 联系支持

如遇到技术问题，请：
1. 查看服务器日志
2. 检查数据库连接
3. 验证配置文件
4. 提交Issue到项目仓库

---

**完善的认证和权限管理系统为您的应用提供了企业级的安全保障！** 🛡️