# 数据库工具脚本

本目录包含用于数据库管理和验证的实用脚本。

## 验证脚本

### verify-auto-repair.ts

验证数据库自动修复功能是否正常工作。

**功能：**
- ✅ 测试LIMIT/OFFSET参数类型自动转换
- ✅ 测试错误诊断功能
- ✅ 测试表不存在错误处理
- ✅ 测试字段不存在错误处理
- ✅ 测试数据库健康检查
- ✅ 测试实际数据库查询

**运行方法：**

```bash
# 从server目录运行
cd server
npx tsx scripts/verify-auto-repair.ts

# 或者使用ts-node
ts-node scripts/verify-auto-repair.ts
```

**预期输出：**

```
🔍 开始验证数据库自动修复功能...

📋 测试1: LIMIT/OFFSET 参数类型自动转换
   传入参数类型: limit=string, offset=string
自动修复: LIMIT参数从 string 类型转换为 number 类型
自动修复: OFFSET参数从 string 类型转换为 number 类型
   ✅ 查询成功，返回 X 条记录
   提示: 如果看到"自动修复"警告，说明自动转换生效

📋 测试2: 错误诊断功能
   模拟错误: ER_WRONG_ARGUMENTS
   SQL: SELECT * FROM invite_codes ORDER BY created_at DESC LIMIT ? OFFSET ?
   参数: ["20", "0"]
   ✅ 诊断成功
   信息: LIMIT/OFFSET 参数必须是数字类型...
   操作: TYPE_CONVERSION_NEEDED

... (更多测试)

═══════════════════════════════════════
📊 测试结果汇总
═══════════════════════════════════════
✅ 参数类型转换
✅ 错误诊断
✅ 表不存在诊断
✅ 字段不存在诊断
✅ 健康检查
✅ 实际查询
═══════════════════════════════════════
总计: 6 项测试
通过: 6 项
失败: 0 项
═══════════════════════════════════════

🎉 所有测试通过！数据库自动修复功能工作正常。
```

**故障排查：**

如果测试失败，可能的原因：

1. **数据库未连接**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3306
   ```
   解决：启动MySQL服务或检查数据库配置

2. **表不存在**
   ```
   Error: Table 'liuyao_db.divination_records' doesn't exist
   ```
   解决：运行数据库初始化脚本
   ```bash
   mysql -u root -p < sql/init_database.sql
   mysql -u root -p < sql/insert_data.sql
   ```

3. **权限不足**
   ```
   Error: Access denied for user...
   ```
   解决：检查 .env 文件中的数据库用户名和密码

## 其他脚本

### 计划添加的脚本

- `backup-database.ts` - 数据库备份
- `restore-database.ts` - 数据库恢复
- `cleanup-old-records.ts` - 清理旧记录
- `migrate-database.ts` - 数据库迁移
- `check-data-integrity.ts` - 数据完整性检查

---

**需要帮助？**

查看以下文档：
- [数据库自动修复文档](../docs/DB_AUTO_REPAIR_USAGE.md)
- [修复报告](../BUGFIX_AUTO_REPAIR.md)
- [数据库文档](../sql/README.md)
