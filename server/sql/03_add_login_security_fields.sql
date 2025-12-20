-- ===================================================================
-- 六爻排盘系统 - 登录安全字段迁移脚本
-- 为 users 表添加登录失败计数和锁定字段
-- ===================================================================

USE liuyao_db;
SET NAMES utf8mb4;

-- 检查并添加 login_fail_count 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_fail_count INT DEFAULT 0 COMMENT '登录失败次数';

-- 检查并添加 locked_until 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL COMMENT '账号锁定截止时间';

-- 检查并添加 last_password_change 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP NULL COMMENT '最后密码修改时间';

-- 如果是新建用户，初始化密码修改时间为当前时间
UPDATE users SET last_password_change = NOW() WHERE last_password_change IS NULL;

-- 完成迁移
SELECT '✓ 登录安全字段迁移完成' as migration_status;
