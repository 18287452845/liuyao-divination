# 认证和权限管理增强功能

本文档描述了六爻排盘系统认证和权限管理功能的增强版本，包含完整的安全审计、会话管理、邮箱验证等功能。

## 🆕 新增功能

### 1. 登录日志管理
- **功能描述**: 记录所有用户登录行为，包括成功和失败的登录尝试
- **数据记录**: 用户名、IP地址、用户代理、登录时间、登录状态、失败原因
- **管理功能**: 查询、过滤、导出、删除历史日志
- **安全价值**: 检测异常登录行为、分析安全威胁

### 2. 操作日志审计
- **功能描述**: 记录用户的关键操作，用于审计追踪
- **数据记录**: 操作类型、操作模块、操作描述、请求参数、响应状态、执行时间
- **自动记录**: 通过中间件自动记录，无需手动调用
- **管理功能**: 查询、过滤、导出、删除历史记录

### 3. Token黑名单管理
- **功能描述**: 实现Token撤销机制，支持登出、强制下线等场景
- **黑名单类型**: Access Token、Refresh Token
- **自动清理**: 定期清理过期的黑名单记录
- **应用场景**: 用户主动登出、管理员强制下线、账号锁定

### 4. 邮箱验证功能
- **功能描述**: 支持邮箱验证、密码重置、邮箱变更等
- **验证类型**: 注册验证、密码重置、邮箱变更验证
- **安全机制**: 一次性令牌、过期时间、使用标记
- **批量操作**: 管理员可批量发送验证邮件

### 5. 用户会话管理
- **功能描述**: 管理用户的多设备登录和会话状态
- **会话信息**: 设备信息、IP地址、活跃时间、过期时间
- **管理功能**: 查看会话、踢下线、批量管理、统计信息
- **安全控制**: 限制同时登录设备数、异常会话检测

### 6. 双因素认证支持
- **功能描述**: 支持TOTP双因素认证（预留接口）
- **启用/禁用**: 用户可自主开启或关闭2FA
- **密钥管理**: 安全生成和存储2FA密钥
- **备用方案**: 恢复代码、管理员重置

### 7. 账号锁定机制
- **功能描述**: 防止暴力破解，自动锁定异常账号
- **锁定条件**: 连续登录失败次数达到阈值
- **锁定时长**: 可配置的锁定时间（默认24小时）
- **管理员干预**: 支持手动锁定/解锁账号

### 8. 安全审计报告
- **功能描述**: 生成综合性的安全审计报告
- **统计维度**: 登录统计、失败原因、可疑IP、锁定账号
- **导出功能**: 支持CSV、JSON格式导出
- **定期报告**: 可配置自动生成定期报告

## 📊 数据库结构

### 新增表结构

#### 1. login_logs (登录日志表)
```sql
CREATE TABLE login_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  username VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  login_status TINYINT NOT NULL,
  failure_reason VARCHAR(255),
  session_id VARCHAR(100)
);
```

#### 2. operation_logs (操作日志表)
```sql
CREATE TABLE operation_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  username VARCHAR(50) NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  operation_module VARCHAR(50) NOT NULL,
  operation_description TEXT,
  request_method VARCHAR(10),
  request_url VARCHAR(500),
  request_params TEXT,
  response_status INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_time INT
);
```

#### 3. token_blacklist (Token黑名单表)
```sql
CREATE TABLE token_blacklist (
  id VARCHAR(50) PRIMARY KEY,
  token_jti VARCHAR(100) NOT NULL,
  user_id VARCHAR(50),
  token_type VARCHAR(20) NOT NULL,
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(255)
);
```

#### 4. email_verifications (邮箱验证表)
```sql
CREATE TABLE email_verifications (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  verification_type VARCHAR(20) NOT NULL,
  token VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. user_sessions (用户会话表)
```sql
CREATE TABLE user_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  session_token VARCHAR(100) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

