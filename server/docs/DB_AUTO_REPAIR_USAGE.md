# 数据库自动修复功能使用指南

## 概述

数据库自动修复系统是一个智能化的错误诊断和修复工具，能够自动检测和修复常见的MySQL数据库错误，减少手动干预，提高系统的健壮性。

## 自动启用

好消息是：**你不需要做任何事情！**

自动修复功能已经集成到 `database.ts` 的 `query()` 函数中，所有通过该函数执行的数据库查询都会自动受益于：

1. **参数类型自动转换** - LIMIT/OFFSET 参数自动转换为数字类型
2. **错误自动诊断** - 查询失败时自动分析错误原因
3. **结构自动修复** - 缺失的表和字段会被自动创建
4. **查询自动重试** - 修复成功后自动重新执行查询

## 工作流程

```
┌─────────────────┐
│  执行数据库查询  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐        ┌──────────────┐
│  参数类型检查    │───Yes──│  自动转换为  │
│ (LIMIT/OFFSET)  │        │   数字类型   │
└────────┬────────┘        └──────┬───────┘
         │                         │
         No                        │
         │                         │
         ▼◄────────────────────────┘
┌─────────────────┐
│   执行SQL查询   │
└────────┬────────┘
         │
         ├──成功──▶ 返回结果
         │
         ▼
      发生错误
         │
         ▼
┌─────────────────┐
│  错误自动诊断    │
└────────┬────────┘
         │
         ▼
   ┌────┴────┐
   │ 可修复？ │
   └────┬────┘
        │
    ┌───┴───┐
    │       │
   Yes     No
    │       │
    ▼       ▼
┌───────┐  抛出错误
│ 修复  │
└───┬───┘
    │
    ▼
  成功？
    │
┌───┴───┐
│       │
Yes    No
│       │
▼       ▼
重试  抛出错误
│
▼
返回结果
```

## 支持的错误类型

### 1. ER_WRONG_ARGUMENTS (参数类型错误)

**问题表现：**
```
Error: Incorrect arguments to mysqld_stmt_execute
code: 'ER_WRONG_ARGUMENTS'
errno: 1210
```

**自动修复：**
- 检测 LIMIT/OFFSET 参数
- 自动转换字符串为数字类型
- 提供修复建议

**示例日志：**
```
自动修复: LIMIT参数从 string 类型转换为 number 类型
自动修复: OFFSET参数从 string 类型转换为 number 类型
```

### 2. ER_NO_SUCH_TABLE (表不存在)

**问题表现：**
```
Error: Table 'liuyao_db.invite_codes' doesn't exist
code: 'ER_NO_SUCH_TABLE'
errno: 1146
```

**自动修复：**
- 识别缺失的表名
- 根据预定义schema自动创建表
- 重新执行原查询

**示例日志：**
```
=== 数据库错误自动诊断 ===
错误代码: ER_NO_SUCH_TABLE
>>> 检测到表不存在错误
>>> 缺失的表: invite_codes
>>> 正在创建表 invite_codes...
>>> 表 invite_codes 创建成功！

=== 自动修复结果 ===
状态: 成功
信息: 表 invite_codes 已自动创建
操作: TABLE_CREATED

>>> 表已创建，重新尝试执行查询...
✓ 查询成功
```

**支持的表：**
- invite_codes
- users
- audit_logs
- sessions
- token_blacklist
- operation_logs

### 3. ER_BAD_FIELD_ERROR (字段不存在)

**问题表现：**
```
Error: Unknown column 'invite_code' in 'field list'
code: 'ER_BAD_FIELD_ERROR'
errno: 1054
```

**自动修复：**
- 识别缺失的字段名
- 自动添加字段到对应表
- 重新执行原查询

**示例日志：**
```
=== 数据库错误自动诊断 ===
错误代码: ER_BAD_FIELD_ERROR
>>> 检测到字段不存在错误
>>> 缺失的字段: invite_code
>>> 正在添加字段 invite_code 到表 users...
>>> 字段 invite_code 添加成功！

=== 自动修复结果 ===
状态: 成功
信息: 字段 invite_code 已自动添加到表 users
操作: COLUMN_ADDED
执行的SQL:
ALTER TABLE users ADD COLUMN invite_code VARCHAR(50) AFTER status;

>>> 字段已添加，重新尝试执行查询...
✓ 查询成功
```

**支持的字段：**
- users.invite_code
- users.last_login
- sessions.refresh_token
- audit_logs.user_agent

### 4. ER_PARSE_ERROR (SQL语法错误)

**问题表现：**
```
Error: You have an error in your SQL syntax
code: 'ER_PARSE_ERROR'
errno: 1064
```

