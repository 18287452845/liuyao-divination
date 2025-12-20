-- 创建 token_blacklist 表
USE liuyao_db;

CREATE TABLE IF NOT EXISTS token_blacklist (
  id VARCHAR(50) PRIMARY KEY COMMENT '黑名单记录ID',
  token_jti VARCHAR(255) NOT NULL COMMENT 'Token唯一标识(jti)',
  user_id VARCHAR(50) COMMENT '用户ID',
  token_type VARCHAR(20) NOT NULL COMMENT 'Token类型: access/refresh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  reason VARCHAR(255) COMMENT '加入黑名单原因',
  UNIQUE KEY uk_token_jti (token_jti),
  INDEX idx_user_id (user_id),
  INDEX idx_token_type (token_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token黑名单表';

-- 添加 expires_at 字段
ALTER TABLE token_blacklist ADD COLUMN expires_at TIMESTAMP NULL COMMENT 'Token过期时间';
CREATE INDEX idx_expires_at ON token_blacklist (expires_at);

SELECT 'token_blacklist 表创建成功!' as message;