-- ===================================================================
-- 六爻排盘系统 - 认证权限功能完善迁移脚本
-- 版本: 1.0.0 -> 1.1.0
-- 新增功能：审计日志、邀请码管理、Token黑名单、密码安全字段
-- 目标: 兼容 MySQL 5.7+，与 02_auth_permissions_enhancement.sql 可顺序执行
-- ===================================================================

USE liuyao_db;
SET NAMES utf8mb4;

-- ====================================
-- 1. 创建审计日志表 (audit_logs)
-- ====================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY COMMENT '日志唯一标识',
  user_id VARCHAR(50) COMMENT '操作用户ID',
  username VARCHAR(50) COMMENT '操作用户名',
  action VARCHAR(100) NOT NULL COMMENT '操作动作',
  resource_type VARCHAR(50) COMMENT '资源类型',
  resource_id VARCHAR(50) COMMENT '资源ID',
  details TEXT COMMENT '操作详情(JSON格式)',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  status TINYINT NOT NULL COMMENT '操作状态: 0-失败 1-成功',
  error_message TEXT COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource_type (resource_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- ====================================
-- 2. 创建邀请码管理表 (invite_codes)
-- ====================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id VARCHAR(50) PRIMARY KEY COMMENT '邀请码ID',
  code VARCHAR(50) NOT NULL COMMENT '邀请码',
  name VARCHAR(100) COMMENT '邀请码名称',
  description TEXT COMMENT '邀请码描述',
  max_uses INT DEFAULT 1 COMMENT '最大使用次数',
  used_count INT DEFAULT 0 COMMENT '已使用次数',
  expires_at TIMESTAMP NULL COMMENT '过期时间(NULL表示永不过期)',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  created_by VARCHAR(50) COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  UNIQUE KEY uk_invite_code (code),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_by (created_by),

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码管理表';

-- ====================================
-- 3. Token黑名单表 (token_blacklist)
-- （如果增强脚本已经创建，这里不会覆盖）
-- ====================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  id VARCHAR(50) PRIMARY KEY COMMENT '黑名单记录ID',
  token_jti VARCHAR(255) NOT NULL COMMENT 'Token JWT ID',
  user_id VARCHAR(50) COMMENT '用户ID',
  token_type VARCHAR(20) NOT NULL COMMENT 'Token类型: access/refresh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  expires_at TIMESTAMP NULL COMMENT 'Token过期时间',
  reason VARCHAR(255) COMMENT '加入黑名单原因',

  UNIQUE KEY uk_token_jti (token_jti),
  INDEX idx_user_id (user_id),
  INDEX idx_token_type (token_type),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token黑名单表';

-- ====================================
-- 4. 扩展 users 表字段（按需添加）
-- ====================================

-- login_fail_count
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'login_fail_count') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN login_fail_count INT DEFAULT 0 COMMENT "登录失败次数";'
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

-- password_reset_token
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'password_reset_token') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL COMMENT "密码重置令牌";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- password_reset_expires
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'password_reset_expires') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP NULL COMMENT "密码重置令牌过期时间";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- last_password_change
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

-- email_verification_token
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'liuyao_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'email_verification_token') > 0,
  'SELECT "Column already exists" as result;',
  'ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL COMMENT "邮箱验证令牌";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为现有用户设置最后密码修改时间
UPDATE users SET last_password_change = created_at WHERE last_password_change IS NULL;

-- ====================================
-- 5. 新增权限数据（审计/邀请码/系统/数据）
-- ====================================
INSERT INTO permissions (id, permission_name, permission_code, description, module, status) VALUES
-- 审计管理权限 (3个)
('perm-audit-001', '查看审计日志', 'audit:view', '允许查看审计日志', 'audit', 1),
('perm-audit-002', '导出审计日志', 'audit:export', '允许导出审计日志', 'audit', 1),
('perm-audit-003', '清理审计日志', 'audit:cleanup', '允许清理过期审计日志', 'audit', 1),

-- 邀请码管理权限 (4个)
('perm-invite-001', '查看邀请码', 'invite:view', '允许查看邀请码列表', 'invite', 1),
('perm-invite-002', '创建邀请码', 'invite:create', '允许创建新的邀请码', 'invite', 1),
('perm-invite-003', '编辑邀请码', 'invite:edit', '允许编辑邀请码信息', 'invite', 1),
('perm-invite-004', '删除邀请码', 'invite:delete', '允许删除邀请码', 'invite', 1),

-- 系统管理权限 (2个)
('perm-system-001', '查看系统信息', 'system:info', '允许查看系统运行信息', 'system', 1),
('perm-system-002', '系统配置', 'system:config', '允许修改系统配置', 'system', 1),

-- 数据管理权限 (3个)
('perm-data-001', '数据导出', 'data:export', '允许导出系统数据', 'data', 1),
('perm-data-002', '数据导入', 'data:import', '允许导入系统数据', 'data', 1),
('perm-data-003', '数据备份', 'data:backup', '允许执行数据备份', 'data', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================
-- 6. 为管理员角色分配新增权限
-- ====================================
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  CONCAT('rp-admin-new-', SUBSTRING(MD5(CONCAT(r.id, p.id)), 1, 20)) as id,
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'admin'
  AND p.status = 1
  AND p.id IN (
    'perm-audit-001', 'perm-audit-002', 'perm-audit-003',
    'perm-invite-001', 'perm-invite-002', 'perm-invite-003', 'perm-invite-004',
    'perm-system-001', 'perm-system-002',
    'perm-data-001', 'perm-data-002', 'perm-data-003'
  )
ON DUPLICATE KEY UPDATE role_permissions.created_at = role_permissions.created_at;

-- ====================================
-- 7. 插入默认邀请码
-- ====================================
INSERT INTO invite_codes (id, code, name, description, max_uses, status) VALUES
('invite-default-001', '1663929970', '默认邀请码', '系统默认邀请码，用于初始用户注册', 1000, 1),
('invite-admin-001', 'ADMININVITE2024', '管理员邀请码', '管理员专用邀请码', 50, 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================
-- 迁移完成
-- ====================================
SELECT '认证权限功能完善迁移完成!' as message,
       (SELECT COUNT(*) FROM audit_logs) as audit_logs_count,
       (SELECT COUNT(*) FROM invite_codes) as invite_codes_count;
