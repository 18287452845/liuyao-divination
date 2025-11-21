-- 六爻排盘系统 测试数据脚本
-- 使用数据库
USE liuyao_db;

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ====================================
-- 插入测试卦象记录
-- ====================================

-- 测试记录1: 时间起卦法 - 乾为天
INSERT INTO divination_records (id, timestamp, question, method, ben_gua, bian_gua, decoration, ai_analysis, created_at) VALUES
('test-record-001', 1699876543000, '测试问题：今年事业发展如何？', 'time',
'{"name":"乾为天","lines":[1,1,1,1,1,1],"changes":[false,false,false,false,true,false],"trigrams":{"upper":"乾","lower":"乾"}}',
'{"name":"天风姤","lines":[1,1,1,1,1,0],"changes":[false,false,false,false,false,false],"trigrams":{"upper":"乾","lower":"巽"}}',
'{"earthBranches":["子","寅","辰","午","申","戌"],"sixRelatives":["父母","兄弟","官鬼","父母","妻财","子孙"],"fiveElements":["金","金","金","金","金","金"],"heavenlyStems":["甲","甲","甲","壬","壬","壬"],"sixSpirits":["青龙","朱雀","勾陈","螣蛇","白虎","玄武"],"shiYing":[3,0]}',
'测试AI解析内容：此卦为乾为天，六爻皆阳，至刚至健。五爻发动变为天风姤卦。乾卦主事业发展，五爻持世，位居尊位，表示事业有成，地位稳固。但五爻动而变阴，需注意防范小人，保持谦逊。整体来看，今年事业发展向好，但需注意细节，稳扎稳打。',
'2024-01-15 10:30:00');

-- 测试记录2: 数字起卦法 - 水雷屯
INSERT INTO divination_records (id, timestamp, question, method, ben_gua, bian_gua, decoration, ai_analysis, created_at) VALUES
('test-record-002', 1699880143000, '测试问题：近期投资理财是否顺利？', 'number',
'{"name":"水雷屯","lines":[1,0,0,0,1,0],"changes":[false,true,false,false,false,false],"trigrams":{"upper":"坎","lower":"震"}}',
'{"name":"水地比","lines":[1,0,0,0,0,0],"changes":[false,false,false,false,false,false],"trigrams":{"upper":"坎","lower":"坤"}}',
'{"earthBranches":["辰","寅","子","申","午","辰"],"sixRelatives":["兄弟","父母","妻财","子孙","父母","兄弟"],"fiveElements":["土","木","水","金","火","土"],"heavenlyStems":["戊","庚","壬","戊","己","己"],"sixSpirits":["青龙","朱雀","勾陈","螣蛇","白虎","玄武"],"shiYing":[0,3]}',
'测试AI解析内容：屯卦主困难、艰难创业之象。二爻父母爻发动，变为比卦。投资理财方面，屯卦表示初期会遇到一些困难和阻碍，但二爻动化兄弟，提示需要团结合作，寻求专业人士帮助。建议谨慎行事，不宜冒进，可以小额试水，积累经验后再做大的投资决策。',
'2024-01-15 14:20:00');

-- 测试记录3: 手动摇卦法 - 天泽履
INSERT INTO divination_records (id, timestamp, question, method, ben_gua, bian_gua, decoration, ai_analysis, created_at) VALUES
('test-record-003', 1699883743000, '测试问题：感情婚姻运势如何？', 'manual',
'{"name":"天泽履","lines":[1,1,0,1,1,1],"changes":[false,false,true,false,false,false],"trigrams":{"upper":"乾","lower":"兑"}}',
'{"name":"天雷无妄","lines":[1,1,1,1,1,1],"changes":[false,false,false,false,false,false],"trigrams":{"upper":"乾","lower":"震"}}',
'{"earthBranches":["卯","巳","未","午","申","戌"],"sixRelatives":["子孙","妻财","兄弟","父母","妻财","官鬼"],"fiveElements":["木","火","土","火","金","土"],"heavenlyStems":["辛","辛","辛","甲","甲","甲"],"sixSpirits":["青龙","朱雀","勾陈","螣蛇","白虎","玄武"],"shiYing":[2,5]}',
'测试AI解析内容：履卦，如人履虎尾，表示需要谨慎行事。三爻兄弟爻发动化官鬼，变为无妄卦。在感情方面，履卦表示当前关系需要小心维护，三爻动表示会有一些波折。兄弟爻化官鬼，提示可能有第三者介入或者竞争者出现。建议保持真诚，以诚相待，不要轻举妄动。正确的态度和行为能够化解危机，获得良好的感情结果。',
'2024-01-15 18:45:00');