**自动修复：**
- 分析SQL语句
- 提供常见错误建议
- 无法自动修复（需要人工介入）

### 5. ER_DUP_FIELDNAME (重复字段)

**问题表现：**
```
Error: Duplicate column name 'xxx'
code: 'ER_DUP_FIELDNAME'
errno: 1060
```

**自动修复：**
- 检测重复字段
- 提供诊断信息
- 无法自动修复（需要人工介入）

## 高级用法

### 数据库健康检查

在应用启动时或定期执行健康检查：

```typescript
import { checkDatabaseHealth } from './utils/dbAutoRepair';

async function performHealthCheck() {
  const health = await checkDatabaseHealth();
  
  if (!health.healthy) {
    console.error('❌ 数据库存在问题：');
    health.issues.forEach(issue => console.error(`  - ${issue}`));
    
    console.log('\n💡 修复建议：');
    health.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  } else {
    console.log('✅ 数据库健康状态良好');
  }
  
  return health.healthy;
}

// 在应用启动时检查
performHealthCheck();

// 或定期检查（每小时）
setInterval(performHealthCheck, 60 * 60 * 1000);
```

### 定期清理过期数据

```typescript
import { 
  cleanupExpiredTokens, 
  cleanupExpiredSessions 
} from './utils/dbAutoRepair';

// 每天凌晨2点清理
const schedule = require('node-schedule');

schedule.scheduleJob('0 2 * * *', async () => {
  console.log('🧹 开始清理过期数据...');
  
  await cleanupExpiredTokens();
  await cleanupExpiredSessions();
  
  console.log('✅ 清理完成');
});
```

### 手动诊断错误

```typescript
import { diagnosisAndRepair, DBError } from './utils/dbAutoRepair';

try {
  // 执行可能出错的操作
  await someDbOperation();
} catch (error) {
  // 手动诊断和修复
  const result = await diagnosisAndRepair(
    error as DBError, 
    'SELECT * FROM some_table', 
    [param1, param2]
  );
  
  if (result.success) {
    console.log('✅ 已修复:', result.message);
    
    if (result.action === 'TABLE_CREATED' || result.action === 'COLUMN_ADDED') {
      // 可以重试操作
      await someDbOperation();
    }
  } else {
    console.error('❌ 无法自动修复:', result.message);
    // 人工介入
  }
}
```

## 日志分析

### 正常修复日志

当看到以下日志时，说明自动修复成功：

```
自动修复: LIMIT参数从 string 类型转换为 number 类型
```
这是最常见的修复，参数类型已自动转换，查询会正常执行。

```
=== 自动修复结果 ===
状态: 成功
信息: 表 xxx 已自动创建
操作: TABLE_CREATED
```
表已自动创建，查询会自动重试并成功。

### 需要注意的日志

```
=== 自动修复结果 ===
状态: 失败
信息: 无法从错误信息中提取表名
```
自动修复失败，需要检查数据库配置或SQL语句。

```
自动修复过程失败: Error: ...
```
修复过程本身出错，需要人工检查数据库权限或网络连接。

## 性能影响

### 参数类型检查
- **开销**: ~0.1ms 每次查询
- **触发条件**: SQL包含 LIMIT 和 OFFSET
- **影响**: 可忽略不计

### 错误诊断
- **开销**: ~1-5ms
- **触发条件**: 仅在查询出错时
- **影响**: 不影响正常查询

### 表创建
- **开销**: ~50-200ms
- **触发条件**: 仅在表不存在时
- **影响**: 仅第一次，后续查询正常

### 字段添加
- **开销**: ~20-100ms
- **触发条件**: 仅在字段不存在时
- **影响**: 仅第一次，后续查询正常

## 安全考虑

### ✅ 安全措施

1. **预定义结构** - 只修复预定义的表和字段，不接受动态输入
2. **详细日志** - 所有修复操作都有完整日志记录
3. **只读修复** - 不修改或删除现有数据
4. **权限检查** - 依赖MySQL用户权限，不会越权操作

### ⚠️ 注意事项

1. **数据库权限** - 确保MySQL用户有 CREATE TABLE 和 ALTER TABLE 权限
2. **生产环境** - 建议监控自动修复日志，频繁修复可能表明初始化有问题
3. **备份策略** - 自动修复不会删除数据，但仍建议定期备份
4. **版本控制** - 记录自动创建的表和字段，纳入版本管理

## 故障排查

### 问题：修复功能没有生效

**可能原因：**
1. 错误类型不支持
2. 数据库权限不足
3. 表/字段不在预定义列表中

