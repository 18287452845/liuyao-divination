-- 创建 audit_logs 表
USE liuyao_db;

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

SELECT 'audit_logs 表创建成功!' as message;