-- 测试记录4: 时间起卦法 - 坤为地（无变爻）
INSERT INTO divination_records (id, timestamp, question, method, ben_gua, bian_gua, decoration, ai_analysis, created_at) VALUES
('test-record-004', 1699887343000, '测试问题：健康状况如何？', 'time',
'{"name":"坤为地","lines":[0,0,0,0,0,0],"changes":[false,false,false,false,false,false],"trigrams":{"upper":"坤","lower":"坤"}}',
NULL,
'{"earthBranches":["酉","亥","丑","卯","巳","未"],"sixRelatives":["子孙","妻财","官鬼","父母","兄弟","子孙"],"fiveElements":["土","土","土","土","土","土"],"heavenlyStems":["乙","乙","乙","癸","癸","癸"],"sixSpirits":["青龙","朱雀","勾陈","螣蛇","白虎","玄武"],"shiYing":[3,0]}',
'测试AI解析内容：坤为地卦，六爻皆阴，至柔至顺。此卦无变爻，表示当前状态稳定。在健康方面，坤卦代表脾胃、消化系统。卦中子孙爻持世，子孙为福神，表示健康状况总体良好。但坤卦过于阴柔，建议加强锻炼，增强体质，注意饮食调理，保持心情愉快。预防性保健比治疗更重要。',
'2024-01-16 08:15:00');

-- 测试记录5: 数字起卦法 - 火雷噬嗑
INSERT INTO divination_records (id, timestamp, question, method, ben_gua, bian_gua, decoration, ai_analysis, created_at) VALUES
('test-record-005', 1699890943000, '测试问题：考试能否顺利通过？', 'number',
'{"name":"火雷噬嗑","lines":[1,0,0,1,0,1],"changes":[false,false,false,true,false,false],"trigrams":{"upper":"离","lower":"震"}}',
'{"name":"火水未济","lines":[1,0,0,0,1,0],"changes":[false,false,false,false,false,false],"trigrams":{"upper":"离","lower":"坎"}}',
'{"earthBranches":["巳","卯","丑","辰","寅","子"],"sixRelatives":["兄弟","官鬼","父母","兄弟","官鬼","子孙"],"fiveElements":["火","木","土","土","木","水"],"heavenlyStems":["己","辛","癸","庚","壬","甲"],"sixSpirits":["青龙","朱雀","勾陈","螣蛇","白虎","玄武"],"shiYing":[0,3]}',
'测试AI解析内容：噬嗑卦象征咬合、克服障碍。四爻兄弟爻发动，变为未济卦。在考试方面，噬嗑卦表示有一定难度，但通过努力可以克服。四爻动化官鬼，官鬼代表考试、文书，表示考试内容有难度。兄弟爻动表示需要多花时间复习，不能依赖运气。建议认真准备，重点复习难点，保持良好心态。只要付出努力，通过考试的可能性很大。',
'2024-01-16 12:30:00');

-- 查看插入的测试数据
SELECT id, timestamp, question, method,
  SUBSTRING(ai_analysis, 1, 50) as analysis_preview,
  created_at
FROM divination_records
ORDER BY created_at;

-- 统计信息
SELECT
  '八卦基础数据' as data_type, COUNT(*) as count FROM trigrams
UNION ALL
SELECT '六十四卦数据', COUNT(*) FROM gua_data
UNION ALL
SELECT '测试卦象记录', COUNT(*) FROM divination_records;
