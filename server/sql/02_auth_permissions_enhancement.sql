-- ===================================================================
-- 六爻排盘系统 - 认证权限管理增强数据库迁移脚本
-- 版本: 2.0
-- 新增功能: 登录日志、操作日志、Token黑名单、邮箱验证、会话管理等
-- 目标: 兼容 MySQL 5.7+，并可在 docker-entrypoint-initdb.d 中顺序执行
-- ===================================================================

USE liuyao_db;
SET NAMES utf8mb4;

-- ====================================
-- 1. 登录日志表 (login_logs)
-- ====================================
CREATE TABLE IF NOT EXISTS login_logs (
  id VARCHAR(50) PRIMARY KEY COMMENT '日志ID',
  user_id VARCHAR(50) COMMENT '用户ID',
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  login_status TINYINT NOT NULL COMMENT '登录状态: 0-失败 1-成功',
  failure_reason VARCHAR(255) COMMENT '失败原因',
  session_id VARCHAR(100) COMMENT '会话ID',

  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_login_time (login_time),
  INDEX idx_login_status (login_status),
  INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ====================================
-- 2. 操作日志表 (operation_logs)
-- ====================================
CREATE TABLE IF NOT EXISTS operation_logs (
  id VARCHAR(50) PRIMARY KEY COMMENT '日志ID',
  user_id VARCHAR(50) COMMENT '操作用户ID',
  username VARCHAR(50) NOT NULL COMMENT '操作用户名',
  operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
  operation_module VARCHAR(50) NOT NULL COMMENT '操作模块',
  operation_description TEXT COMMENT '操作描述',
  request_method VARCHAR(10) COMMENT '请求方法',
  request_url VARCHAR(500) COMMENT '请求URL',
  request_params TEXT COMMENT '请求参数(JSON格式)',
  response_status INT COMMENT '响应状态码',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  execution_time INT COMMENT '执行时间(毫秒)',

  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_operation_type (operation_type),
  INDEX idx_operation_module (operation_module),
  INDEX idx_operation_time (operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ====================================
-- 3. Token黑名单表 (token_blacklist)
-- ====================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  id VARCHAR(50) PRIMARY KEY COMMENT '黑名单记录ID',
  token_jti VARCHAR(255) NOT NULL COMMENT 'Token唯一标识(jti)',
  user_id VARCHAR(50) COMMENT '用户ID',
  token_type VARCHAR(20) NOT NULL COMMENT 'Token类型: access/refresh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  expires_at TIMESTAMP NOT NULL COMMENT 'Token过期时间',
  reason VARCHAR(255) COMMENT '加入黑名单原因',

  UNIQUE KEY uk_token_jti (token_jti),
  INDEX idx_user_id (user_id),
  INDEX idx_token_type (token_type),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token黑名单表';

-- 兼容旧版本：确保 created_at 字段存在
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'token_blacklist'
     AND COLUMN_NAME = 'created_at') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE token_blacklist ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ====================================
-- 4. 邮箱验证表 (email_verifications)
-- ====================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id VARCHAR(50) PRIMARY KEY COMMENT '验证ID',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  email VARCHAR(100) NOT NULL COMMENT '邮箱地址',
  verification_type VARCHAR(20) NOT NULL COMMENT '验证类型: register/reset_password/change_email',
  token VARCHAR(100) NOT NULL COMMENT '验证令牌',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  is_used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
  used_at TIMESTAMP NULL COMMENT '使用时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_verification_type (verification_type),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at),
  INDEX idx_is_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证表';

-- ====================================
-- 5. 用户会话表 (user_sessions)
-- ====================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(50) PRIMARY KEY COMMENT '会话ID',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  session_token VARCHAR(255) NOT NULL COMMENT '会话令牌（通常存 access token 或其 jti）',
  device_info TEXT COMMENT '设备信息(JSON格式)',
  ip_address VARCHAR(45) COMMENT '登录IP',
  user_agent TEXT COMMENT '用户代理',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',

  UNIQUE KEY uk_session_token (session_token),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_last_activity (last_activity),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- ====================================
-- 6. users 表增强字段（按需添加）
-- ====================================

-- email_verified
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'email_verified') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE COMMENT "邮箱是否已验证";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- phone
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'phone') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN phone VARCHAR(20) COMMENT "手机号码";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- phone_verified
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'phone_verified') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE COMMENT "手机是否已验证";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- two_factor_enabled
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'two_factor_enabled') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE COMMENT "是否启用双因素认证";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- two_factor_secret
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'two_factor_secret') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(64) COMMENT "双因素认证密钥";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- login_fail_count
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'login_fail_count') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN login_fail_count INT DEFAULT 0 COMMENT "连续登录失败次数";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- locked_until
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'locked_until') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL COMMENT "账号锁定到期时间";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- last_password_change（注册/改密使用）
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'last_password_change') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN last_password_change TIMESTAMP NULL COMMENT "最后密码修改时间";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ====================================
-- 7. 增加新的权限（日志/会话/安全/邮箱）
-- ====================================
INSERT INTO permissions (id, permission_name, permission_code, description, module, status) VALUES
-- 日志管理权限 (4个)
('perm-log-001', '查看登录日志', 'log:viewLogin', '允许查看用户登录日志', 'log', 1),
('perm-log-002', '查看操作日志', 'log:viewOperation', '允许查看用户操作日志', 'log', 1),
('perm-log-003', '删除日志', 'log:delete', '允许删除历史日志', 'log', 1),
('perm-log-004', '导出日志', 'log:export', '允许导出日志数据', 'log', 1),

