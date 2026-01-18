/**
 * 八字批命功能 - TypeScript 类型定义
 *
 * 本文件定义了八字相关的所有数据结构和类型
 */

// ==================== 基础类型 ====================

/**
 * 性别
 */
export type Gender = '男' | '女';

/**
 * 五行
 */
export type WuXing = '木' | '火' | '土' | '金' | '水';

/**
 * 阴阳
 */
export type YinYang = '阴' | '阳';

/**
 * 十神
 */
export type ShiShen =
  | '比肩'
  | '劫财'
  | '食神'
  | '伤官'
  | '偏财'
  | '正财'
  | '偏官'
  | '正官'
  | '偏印'
  | '正印';

/**
 * 地支关系类型
 */
export type RelationType =
  | 'liuHe'      // 六合
  | 'sanHe'      // 三合
  | 'liuChong'   // 六冲
  | 'sanXing'    // 三刑
  | 'xiangHai';  // 相害

/**
 * 神煞类别
 */
export type ShenShaCategory = '吉神' | '凶神' | '特殊';

/**
 * 神煞影响力
 */
export type ShenShaInfluence = '强' | '中' | '弱';

// ==================== 柱（Pillar）相关 ====================

/**
 * 单柱信息（年/月/日/时柱）
 */
export interface Pillar {
  gan: string;              // 天干（如"甲"）
  zhi: string;              // 地支（如"子"）
  ganZhi: string;           // 干支组合（如"甲子"）
  ganWuXing: WuXing;        // 天干五行
  zhiWuXing: WuXing;        // 地支五行
  ganYinYang: YinYang;      // 天干阴阳
  zhiYinYang: YinYang;      // 地支阴阳
  cangGan: string[];        // 地支藏干（地支中包含的天干）
  naYin?: string;           // 纳音五行（可选，如"海中金"）
}

/**
 * 柱位置（用于标识哪一柱）
 */
export type PillarPosition = 'year' | 'month' | 'day' | 'hour';

// ==================== 八字主体 ====================

/**
 * 八字（四柱）完整信息
 */
export interface BaZi {
  year: Pillar;             // 年柱
  month: Pillar;            // 月柱
  day: Pillar;              // 日柱
  hour: Pillar;             // 时柱
  riGan: string;            // 日干（最核心，代表命主本人）
  lunarDate?: any;          // 农历日期对象（lunar-javascript）
  solarDate?: any;          // 阳历日期对象（lunar-javascript）
}

/**
 * 十神分析结果
 */
export interface ShiShenAnalysis {
  year: {
    gan: ShiShen;           // 年干十神
    zhi: ShiShen;           // 年支十神（通过藏干主气）
  };
  month: {
    gan: ShiShen;
    zhi: ShiShen;
  };
  hour: {
    gan: ShiShen;
    zhi: ShiShen;
  };
  // 注意：日柱不需要十神，因为日干就是"我"
}

/**
 * 五行统计
 */
export interface WuXingCount {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
}

/**
 * 五行分析结果
 */
export interface WuXingAnalysis {
  count: WuXingCount;       // 五行数量统计
  strongest: WuXing;        // 最旺五行
  weakest: WuXing;          // 最弱五行
  yongShen?: WuXing;        // 用神（喜用神，简化版推算）
  jiShen?: WuXing;          // 忌神（忌讳之神）
  balance: number;          // 平衡度（0-100，100最平衡）
}

/**
 * 地支关系（合冲刑害）
 */
export interface DiZhiRelation {
  type: RelationType;       // 关系类型
  positions: PillarPosition[];  // 涉及的柱位置
  zhis: string[];           // 涉及的地支
  description: string;      // 关系描述
}

/**
 * 地支关系集合
 */
export interface RelationsAnalysis {
  liuHe: DiZhiRelation[];   // 六合关系列表
  sanHe: DiZhiRelation[];   // 三合关系列表
  liuChong: DiZhiRelation[]; // 六冲关系列表
  sanXing: DiZhiRelation[]; // 三刑关系列表
  xiangHai: DiZhiRelation[]; // 相害关系列表
}

// ==================== 神煞相关 ====================

/**
 * 单个神煞信息
 */
export interface ShenSha {
  name: string;                // 神煞名称
  category: ShenShaCategory;   // 神煞类别（吉神/凶神/特殊）
  position: PillarPosition;    // 所在柱位（年/月/日/时）
  zhi: string;                 // 所在地支
  description: string;         // 简短说明
  influence: ShenShaInfluence; // 影响力（强/中/弱）
}

