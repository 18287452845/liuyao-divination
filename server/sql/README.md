# 数据库初始化指南

## 📋 文件说明

### 必需文件（按顺序执行）

1. **00_init_complete.sql** - 完整数据库结构
   - 创建数据库 `liuyao_db`
   - 创建所有表（卦象记录、八卦、64卦、用户、角色、权限等）
   - 包含索引和外键

2. **01_init_data.sql** - 初始化数据
   - 八卦基础数据（8条）
   - 角色数据（管理员、普通用户、VIP）
   - 权限数据（17个权限）
   - 角色权限关联
   - 默认用户（admin/admin123，testuser/test123）

3. **insert_64_gua_complete.sql** - 完整64卦数据
   - 所有64卦的卦名、卦辞、爻辞

### ~~已废弃的文件（不再需要）~~

- ~~init_database.sql~~ → 已合并到 00_init_complete.sql
- ~~insert_data.sql~~ → 已合并到 01_init_data.sql
- ~~auth_tables.sql~~ → 已合并到 00_init_complete.sql
- ~~auth_init_data.sql~~ → 已合并到 01_init_data.sql
- ~~add_user_info.sql~~ → 已合并到 00_init_complete.sql
- ~~add_verification_fields.sql~~ → 已合并到 00_init_complete.sql
- ~~add_user_apikey.sql~~ → 已合并到 00_init_complete.sql
- ~~test_data.sql~~ → 不再需要

## 🚀 快速开始

### 方式一：命令行执行（推荐）

```bash
# Windows
mysql -h14.103.147.50 -uroot -p123456 < 00_init_complete.sql
mysql -h14.103.147.50 -uroot -p123456 < 01_init_data.sql
mysql -h14.103.147.50 -uroot -p123456 < insert_64_gua_complete.sql

# Linux/Mac
mysql -h 14.103.147.50 -u root -p123456 < 00_init_complete.sql
mysql -h 14.103.147.50 -u root -p123456 < 01_init_data.sql
mysql -h 14.103.147.50 -u root -p123456 < insert_64_gua_complete.sql
```

### 方式二：使用脚本

```bash
# Windows
cd server
.\setup_mysql.bat

# Linux/Mac
cd server
chmod +x setup_mysql.sh
./setup_mysql.sh
```

## 📊 数据库结构

### 核心表

| 表名 | 说明 | 字段数 | 初始记录数 |
|------|------|--------|----------|
| divination_records | 卦象记录（包含验证反馈） | 17 | 0 |
| trigrams | 八卦基础数据 | 6 | 8 |
| gua_data | 六十四卦数据 | 6 | 64 |

### 认证表

| 表名 | 说明 | 字段数 | 初始记录数 |
|------|------|--------|----------|
| users | 用户表（含API Key） | 13 | 2 |
| roles | 角色表 | 7 | 3 |
| permissions | 权限表 | 8 | 17 |
| user_roles | 用户角色关联 | 3 | 2 |
| role_permissions | 角色权限关联 | 3 | 28 |

## 👤 默认账号

| 用户名 | 密码 | 角色 | 邮箱 | 权限数 |
|--------|------|------|------|-------|
| admin | admin123 | 系统管理员 | admin@liuyao.com | 17 |
| testuser | test123 | 普通用户 | test@liuyao.com | 4 |

## 🔐 权限配置

### 管理员（admin）- 17个权限
- ✅ 所有占卜权限（5个）
- ✅ 所有用户管理权限（5个）
- ✅ 所有角色管理权限（5个）
- ✅ 所有权限管理权限（2个）

### 普通用户（user）- 4个权限
- ✅ divination:create - 创建占卜
- ✅ divination:view - 查看自己的占卜记录
- ✅ divination:delete - 删除自己的占卜记录
- ✅ divination:aiAnalysis - 使用AI分析

### VIP用户（vip）- 5个权限
- ✅ 所有普通用户权限（4个）
- ✅ divination:viewAll - 查看所有用户的占卜记录

## 🔧 验证安装

```sql
USE liuyao_db;

-- 检查所有表
SHOW TABLES;

-- 检查数据量
SELECT 'trigrams' as table_name, COUNT(*) as count FROM trigrams
UNION ALL SELECT 'gua_data', COUNT(*) FROM gua_data
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'roles', COUNT(*) FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions;

-- 检查角色权限配置
SELECT
  r.role_code,
  r.role_name,
  COUNT(p.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.role_code, r.role_name
ORDER BY r.role_code;
```

**期望输出：**
```
trigrams: 8
gua_data: 64
users: 2
roles: 3
permissions: 17

admin: 17 permissions
user: 4 permissions
vip: 5 permissions
```

## 🗑️ 清理与重建

如果需要完全重新初始化：

```sql
-- 删除数据库
DROP DATABASE IF EXISTS liuyao_db;
```

然后重新执行初始化步骤。

## ⚠️ 注意事项

1. **字符集**：数据库使用 `utf8mb4` 编码，完整支持中文和Emoji
2. **密码安全**：生产环境必须修改默认账号密码
3. **外键约束**：user_roles 和 role_permissions 有外键约束，删除时注意级联
4. **数据隔离**：divination_records.user_id 实现用户数据隔离
5. **验证反馈**：divination_records 包含 is_verified、actual_result 等验证字段
6. **API Key**：users 表包含 deepseek_api_key 字段，支持用户自定义API密钥

## 🆕 新特性

### v2.0 数据库升级内容

1. **用户数据隔离**
   - divination_records 添加 user_id 字段
   - 用户只能查看自己的记录

2. **验证反馈功能**
   - is_verified - 标记是否已验证
   - actual_result - 实际结果
   - verify_time - 验证时间
   - accuracy_rating - 准确度评分（1-5星）
   - user_notes - 用户笔记

3. **用户自定义API Key**
   - deepseek_api_key - 用户个人API密钥
   - api_key_updated_at - 更新时间

4. **八字和性别支持**
   - gender - 性别字段
   - bazi - 八字信息（JSON格式）

5. **权限系统完善**
   - 新注册用户自动分配 user 角色
   - user 角色自动获得4个基本权限
   - 修复了403权限错误问题

## 📚 相关文档

- 项目文档：`../doc/PROJECT_DOCUMENTATION.md`
- API文档：`../doc/API_DOCUMENTATION.md`
- 部署文档：`../doc/DEPLOYMENT.md`