-- 会话管理权限 (3个)
('perm-session-001', '查看会话', 'session:view', '允许查看用户会话', 'session', 1),
('perm-session-002', '管理会话', 'session:manage', '允许管理用户会话（踢下线等）', 'session', 1),
('perm-session-003', '多设备控制', 'session:multiDevice', '允许控制多设备登录', 'session', 1),

-- 安全管理权限 (5个)
('perm-security-001', '查看安全设置', 'security:view', '允许查看安全设置', 'security', 1),
('perm-security-002', '管理安全设置', 'security:manage', '允许管理安全设置', 'security', 1),
('perm-security-003', '强制密码重置', 'security:forcePasswordReset', '允许强制用户重置密码', 'security', 1),
('perm-security-004', '账号锁定解锁', 'security:lockUnlock', '允许锁定和解锁用户账号', 'security', 1),
('perm-security-005', '查看审计报告', 'security:auditReport', '允许查看安全审计报告', 'security', 1),

-- 邮箱验证权限 (2个)
('perm-email-001', '邮箱验证', 'email:verify', '允许进行邮箱验证', 'email', 1),
('perm-email-002', '批量邮箱验证', 'email:batchVerify', '允许批量发送邮箱验证', 'email', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 为管理员角色分配新权限
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  CONCAT('rp-admin-new-', SUBSTRING(MD5(CONCAT(r.id, p.id)), 1, 20)) as id,
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'admin'
  AND p.status = 1
  AND p.permission_code IN (
    'log:viewLogin', 'log:viewOperation', 'log:delete', 'log:export',
    'session:view', 'session:manage', 'session:multiDevice',
    'security:view', 'security:manage', 'security:forcePasswordReset',
    'security:lockUnlock', 'security:auditReport',
    'email:verify', 'email:batchVerify'
  )
ON DUPLICATE KEY UPDATE role_permissions.created_at = role_permissions.created_at;

-- ====================================
-- 完成提示
-- ====================================
SELECT '认证权限管理增强功能迁移完成!' as message,
       (SELECT COUNT(*) FROM login_logs) as login_logs_count,
       (SELECT COUNT(*) FROM operation_logs) as operation_logs_count,
       (SELECT COUNT(*) FROM token_blacklist) as token_blacklist_count,
       (SELECT COUNT(*) FROM email_verifications) as email_verifications_count,
       (SELECT COUNT(*) FROM user_sessions) as user_sessions_count;