**解决方法：**
```bash
# 1. 检查错误代码
# 查看控制台日志中的 error.code

# 2. 检查数据库权限
mysql -u root -p -e "SHOW GRANTS FOR 'your_user'@'localhost';"

# 3. 添加新的修复方案
# 编辑 server/src/utils/dbAutoRepair.ts
# 在 tableSchemas 或 columnSchemas 中添加定义
```

### 问题：表已创建但查询仍失败

**可能原因：**
1. 字符集不匹配
2. 表结构与预期不符
3. 缓存问题

**解决方法：**
```sql
-- 检查表结构
SHOW CREATE TABLE your_table;

-- 检查字符集
SHOW VARIABLES LIKE 'character_set%';

-- 重启MySQL连接池
-- 重启应用服务器
```

### 问题：修复日志显示成功但实际没有修复

**可能原因：**
1. MySQL事务问题
2. 权限在执行时被撤销
3. 表名大小写敏感

**解决方法：**
```sql
-- 检查表是否真的创建了
SHOW TABLES LIKE 'your_table';

-- 检查字段是否真的添加了
DESC your_table;

-- 检查大小写敏感设置
SHOW VARIABLES LIKE 'lower_case_table_names';
```

## 扩展自动修复

### 添加新的表修复方案

编辑 `server/src/utils/dbAutoRepair.ts`：

```typescript
const tableSchemas: { [key: string]: string } = {
  // ... 现有表定义 ...
  
  'your_new_table': `
    CREATE TABLE IF NOT EXISTS your_new_table (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
};
```

### 添加新的字段修复方案

```typescript
const columnSchemas: { [key: string]: { table: string; sql: string } } = {
  // ... 现有字段定义 ...
  
  'your_new_column': {
    table: 'your_table',
    sql: 'ALTER TABLE your_table ADD COLUMN your_new_column VARCHAR(100) AFTER some_column;'
  },
};
```

### 添加新的错误类型处理

```typescript
export async function diagnosisAndRepair(error: DBError, originalSql: string, params?: any[]): Promise<RepairResult> {
  // ... 现有错误处理 ...
  
  // 6. 添加新的错误类型
  if (error.code === 'ER_YOUR_ERROR' || error.errno === XXXX) {
    return await repairYourError(error);
  }
  
  // ...
}

async function repairYourError(error: DBError): Promise<RepairResult> {
  // 实现你的修复逻辑
  console.log('>>> 检测到你的错误类型');
  
  // 执行修复
  // ...
  
  return {
    success: true,
    message: '修复成功',
    action: 'YOUR_ACTION',
    sqlExecuted: 'YOUR SQL'
  };
}
```

## 最佳实践

1. **监控修复日志** - 定期检查修复日志，发现重复修复问题
2. **完善初始化脚本** - 自动修复不应替代完整的数据库初始化
3. **测试环境验证** - 新的修复方案先在测试环境验证
4. **文档同步** - 自动创建的表和字段记录到文档中
5. **版本管理** - 将修复方案纳入版本控制
6. **定期清理** - 使用提供的清理函数定期清理过期数据
7. **健康检查** - 定期执行数据库健康检查

## FAQ

**Q: 自动修复会影响性能吗？**  
A: 参数类型检查的开销可忽略（~0.1ms）。错误诊断仅在出错时执行，不影响正常查询性能。

**Q: 自动修复会删除数据吗？**  
A: 不会。自动修复仅执行 CREATE TABLE 和 ALTER TABLE ADD COLUMN，不会修改或删除现有数据。

**Q: 生产环境可以使用吗？**  
A: 可以。但建议：1) 确保数据库有备份 2) 监控修复日志 3) 频繁修复时检查初始化脚本。

**Q: 可以禁用自动修复吗？**  
A: 参数类型转换是自动的，无法禁用（也不应该禁用）。如需禁用表/字段自动创建，可以注释掉 database.ts 中的自动修复调用代码。

**Q: 如何添加自定义修复方案？**  
A: 编辑 `dbAutoRepair.ts`，在 `tableSchemas` 或 `columnSchemas` 中添加定义。参考本文档"扩展自动修复"部分。

**Q: 修复失败怎么办？**  
A: 查看详细日志，通常是权限问题或表/字段不在预定义列表中。可以手动执行SQL或添加新的修复方案。

---

**相关文档：**
- [修复报告](../BUGFIX_AUTO_REPAIR.md) - 详细的技术实现报告
- [数据库文档](../../sql/README.md) - 数据库表结构说明
- [API文档](./API.md) - 数据库相关API

**需要帮助？**
如有问题或建议，请查看日志或联系开发团队。
