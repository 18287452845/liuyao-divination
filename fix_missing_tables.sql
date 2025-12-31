-- 修复缺失的表和字段

USE liuyao_db;

-- 创建 audit_logs 表
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY COMMENT '审计日志ID',
  user_id VARCHAR(50) COMMENT '用户ID',
  username VARCHAR(50) COMMENT '用户名',
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  resource_type VARCHAR(50) COMMENT '资源类型',
  resource_id VARCHAR(50) COMMENT '资源ID',
  details TEXT COMMENT '详细信息(JSON格式)',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-失败 1-成功',
  error_message TEXT COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- 创建 user_sessions 表
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(50) PRIMARY KEY COMMENT '会话ID',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  session_token VARCHAR(255) NOT NULL COMMENT '会话令牌',
  device_info TEXT COMMENT '设备信息(JSON格式)',
  ip_address VARCHAR(45) COMMENT '登录IP',
  user_agent TEXT COMMENT '用户代理',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  expires_at TIMESTAMP NULL COMMENT '过期时间',
  UNIQUE KEY uk_session_token (session_token),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_last_activity (last_activity),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- 创建 token_blacklist 表 (如果不存在)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id VARCHAR(50) PRIMARY KEY COMMENT '黑名单记录ID',
  token_jti VARCHAR(255) NOT NULL COMMENT 'Token唯一标识(jti)',
  user_id VARCHAR(50) COMMENT '用户ID',
  token_type VARCHAR(20) NOT NULL COMMENT 'Token类型: access/refresh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  expires_at TIMESTAMP NULL COMMENT 'Token过期时间',
  reason VARCHAR(255) COMMENT '加入黑名单原因',
  UNIQUE KEY uk_token_jti (token_jti),
  INDEX idx_user_id (user_id),
  INDEX idx_token_type (token_type),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token黑名单表';

SELECT '修复完成!' as message,
       (SELECT COUNT(*) FROM audit_logs) as audit_logs_count,
       (SELECT COUNT(*) FROM user_sessions) as user_sessions_count,
       (SELECT COUNT(*) FROM token_blacklist) as token_blacklist_count;