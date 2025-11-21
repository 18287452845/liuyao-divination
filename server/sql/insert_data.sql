-- 六爻排盘系统 基础数据初始化脚本
-- 使用数据库
USE liuyao_db;

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ====================================
-- 插入八卦基础数据
-- ====================================
INSERT INTO trigrams (name, symbol, nature, element, number) VALUES
('乾', '☰', '天', '金', 1),
('兑', '☱', '泽', '金', 2),
('离', '☲', '火', '火', 3),
('震', '☳', '雷', '木', 4),
('巽', '☴', '风', '木', 5),
('坎', '☵', '水', '水', 6),
('艮', '☶', '山', '土', 7),
('坤', '☷', '地', '土', 8);

-- ====================================
-- 插入六十四卦数据
-- ====================================

-- 1. 乾为天
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(1, '乾为天', '乾', '乾', '元亨利贞',
'["初九:潜龙勿用", "九二:见龙在田,利见大人", "九三:君子终日乾乾,夕惕若厉,无咎", "九四:或跃在渊,无咎", "九五:飞龙在天,利见大人", "上九:亢龙有悔"]');

-- 2. 坤为地
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(2, '坤为地', '坤', '坤', '元亨,利牝马之贞',
'["初六:履霜,坚冰至", "六二:直方大,不习无不利", "六三:含章可贞,或从王事,无成有终", "六四:括囊,无咎无誉", "六五:黄裳,元吉", "上六:龙战于野,其血玄黄"]');

-- 3. 水雷屯
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(3, '水雷屯', '坎', '震', '元亨利贞,勿用有攸往,利建侯',
'["初九:磐桓,利居贞,利建侯", "六二:屯如邅如,乘马班如,匪寇婚媾,女子贞不字,十年乃字", "六三:即鹿无虞,惟入于林中,君子几不如舍,往吝", "六四:乘马班如,求婚媾,往吉,无不利", "九五:屯其膏,小贞吉,大贞凶", "上六:乘马班如,泣血涟如"]');

-- 4. 山水蒙
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(4, '山水蒙', '艮', '坎', '亨,匪我求童蒙,童蒙求我',
'["初六:发蒙,利用刑人,用说桎梏,以往吝", "九二:包蒙吉,纳妇吉,子克家", "六三:勿用取女,见金夫,不有躬,无攸利", "六四:困蒙,吝", "六五:童蒙,吉", "上九:击蒙,不利为寇,利御寇"]');

-- 5. 水天需
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(5, '水天需', '坎', '乾', '有孚,光亨,贞吉,利涉大川',
'["初九:需于郊,利用恒,无咎", "九二:需于沙,小有言,终吉", "九三:需于泥,致寇至", "六四:需于血,出自穴", "九五:需于酒食,贞吉", "上六:入于穴,有不速之客三人来,敬之终吉"]');

-- 6. 天水讼
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(6, '天水讼', '乾', '坎', '有孚,窒惕,中吉,终凶,利见大人,不利涉大川',
'["初六:不永所事,小有言,终吉", "九二:不克讼,归而逋其邑人三百户,无眚", "六三:食旧德,贞厉,终吉,或从王事,无成", "九四:不克讼,复即命渝,安贞吉", "九五:讼,元吉", "上九:或锡之鞶带,终朝三褫之"]');

-- 7. 地水师
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(7, '地水师', '坤', '坎', '贞,丈人吉,无咎',
'["初六:师出以律,否臧凶", "九二:在师中吉,无咎,王三锡命", "六三:师或舆尸,凶", "六四:师左次,无咎", "六五:田有禽,利执言,无咎,长子帅师,弟子舆尸,贞凶", "上六:大君有命,开国承家,小人勿用"]');

-- 8. 水地比
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(8, '水地比', '坎', '坤', '吉,原筮元永贞,无咎',
'["初六:有孚比之,无咎,有孚盈缶,终来有它吉", "六二:比之自内,贞吉", "六三:比之匪人", "六四:外比之,贞吉", "九五:显比,王用三驱,失前禽,邑人不诫,吉", "上六:比之无首,凶"]');

-- 9. 风天小畜
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(9, '风天小畜', '巽', '乾', '亨,密云不雨,自我西郊',
'["初九:复自道,何其咎,吉", "九二:牵复,吉", "九三:舆说辐,夫妻反目", "六四:有孚,血去惕出,无咎", "九五:有孚挛如,富以其邻", "上九:既雨既处,尚德载,妇贞厉,月几望,君子征凶"]');

-- 10. 天泽履
INSERT INTO gua_data (number, name, upper_trigram, lower_trigram, gua_ci, yao_ci) VALUES
(10, '天泽履', '乾', '兑', '履虎尾,不咥人,亨',
'["初九:素履,往无咎", "九二:履道坦坦,幽人贞吉", "六三:眇能视,跛能履,履虎尾,咥人,凶,武人为于大君", "九四:履虎尾,愬愬终吉", "九五:夬履,贞厉", "上九:视履考祥,其旋元吉"]');

-- 注意:这里只包含了前10卦作为示例
-- 实际应用中需要补充完整的64卦数据
-- 可以继续添加第11卦到第64卦的数据...

-- ====================================
-- 数据验证查询
-- ====================================
-- SELECT COUNT(*) as trigrams_count FROM trigrams;
-- SELECT COUNT(*) as gua_data_count FROM gua_data;
-- SELECT * FROM trigrams ORDER BY number;
-- SELECT number, name, upper_trigram, lower_trigram FROM gua_data ORDER BY number;
