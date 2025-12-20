-- 创建 user_sessions 表
USE liuyao_db;

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

SELECT 'user_sessions 表创建成功!' as message;