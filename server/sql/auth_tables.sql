-- 六爻排盘系统 - 认证和权限管理表
-- 用于实现用户登录、角色管理、权限控制

USE liuyao_db;

-- ====================================
-- 1. 用户表
-- ====================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY COMMENT '用户唯一标识(UUID)',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名(唯一)',
  password VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
  email VARCHAR(100) UNIQUE COMMENT '邮箱(可选)',
  real_name VARCHAR(100) COMMENT '真实姓名',
  avatar VARCHAR(255) COMMENT '头像URL',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1-正常 0-禁用',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  last_login_ip VARCHAR(45) COMMENT '最后登录IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ====================================
-- 2. 角色表
-- ====================================
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY COMMENT '角色唯一标识(UUID)',
  role_name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称(唯一)',
  role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色代码(如: admin, user)',
  description TEXT COMMENT '角色描述',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1-正常 0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_role_code (role_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ====================================
-- 3. 权限表
-- ====================================
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(50) PRIMARY KEY COMMENT '权限唯一标识(UUID)',
  permission_name VARCHAR(100) NOT NULL UNIQUE COMMENT '权限名称',
  permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限代码(如: divination:create)',
  description TEXT COMMENT '权限描述',
  module VARCHAR(50) NOT NULL COMMENT '所属模块(如: divination, user, role)',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1-正常 0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_permission_code (permission_code),
  INDEX idx_module (module),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- ====================================
-- 4. 用户角色关联表
-- ====================================
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(50) PRIMARY KEY COMMENT '关联唯一标识(UUID)',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  role_id VARCHAR(50) NOT NULL COMMENT '角色ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ====================================
-- 5. 角色权限关联表
-- ====================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id VARCHAR(50) PRIMARY KEY COMMENT '关联唯一标识(UUID)',
  role_id VARCHAR(50) NOT NULL COMMENT '角色ID',
  permission_id VARCHAR(50) NOT NULL COMMENT '权限ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ====================================
-- 6. 修改原有的卦象记录表，添加用户关联
-- ====================================
-- 注意：IF NOT EXISTS 在 MySQL 8.0.19+ 才支持，如果版本较低，需要先检查列是否存在
-- 方案1：使用 IF NOT EXISTS (MySQL 8.0.19+)
-- ALTER TABLE divination_records
-- ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) COMMENT '创建用户ID';

-- 方案2：兼容所有版本（推荐）- 如果列已存在会报错，需要手动处理或使用存储过程
ALTER TABLE divination_records
ADD COLUMN user_id VARCHAR(50) COMMENT '创建用户ID';

-- 添加索引（如果索引已存在会报错）
ALTER TABLE divination_records
ADD INDEX idx_user_id (user_id);

-- 如果需要外键约束，可以添加（可选）
-- ALTER TABLE divination_records
-- ADD CONSTRAINT fk_divination_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