### 增强的用户表字段
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(32);
ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL;
```

## 🔧 数据库迁移

### PowerShell 脚本 (Windows)
```powershell
# 完整迁移
.\migrate_database.ps1

# 自定义参数
.\migrate_database.ps1 -User myuser -Password mypass

# 跳过某些步骤
.\migrate_database.ps1 -SkipInit -SkipData

# 强制执行（忽略错误）
.\migrate_database.ps1 -Force
```

### Bash 脚本 (Linux/Mac)
```bash
# 完整迁移
./migrate_database.sh

# 自定义参数
./migrate_database.sh -u myuser -p mypass

# 跳过某些步骤
./migrate_database.sh --skip-init --skip-data

# 强制执行（忽略错误）
./migrate_database.sh --force
```

### 迁移参数说明
- `-u, --user`: MySQL用户名（默认: root）
- `-p, --password`: MySQL密码（默认: 123456）
- `-h, --host`: MySQL主机（默认: localhost）
- `-P, --port`: MySQL端口（默认: 3306）
- `--skip-init`: 跳过数据库初始化
- `--skip-data`: 跳过基础数据插入
- `--skip-enhancement`: 跳过认证权限增强功能
- `--force`: 忽略错误继续执行

## 🛡️ 安全特性

### 1. 登录保护
- **失败次数限制**: 连续5次失败后锁定账号24小时
- **IP记录**: 记录每次登录的IP地址和用户代理
- **异常检测**: 可基于日志分析异常登录行为

### 2. 会话安全
- **Token黑名单**: 登出时立即将Token加入黑名单
- **会话管理**: 支持查看和管理所有活跃会话
- **多设备控制**: 可限制同时登录的设备数量

### 3. 权限控制
- **细粒度权限**: 新增日志、会话、安全等模块权限
- **角色继承**: 管理员自动获得所有新权限
- **权限验证**: 所有API接口都有严格的权限验证

### 4. 数据安全
- **敏感信息加密**: 密码使用bcrypt加密存储
- **审计日志**: 记录所有敏感操作
- **数据导出**: 支持安全的数据导出和备份

## 📝 API 接口

### 日志管理
```
GET    /api/logs/login              # 获取登录日志
GET    /api/logs/operation         # 获取操作日志
DELETE /api/logs/login              # 删除登录日志
DELETE /api/logs/operation         # 删除操作日志
GET    /api/logs/login/export       # 导出登录日志
GET    /api/logs/operation/export  # 导出操作日志
```

### 会话管理
```
GET    /api/sessions               # 获取所有活跃会话
GET    /api/sessions/user/:userId   # 获取用户会话
DELETE /api/sessions/:sessionId     # 使会话失效
POST   /api/sessions/invalidate-others  # 使其他会话失效
DELETE /api/sessions/user/:userId/all   # 使用户所有会话失效
GET    /api/sessions/statistics    # 获取会话统计
```

### 安全管理
```
GET    /api/security/settings      # 获取安全设置
POST   /api/security/2fa/enable   # 启用双因素认证
POST   /api/security/2fa/disable  # 禁用双因素认证
POST   /api/security/lock/:userId # 锁定用户账号
POST   /api/security/unlock/:userId # 解锁用户账号
POST   /api/security/force-reset-password/:userId # 强制重置密码
GET    /api/security/audit-report # 获取安全审计报告
```

### 邮箱验证
```
POST   /api/email/send-verification    # 发送邮箱验证码
POST   /api/email/verify              # 验证邮箱
POST   /api/email/send-reset          # 发送密码重置邮件
POST   /api/email/reset-password      # 重置密码
POST   /api/email/send-change-verification  # 发送邮箱变更验证
POST   /api/email/confirm-change     # 确认邮箱变更
POST   /api/email/batch-send-verification  # 批量发送验证
```

## 🔍 使用示例

### 1. 查看登录日志
```javascript
const response = await fetch('/api/logs/login?page=1&pageSize=20&status=0', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});
const data = await response.json();
```

### 2. 管理用户会话
```javascript
// 获取用户的所有会话
const sessions = await fetch(`/api/sessions/user/${userId}`, {
  headers: { 'Authorization': 'Bearer ' + accessToken }
});

