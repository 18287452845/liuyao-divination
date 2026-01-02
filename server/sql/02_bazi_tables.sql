-- ============================================
-- 八字批命功能 - 数据表定义
-- ============================================

USE liuyao_db;

-- --------------------------------------------
-- 表1: bazi_records - 八字记录主表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS bazi_records (
  -- 基础标识
  id VARCHAR(50) PRIMARY KEY COMMENT '记录UUID',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID（数据隔离）',
  timestamp BIGINT NOT NULL COMMENT '创建时间戳',

  -- 基本信息
  name VARCHAR(100) COMMENT '命主姓名（可选）',
  gender ENUM('男', '女') NOT NULL COMMENT '性别（必须，影响大运）',
  birth_datetime BIGINT NOT NULL COMMENT '出生时间戳',
  birth_location VARCHAR(200) COMMENT '出生地点（可选，用于真太阳时校正）',
  use_true_solar_time BOOLEAN DEFAULT FALSE COMMENT '是否使用真太阳时',

  -- 四柱信息（便于快速查询和显示）
  year_pillar VARCHAR(10) NOT NULL COMMENT '年柱（如"庚午"）',
  month_pillar VARCHAR(10) NOT NULL COMMENT '月柱',
  day_pillar VARCHAR(10) NOT NULL COMMENT '日柱',
  hour_pillar VARCHAR(10) NOT NULL COMMENT '时柱',

  -- 八字完整数据（JSON格式，包含详细分析）
  bazi_data TEXT NOT NULL COMMENT '八字完整对象（包含十神、五行、藏干等）',
  /* JSON 结构示例：
  {
    "year": {"gan": "庚", "zhi": "午", "ganWuXing": "金", ...},
    "month": {...},
    "day": {...},
    "hour": {...},
    "riGan": "甲",
    "shiShen": {
      "year": {"gan": "偏财", "zhi": "正官"},
      "month": {...},
      "hour": {...}
    },
    "wuXingCount": {"木": 2, "火": 3, "土": 1, "金": 1, "水": 1},
    "yongShen": "水",
    "jiShen": "火",
    "relations": {
      "liuHe": [...],
      "sanHe": [...],
      "liuChong": [...],
      "sanXing": [...],
      "xiangHai": [...]
    }
  }
  */

  -- 大运信息（JSON数组）
  dayun_data TEXT COMMENT '大运列表',
  /* JSON 结构示例：
  [
    {
      "ganZhi": "庚寅",
      "startAge": 3,
      "endAge": 12,
      "gan": "庚",
      "zhi": "寅",
      "wuXing": {"gan": "金", "zhi": "木"},
      "shiShen": {"gan": "偏财", "zhi": "偏印"}
    },
    ...
  ]
  */
  qiyun_age INT COMMENT '起运年龄',
  shun_pai BOOLEAN COMMENT '是否顺排大运',

  -- AI分析
  ai_analysis TEXT COMMENT 'AI批注内容',
  ai_model VARCHAR(50) COMMENT '使用的AI模型（如deepseek-chat）',
  ai_analyzed_at BIGINT COMMENT 'AI分析完成时间戳',

  -- 验证反馈（用于积累数据和评估准确度）
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
  actual_feedback TEXT COMMENT '实际情况反馈',
  verify_time BIGINT COMMENT '验证时间戳',
  accuracy_rating INT COMMENT '准确度评分（1-5星）',
  user_notes TEXT COMMENT '用户备注',

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 索引优化
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_created_at (created_at),
  INDEX idx_gender (gender),
  INDEX idx_is_verified (is_verified),
  INDEX idx_year_pillar (year_pillar),
  INDEX idx_day_pillar (day_pillar),

  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='八字记录表';

-- --------------------------------------------
-- 表2: jie_qi_data - 节气数据表（可选，用于精确起运计算）
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS jie_qi_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL COMMENT '年份',
  jieqi_name VARCHAR(20) NOT NULL COMMENT '节气名称（立春、雨水等）',
  jieqi_datetime BIGINT NOT NULL COMMENT '节气时间戳（精确到秒）',
  jieqi_type ENUM('节', '气') COMMENT '节气类型',
  solar_term_index INT COMMENT '节气序号（0-23）',

  INDEX idx_year (year),
  INDEX idx_jieqi_name (jieqi_name),
  UNIQUE KEY uk_year_name (year, jieqi_name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节气数据表';

-- --------------------------------------------
-- 表3: liu_shi_jia_zi - 六十甲子表（可选，也可用算法生成）
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS liu_shi_jia_zi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  index_num INT NOT NULL COMMENT '序号（0-59）',
  gan_zhi VARCHAR(10) NOT NULL COMMENT '干支组合（甲子、乙丑等）',
  gan VARCHAR(10) NOT NULL COMMENT '天干',
  zhi VARCHAR(10) NOT NULL COMMENT '地支',
  gan_wu_xing VARCHAR(10) COMMENT '天干五行',
  zhi_wu_xing VARCHAR(10) COMMENT '地支五行',
  na_yin VARCHAR(20) COMMENT '纳音五行（如海中金）',

  UNIQUE KEY uk_index (index_num),
  UNIQUE KEY uk_ganzhi (gan_zhi)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='六十甲子表';

-- --------------------------------------------
-- 初始化六十甲子数据（如果表为空）
-- --------------------------------------------
INSERT INTO liu_shi_jia_zi (index_num, gan_zhi, gan, zhi, gan_wu_xing, zhi_wu_xing, na_yin) VALUES
(0, '甲子', '甲', '子', '木', '水', '海中金'),
(1, '乙丑', '乙', '丑', '木', '土', '海中金'),
(2, '丙寅', '丙', '寅', '火', '木', '炉中火'),
(3, '丁卯', '丁', '卯', '火', '木', '炉中火'),
(4, '戊辰', '戊', '辰', '土', '土', '大林木'),
(5, '己巳', '己', '巳', '土', '火', '大林木'),
(6, '庚午', '庚', '午', '金', '火', '路旁土'),
(7, '辛未', '辛', '未', '金', '土', '路旁土'),
(8, '壬申', '壬', '申', '水', '金', '剑锋金'),
(9, '癸酉', '癸', '酉', '水', '金', '剑锋金'),
(10, '甲戌', '甲', '戌', '木', '土', '山头火'),
(11, '乙亥', '乙', '亥', '木', '水', '山头火'),
(12, '丙子', '丙', '子', '火', '水', '涧下水'),
(13, '丁丑', '丁', '丑', '火', '土', '涧下水'),
(14, '戊寅', '戊', '寅', '土', '木', '城墙土'),
(15, '己卯', '己', '卯', '土', '木', '城墙土'),
(16, '庚辰', '庚', '辰', '金', '土', '白蜡金'),
(17, '辛巳', '辛', '巳', '金', '火', '白蜡金'),
(18, '壬午', '壬', '午', '水', '火', '杨柳木'),
(19, '癸未', '癸', '未', '水', '土', '杨柳木'),
(20, '甲申', '甲', '申', '木', '金', '泉中水'),
(21, '乙酉', '乙', '酉', '木', '金', '泉中水'),
(22, '丙戌', '丙', '戌', '火', '土', '屋上土'),
(23, '丁亥', '丁', '亥', '火', '水', '屋上土'),
(24, '戊子', '戊', '子', '土', '水', '霹雳火'),
(25, '己丑', '己', '丑', '土', '土', '霹雳火'),
(26, '庚寅', '庚', '寅', '金', '木', '松柏木'),
(27, '辛卯', '辛', '卯', '金', '木', '松柏木'),
(28, '壬辰', '壬', '辰', '水', '土', '长流水'),
(29, '癸巳', '癸', '巳', '水', '火', '长流水'),
(30, '甲午', '甲', '午', '木', '火', '沙中金'),
(31, '乙未', '乙', '未', '木', '土', '沙中金'),
(32, '丙申', '丙', '申', '火', '金', '山下火'),
(33, '丁酉', '丁', '酉', '火', '金', '山下火'),
(34, '戊戌', '戊', '戌', '土', '土', '平地木'),
(35, '己亥', '己', '亥', '土', '水', '平地木'),
(36, '庚子', '庚', '子', '金', '水', '壁上土'),
(37, '辛丑', '辛', '丑', '金', '土', '壁上土'),
(38, '壬寅', '壬', '寅', '水', '木', '金箔金'),
(39, '癸卯', '癸', '卯', '水', '木', '金箔金'),
(40, '甲辰', '甲', '辰', '木', '土', '覆灯火'),
(41, '乙巳', '乙', '巳', '木', '火', '覆灯火'),
(42, '丙午', '丙', '午', '火', '火', '天河水'),
(43, '丁未', '丁', '未', '火', '土', '天河水'),
(44, '戊申', '戊', '申', '土', '金', '大驿土'),
(45, '己酉', '己', '酉', '土', '金', '大驿土'),
(46, '庚戌', '庚', '戌', '金', '土', '钗钏金'),
(47, '辛亥', '辛', '亥', '金', '水', '钗钏金'),
(48, '壬子', '壬', '子', '水', '水', '桑柘木'),
(49, '癸丑', '癸', '丑', '水', '土', '桑柘木'),
(50, '甲寅', '甲', '寅', '木', '木', '大溪水'),
(51, '乙卯', '乙', '卯', '木', '木', '大溪水'),
(52, '丙辰', '丙', '辰', '火', '土', '沙中土'),
(53, '丁巳', '丁', '巳', '火', '火', '沙中土'),
(54, '戊午', '戊', '午', '土', '火', '天上火'),
(55, '己未', '己', '未', '土', '土', '天上火'),
(56, '庚申', '庚', '申', '金', '金', '石榴木'),
(57, '辛酉', '辛', '酉', '金', '金', '石榴木'),
(58, '壬戌', '壬', '戌', '水', '土', '大海水'),
(59, '癸亥', '癸', '亥', '水', '水', '大海水')
ON DUPLICATE KEY UPDATE index_num=VALUES(index_num);

-- --------------------------------------------
-- 添加八字相关权限到 permissions 表
-- --------------------------------------------
INSERT INTO permissions (id, permission_name, permission_code, description, module, created_at) VALUES
  (UUID(), '创建八字记录', 'bazi:create', '创建八字记录', 'bazi', NOW()),
  (UUID(), '查看八字记录', 'bazi:view', '查看八字记录', 'bazi', NOW()),
  (UUID(), '删除八字记录', 'bazi:delete', '删除八字记录', 'bazi', NOW()),
  (UUID(), 'AI批注八字', 'bazi:aiAnalysis', 'AI批注八字', 'bazi', NOW()),
  (UUID(), '验证反馈八字', 'bazi:verify', '验证反馈八字', 'bazi', NOW()),
  (UUID(), '导出八字记录', 'bazi:export', '导出八字记录', 'bazi', NOW())
ON DUPLICATE KEY UPDATE permission_code=VALUES(permission_code);

-- --------------------------------------------
-- 为默认 'user' 角色分配八字权限
-- --------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'user'
  AND p.module = 'bazi'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- --------------------------------------------
-- 为 'admin' 角色分配所有八字权限
-- --------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'admin'
  AND p.module = 'bazi'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- ============================================
-- 完成
-- ============================================
-- 八字批命数据表创建完成！
-- 包含：
-- 1. bazi_records - 八字记录主表
-- 2. jie_qi_data - 节气数据表（可选）
-- 3. liu_shi_jia_zi - 六十甲子表（已初始化数据）
-- 4. 八字相关权限配置
-- ============================================
