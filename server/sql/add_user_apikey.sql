-- 为用户表添加 DeepSeek API Key 字段
-- 允许每个用户独立管理自己的 API Key

USE liuyao_db;

-- 添加 deepseek_api_key 字段到 users 表
ALTER TABLE users
ADD COLUMN deepseek_api_key VARCHAR(255) COMMENT 'DeepSeek API密钥(用户个人)';

-- 添加 api_key_updated_at 字段记录更新时间
ALTER TABLE users
ADD COLUMN api_key_updated_at TIMESTAMP NULL COMMENT 'API密钥最后更新时间';

-- 确保 divination_records 表有 user_id 字段（如果还没有）
-- 这个字段应该已经由 auth_tables.sql 创建了，这里只是确认
-- ALTER TABLE divination_records
-- ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) COMMENT '创建用户ID';

-- 为已存在的记录添加索引（如果还没有）
-- ALTER TABLE divination_records
-- ADD INDEX IF NOT EXISTS idx_user_id (user_id);
