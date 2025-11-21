-- 添加验证反馈相关字段到 divination_records 表
-- 用于用户在事情应验后回来记录实际结果

-- 添加验证字段
ALTER TABLE divination_records
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证';

ALTER TABLE divination_records
ADD COLUMN actual_result TEXT COMMENT '实际结果（用户填写）';

ALTER TABLE divination_records
ADD COLUMN verify_time BIGINT COMMENT '验证时间（时间戳）';

ALTER TABLE divination_records
ADD COLUMN accuracy_rating INT COMMENT '准确度评分（1-5星）';

ALTER TABLE divination_records
ADD COLUMN user_notes TEXT COMMENT '用户验证笔记';

-- 添加索引以提高查询性能
CREATE INDEX idx_is_verified ON divination_records(is_verified);
CREATE INDEX idx_verify_time ON divination_records(verify_time);
CREATE INDEX idx_accuracy_rating ON divination_records(accuracy_rating);
