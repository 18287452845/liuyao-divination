# MySQL2 配置错误和查询参数类型错误修复报告

## 问题描述

在六爻排盘系统中发现以下问题：

1. **MySQL2连接配置警告**
   - 错误信息：`Ignoring invalid configuration option passed to Connection: acquireTimeout`
   - 错误信息：`Ignoring invalid configuration option passed to Connection: timeout`
   - 这些选项在MySQL2库中不存在，会产生警告

2. **数据库查询参数错误**
   - 错误信息：`Error: Incorrect arguments to mysqld_stmt_execute`
   - 错误代码：`ER_WRONG_ARGUMENTS`
   - 错误原因：LIMIT和OFFSET参数传递为字符串，但MySQL需要数字类型

## 修复方案

### 1. MySQL2配置修复

**文件：** `server/src/models/database.ts`

**修复内容：**
- 删除了无效的配置选项：
  - `acquireTimeout: 60000`
  - `timeout: 60000`
- 保留了有效的配置选项，如 `connectTimeout: 60000`

**修复前：**
```typescript
const dbConfig = {
  // ...其他配置...
  connectTimeout: 60000,  // 60秒连接超时
  acquireTimeout: 60000,   // 无效选项，删除
  timeout: 60000,          // 无效选项，删除
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};
```

**修复后：**
```typescript
const dbConfig = {
  // ...其他配置...
  connectTimeout: 60000,  // 60秒连接超时
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};
```

### 2. LIMIT/OFFSET参数类型修复

在所有使用LIMIT和OFFSET的SQL查询中，确保参数为数字类型：

**修复方式：** 在参数数组中添加类型转换
```typescript
// 修复前
params.push(limit, offset)

// 修复后  
params.push(Number(limit), Number(offset))
```

## 修复文件列表

### 数据库模型文件
- ✅ `server/src/models/database.ts` (3处修复)

### 控制器文件
- ✅ `server/src/controllers/sessionController.ts` (1处修复)
- ✅ `server/src/controllers/userController.ts` (1处修复) 
- ✅ `server/src/controllers/logController.ts` (2处修复)
- ✅ `server/src/controllers/roleController.ts` (1处修复)

### 工具文件
- ✅ `server/src/utils/inviteCodes.ts` (1处修复)
- ✅ `server/src/utils/audit.ts` (1处修复)
- ✅ `server/src/utils/tokenBlacklist.ts` (1处修复)

**总计修复：** 11处LIMIT/OFFSET参数类型问题

## 影响范围

修复后解决的问题：

1. **邀请码管理功能**
   - 邀请码列表获取功能
   - 邀请码查询和筛选功能

2. **占卜记录功能**
   - 历史记录查询功能
   - 记录分页显示功能
   - 用户个人记录管理功能

3. **用户管理功能**
   - 用户列表查询功能
   - 分页功能

4. **日志管理功能**
   - 登录日志查询
   - 操作日志查询
   - 分页功能

5. **系统管理功能**
   - 角色列表查询
   - 审计日志查询
   - Token黑名单查询

6. **认证功能**
   - 会话管理查询
   - 分页功能

## 验证方法

1. **配置警告消除**
   ```bash
   # 启动服务器后不应再看到以下警告：
   # "Ignoring invalid configuration option passed to Connection: acquireTimeout"
   # "Ignoring invalid configuration option passed to Connection: timeout"
   ```

2. **数据库查询正常**
   ```bash
   # 以下功能应正常工作：
   # - 邀请码管理页面
   # - 历史记录页面
   # - 用户管理页面
   # - 日志管理页面
   # 所有分页查询应正常工作，不出现ER_WRONG_ARGUMENTS错误
   ```

## 技术说明

### MySQL2配置选项说明

MySQL2连接池的有效配置选项：
- `host`, `port`, `user`, `password`, `database`
- `charset`, `connectionLimit`, `queueLimit`
- `connectTimeout`, `waitForConnections`
- `enableKeepAlive`, `keepAliveInitialDelay`

**不存在的选项：**
- `acquireTimeout`
- `timeout` (在连接池级别)

### 参数类型要求

MySQL2的 `execute()` 方法要求参数类型正确：
- LIMIT和OFFSET必须是数字类型
- 字符串类型的数字会导致 `ER_WRONG_ARGUMENTS` 错误

## 修复完成时间

修复日期：2024年12月18日

## 状态

✅ **修复完成** - 所有问题已解决，代码已更新

---

**注意：** 修复仅针对参数类型和配置问题，未修改业务逻辑，确保系统功能完整性。