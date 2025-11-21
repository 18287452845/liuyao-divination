# 数据库更新说明

## 功能更新：API Key管理和用户数据隔离

本次更新添加了以下功能：
1. 用户可以独立管理自己的 DeepSeek API Key
2. 每个用户只能查看自己的占卜记录
3. 数据完全隔离，保护用户隐私

## 需要执行的数据库脚本

### 1. 如果还没有运行用户认证表创建脚本
```bash
mysql -u root -p123456 < auth_tables.sql
mysql -u root -p123456 < auth_init_data.sql
```

### 2. 添加 API Key 字段（本次新增）
```bash
mysql -u root -p123456 < add_user_apikey.sql
```

## 脚本说明

### auth_tables.sql
- 创建用户、角色、权限相关表
- 为 divination_records 表添加 user_id 字段

### add_user_apikey.sql (新增)
- 为 users 表添加 deepseek_api_key 字段
- 为 users 表添加 api_key_updated_at 字段

## 字段说明

### users 表新增字段
- `deepseek_api_key` VARCHAR(255) - 用户个人的 DeepSeek API Key
- `api_key_updated_at` TIMESTAMP - API Key 最后更新时间

### divination_records 表新增字段（如果之前没有）
- `user_id` VARCHAR(50) - 创建该记录的用户ID

## 数据迁移注意事项

1. **已有占卜记录**: 如果数据库中已有占卜记录但没有 user_id，这些记录的 user_id 为 NULL
2. **API Key 安全**: API Key 存储在数据库中，建议后续实施加密存储
3. **数据隔离**: 更新后，用户只能访问自己创建的占卜记录

## 验证更新

运行以下 SQL 验证字段是否添加成功：

```sql
-- 检查 users 表字段
SHOW COLUMNS FROM users LIKE 'deepseek_api_key';
SHOW COLUMNS FROM users LIKE 'api_key_updated_at';

-- 检查 divination_records 表字段
SHOW COLUMNS FROM divination_records LIKE 'user_id';

-- 检查索引
SHOW INDEX FROM divination_records WHERE Column_name = 'user_id';
```

## 前端更新

前端新增了 API Key 设置页面：
- 路由: `/settings/api-key`
- 功能: 查看、更新、删除、测试 API Key

## API 接口更新

新增接口：
- GET `/api/user/api-key` - 获取当前用户的 API Key（脱敏）
- PUT `/api/user/api-key` - 更新 API Key
- DELETE `/api/user/api-key` - 删除 API Key
- POST `/api/user/api-key/test` - 测试 API Key 有效性

现有接口变更：
- 所有占卜记录相关接口现在只返回当前用户的数据
- AI 解卦接口优先使用用户个人的 API Key

## 后续建议

1. 考虑对 API Key 进行加密存储（如使用 AES 加密）
2. 添加 API Key 使用次数统计
3. 添加 API Key 过期提醒功能
4. 考虑添加共享记录功能（可选）
