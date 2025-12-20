-- ===================================================================
-- 六爻排盘系统 - 完整数据库初始化脚本
-- MySQL 5.7+
-- 包含：基础表、认证表、权限表、用户数据隔离、验证反馈
-- ===================================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS liuyao_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE liuyao_db;

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ====================================
-- 基础表
-- ====================================

-- 1. 卦象记录表 (divination_records)
-- 包含用户数据隔离和验证反馈功能
CREATE TABLE IF NOT EXISTS divination_records (
  id VARCHAR(50) PRIMARY KEY COMMENT '记录唯一标识',
  timestamp BIGINT NOT NULL COMMENT '起卦时间戳',
  question TEXT NOT NULL COMMENT '占问事项',
  gender VARCHAR(10) COMMENT '性别',
  bazi TEXT COMMENT '八字信息(JSON格式)',
  method VARCHAR(20) NOT NULL COMMENT '起卦方式: time/number/manual/input',
  ben_gua TEXT NOT NULL COMMENT '本卦数据(JSON格式)',
  bian_gua TEXT COMMENT '变卦数据(JSON格式)',
  decoration TEXT NOT NULL COMMENT '装卦信息(JSON格式)',
  ai_analysis TEXT COMMENT 'AI解卦分析',
  user_id VARCHAR(50) COMMENT '创建用户ID',

  -- 验证反馈字段
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
  actual_result TEXT COMMENT '实际结果（用户填写）',
  verify_time BIGINT COMMENT '验证时间（时间戳）',
  accuracy_rating INT COMMENT '准确度评分（1-5星）',
  user_notes TEXT COMMENT '用户验证笔记',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_timestamp (timestamp),
  INDEX idx_method (method),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id),
  INDEX idx_is_verified (is_verified),
  INDEX idx_verify_time (verify_time),
  INDEX idx_accuracy_rating (accuracy_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卦象记录表';

-- 2. 八卦基础数据表 (trigrams)
CREATE TABLE IF NOT EXISTS trigrams (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  name VARCHAR(50) NOT NULL COMMENT '卦名',
  symbol VARCHAR(50) NOT NULL COMMENT '卦符',
  nature VARCHAR(50) NOT NULL COMMENT '卦象属性(天地雷风水火山泽)',
  element VARCHAR(50) NOT NULL COMMENT '五行属性',
  number INT NOT NULL COMMENT '卦序号',

  UNIQUE KEY uk_name (name),
  UNIQUE KEY uk_number (number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='八卦基础数据表';

-- 3. 六十四卦数据表 (gua_data)
CREATE TABLE IF NOT EXISTS gua_data (
  number INT PRIMARY KEY COMMENT '卦序号(1-64)',
  name VARCHAR(20) NOT NULL COMMENT '卦名',
  upper_trigram VARCHAR(10) NOT NULL COMMENT '上卦',
  lower_trigram VARCHAR(10) NOT NULL COMMENT '下卦',
  gua_ci TEXT COMMENT '卦辞',
  yao_ci TEXT COMMENT '爻辞(JSON数组格式)',

  UNIQUE KEY uk_name (name),
  INDEX idx_trigrams (upper_trigram, lower_trigram)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='六十四卦数据表';

-- ====================================
-- 认证和权限表
-- ====================================

-- 4. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
  email VARCHAR(100) COMMENT '邮箱',
  real_name VARCHAR(100) COMMENT '真实姓名',
  avatar VARCHAR(255) COMMENT '头像URL',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',

  -- API Key字段
  deepseek_api_key VARCHAR(255) COMMENT 'DeepSeek API密钥(用户个人)',
  api_key_updated_at TIMESTAMP NULL COMMENT 'API密钥最后更新时间',

  -- 登录安全字段
  login_fail_count INT DEFAULT 0 COMMENT '登录失败次数',
  locked_until TIMESTAMP NULL COMMENT '账号锁定截止时间',
  last_password_change TIMESTAMP NULL COMMENT '最后密码修改时间',

  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  last_login_ip VARCHAR(45) COMMENT '最后登录IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 5. 角色表 (roles)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY COMMENT '角色ID',
  role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
  role_code VARCHAR(50) NOT NULL COMMENT '角色代码',
  description TEXT COMMENT '角色描述',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  UNIQUE KEY uk_role_name (role_name),
  UNIQUE KEY uk_role_code (role_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 6. 权限表 (permissions)
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(50) PRIMARY KEY COMMENT '权限ID',
  permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
  permission_code VARCHAR(100) NOT NULL COMMENT '权限代码',
  description TEXT COMMENT '权限描述',
  module VARCHAR(50) COMMENT '所属模块',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  UNIQUE KEY uk_permission_code (permission_code),
  INDEX idx_module (module),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 7. 用户角色关联表 (user_roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(50) PRIMARY KEY COMMENT '关联ID',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  role_id VARCHAR(50) NOT NULL COMMENT '角色ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  UNIQUE KEY uk_user_role (user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 8. 角色权限关联表 (role_permissions)
CREATE TABLE IF NOT EXISTS role_permissions (
  id VARCHAR(50) PRIMARY KEY COMMENT '关联ID',
  role_id VARCHAR(50) NOT NULL COMMENT '角色ID',
  permission_id VARCHAR(50) NOT NULL COMMENT '权限ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  UNIQUE KEY uk_role_permission (role_id, permission_id),
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id),

  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';
