-- 添加命主信息字段到divination_records表
USE liuyao_db;

-- 添加性别字段
ALTER TABLE divination_records
ADD COLUMN gender VARCHAR(10) COMMENT '命主性别: 男/女/未知' AFTER question;

-- 添加八字字段
ALTER TABLE divination_records
ADD COLUMN bazi TEXT COMMENT '命主八字(JSON格式)' AFTER gender;

-- 查看表结构
DESC divination_records;