// 踢出特定会话
await fetch(`/api/sessions/${sessionId}`, {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer ' + accessToken }
});
```

### 3. 锁定用户账号
```javascript
await fetch(`/api/security/lock/${userId}`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: '异常登录行为',
    lockHours: 24
  })
});
```

### 4. 发送邮箱验证
```javascript
await fetch('/api/email/send-verification', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  }
});
```

## 🧪 测试账号

系统预置了以下测试账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 拥有所有权限 |
| testuser | test123 | 普通用户 | 基础功能权限 |

## 📋 权限列表

### 日志管理权限
- `log:viewLogin` - 查看登录日志
- `log:viewOperation` - 查看操作日志
- `log:delete` - 删除日志
- `log:export` - 导出日志

### 会话管理权限
- `session:view` - 查看会话
- `session:manage` - 管理会话
- `session:multiDevice` - 多设备控制

### 安全管理权限
- `security:view` - 查看安全设置
- `security:manage` - 管理安全设置
- `security:forcePasswordReset` - 强制密码重置
- `security:lockUnlock` - 账号锁定解锁
- `security:auditReport` - 查看审计报告

### 邮箱验证权限
- `email:verify` - 邮箱验证
- `email:batchVerify` - 批量邮箱验证

## 🔄 自动化任务

系统提供了定时清理任务：

### 清理过期数据
```sql
-- 调用存储过程清理过期数据
CALL CleanupExpiredData();

-- 或手动执行
DELETE FROM token_blacklist WHERE expires_at < NOW();
DELETE FROM email_verifications WHERE expires_at < NOW();
DELETE FROM user_sessions WHERE expires_at < NOW();
DELETE FROM login_logs WHERE login_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
DELETE FROM operation_logs WHERE operation_time < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 定时事件
系统会自动创建每日清理事件：
```sql
CREATE EVENT daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL CleanupExpiredData();
```

## 📈 性能优化

### 1. 数据库索引
所有新表都添加了合适的索引，确保查询性能：
- 主键索引
- 外键索引
- 查询字段索引
- 时间字段索引

### 2. 分页查询
所有列表接口都支持分页，避免一次性加载大量数据。

### 3. 异步日志记录
日志记录采用异步方式，不影响主业务流程性能。

### 4. 定期清理
自动清理过期数据，防止数据库无限增长。

## 🚀 部署注意事项

### 1. 环境变量
确保配置了必要的环境变量：
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NODE_ENV=production
```

### 2. 数据库配置
确保MySQL版本 >= 5.7，并启用了事件调度器：
```sql
SET GLOBAL event_scheduler = ON;
```

### 3. 邮件服务
如需使用邮箱验证功能，需要配置邮件服务：
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-password
```

### 4. 安全配置
- 使用强密码的数据库账号
- 启用HTTPS
- 配置防火墙
- 定期备份数据库

## 🐛 故障排除

### 常见问题

1. **迁移脚本执行失败**
   - 检查MySQL连接配置
   - 确认数据库账号权限
   - 使用 `--force` 参数跳过非关键错误

2. **Token验证失败**
   - 检查JWT_SECRET配置
   - 确认Token未过期
   - 检查Token是否在黑名单中

3. **邮件发送失败**
   - 检查SMTP配置
   - 确认邮箱地址有效
   - 检查网络连接

4. **会话管理异常**
   - 检查系统时间同步
   - 确认数据库时区设置
   - 检查过期时间计算

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看MySQL错误日志
tail -f /var/log/mysql/error.log

# 查看系统日志
journalctl -u mysql
```

## 📞 技术支持

如有问题，请：
1. 查看本文档的故障排除部分
2. 检查应用和数据库日志
3. 提交详细的错误信息和环境配置

---

**版本**: 2.0  
**更新时间**: 2024年  
**兼容性**: MySQL 5.7+, Node.js 14+