/**
 * 神煞分析结果
 */
export interface ShenShaAnalysis {
  jiShen: ShenSha[];          // 吉神列表
  xiongShen: ShenSha[];       // 凶神列表
  teShu: ShenSha[];           // 特殊神煞列表
  summary: {
    jiShenCount: number;      // 吉神数量
    xiongShenCount: number;   // 凶神数量
    balance: '吉多' | '凶多' | '平衡';  // 吉凶平衡度
  };
}

// ==================== 完整装饰数据 ====================

/**
 * 八字完整装饰数据（包含所有分析结果）
 */
export interface BaZiDecoration {
  bazi: BaZi;                       // 基础八字
  shiShen: ShiShenAnalysis;         // 十神分析
  wuXing: WuXingAnalysis;           // 五行分析
  relations: RelationsAnalysis;     // 地支关系分析
  shenSha: ShenShaAnalysis;         // 神煞分析
  kongWang: [string, string];       // 空亡（旬空）两个地支
}

// ==================== 大运相关 ====================

/**
 * 单步大运信息
 */
export interface DaYunStep {
  ganZhi: string;           // 大运干支（如"庚寅"）
  gan: string;              // 天干
  zhi: string;              // 地支
  startAge: number;         // 起始年龄
  endAge: number;           // 结束年龄
  wuXing: {
    gan: WuXing;            // 天干五行
    zhi: WuXing;            // 地支五行
  };
  shiShen?: {
    gan: ShiShen;           // 天干十神
    zhi: ShiShen;           // 地支十神
  };
  naYin?: string;           // 纳音
}

/**
 * 大运完整信息
 */
export interface DaYunResult {
  qiyunAge: number;         // 起运年龄
  shunPai: boolean;         // 是否顺排（true=顺排，false=逆排）
  steps: DaYunStep[];       // 大运列表（通常8步，80年）
}

// ==================== 数据库记录相关 ====================

/**
 * 八字记录（数据库存储格式）
 */
export interface BaziRecord {
  // 基础标识
  id: string;
  user_id: string;
  timestamp: number;

  // 基本信息
  name?: string;
  gender: Gender;
  birth_datetime: number;
  birth_location?: string;
  use_true_solar_time: boolean;

  // 四柱简写
  year_pillar: string;
  month_pillar: string;
  day_pillar: string;
  hour_pillar: string;

  // 八字完整数据（JSON字符串）
  bazi_data: string;

  // 大运数据（JSON字符串）
  dayun_data?: string;
  qiyun_age?: number;
  shun_pai?: boolean;

  // AI分析
  ai_analysis?: string;
  ai_model?: string;
  ai_analyzed_at?: number;

  // 验证反馈
  is_verified: boolean;
  actual_feedback?: string;
  verify_time?: number;
  accuracy_rating?: number;
  user_notes?: string;

  // 时间戳
  created_at: string;
  updated_at: string;
}

/**
 * 八字记录（解析后，供前端使用）
 */
export interface BaziRecordParsed extends Omit<BaziRecord, 'bazi_data' | 'dayun_data'> {
  baziData: BaZiDecoration;     // 解析后的八字数据
  dayunData?: DaYunStep[];      // 解析后的大运数据
}

/**
 * 创建八字的请求参数
 */
export interface CreateBaziRequest {
  name?: string;
  gender: Gender;
  birthDatetime: number;        // 时间戳
  birthLocation?: string;
  useTrueSolarTime?: boolean;
}

/**
 * 更新AI分析的请求参数
 */
export interface UpdateAiAnalysisRequest {
  aiAnalysis: string;
  aiModel: string;
}

/**
 * 验证反馈的请求参数
 */
export interface UpdateVerificationRequest {
  actualFeedback: string;
  accuracyRating: number;       // 1-5
  userNotes?: string;
}

// ==================== 工具函数返回类型 ====================

/**
 * 计算四柱的返回结果
 */
export interface CalculatePillarsResult {
  bazi: BaZi;
  decoration: BaZiDecoration;
}

/**
 * 节气信息
 */
export interface JieQiInfo {
  name: string;                 // 节气名称
  datetime: number;             // 时间戳
  type: '节' | '气';
  solarTermIndex: number;       // 序号（0-23）
}

// ==================== 导出所有类型 ====================

export type {
  // 基础类型已在上面定义
};
