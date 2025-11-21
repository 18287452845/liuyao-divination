-- 六爻排盘系统 MySQL 数据库初始化脚本
-- 数据库名称: liuyao_db
-- 用户名: root
-- 密码: 123456

-- 创建数据库
CREATE DATABASE IF NOT EXISTS liuyao_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE liuyao_db;

-- ====================================
-- 1. 卦象记录表
-- ====================================
CREATE TABLE IF NOT EXISTS divination_records (
  id VARCHAR(50) PRIMARY KEY COMMENT '记录唯一标识',
  timestamp BIGINT NOT NULL COMMENT '起卦时间戳',
  question TEXT NOT NULL COMMENT '占问事项',
  method VARCHAR(20) NOT NULL COMMENT '起卦方式: time/number/manual',
  ben_gua TEXT NOT NULL COMMENT '本卦数据(JSON格式)',
  bian_gua TEXT COMMENT '变卦数据(JSON格式)',
  decoration TEXT NOT NULL COMMENT '装卦信息(JSON格式)',
  ai_analysis TEXT COMMENT 'AI解卦分析',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_timestamp (timestamp),
  INDEX idx_method (method),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卦象记录表';

-- ====================================
-- 2. 八卦基础数据表
-- ====================================
CREATE TABLE IF NOT EXISTS trigrams (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  name VARCHAR(50) NOT NULL COMMENT '卦名',
  symbol VARCHAR(50) NOT NULL COMMENT '卦符',
  nature VARCHAR(50) NOT NULL COMMENT '卦象属性(天地雷风水火山泽)',
  element VARCHAR(50) NOT NULL COMMENT '五行属性',
  number INT NOT NULL COMMENT '卦序号',
  UNIQUE KEY uk_name (name),
  UNIQUE KEY uk_number (number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='八卦基础数据表';

-- ====================================
-- 3. 六十四卦数据表
-- ====================================
CREATE TABLE IF NOT EXISTS gua_data (
  number INT PRIMARY KEY COMMENT '卦序号(1-64)',
  name VARCHAR(20) NOT NULL COMMENT '卦名',
  upper_trigram VARCHAR(10) NOT NULL COMMENT '上卦',
  lower_trigram VARCHAR(10) NOT NULL COMMENT '下卦',
  gua_ci TEXT NOT NULL COMMENT '卦辞',
  yao_ci TEXT NOT NULL COMMENT '爻辞(JSON数组格式)',
  UNIQUE KEY uk_name (name),
  INDEX idx_trigrams (upper_trigram, lower_trigram)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='六十四卦数据表';
