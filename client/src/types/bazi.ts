/**
 * 八字批命功能 - 前端类型定义
 *
 * 与后端类型保持一致：server/src/types/bazi.ts
 */

// ==================== 基础类型 ====================

/** 性别类型 */
export type Gender = '男' | '女';

/** 阴阳类型 */
export type YinYang = '阳' | '阴';

/** 五行类型 */
export type WuXing = '木' | '火' | '土' | '金' | '水';

/** 十神类型 */
export type ShiShen =
  | '比肩' | '劫财'
  | '食神' | '伤官'
  | '偏财' | '正财'
  | '七杀' | '正官'
  | '偏印' | '正印';

// ==================== 四柱结构 ====================

/** 单柱信息 */
export interface Pillar {
  gan: string;              // 天干，如"甲"
  zhi: string;              // 地支，如"子"
  ganZhi: string;           // 干支组合，如"甲子"
  ganWuXing: WuXing;        // 天干五行
  zhiWuXing: WuXing;        // 地支五行
  ganYinYang: YinYang;      // 天干阴阳
  zhiYinYang: YinYang;      // 地支阴阳
  cangGan: string[];        // 地支藏干
  naYin?: string;           // 纳音五行（可选）
}

/** 四柱八字 */
export interface BaZi {
  year: Pillar;             // 年柱
  month: Pillar;            // 月柱
  day: Pillar;              // 日柱（最重要）
  hour: Pillar;             // 时柱
  riGan: string;            // 日干（命主本人）
  lunarDate?: any;          // 农历日期信息
  solarDate?: any;          // 公历日期信息
}

// ==================== 十神分析 ====================

/** 单柱的十神信息 */
export interface PillarShiShen {
  gan: ShiShen;             // 天干十神
  zhi: ShiShen;             // 地支十神（主气）
}

/** 完整的十神分析 */
export interface ShiShenAnalysis {
  year: PillarShiShen;      // 年柱十神
  month: PillarShiShen;     // 月柱十神
  hour: PillarShiShen;      // 时柱十神
  // 注：日柱本身不计算十神（日干为自己）
}

// ==================== 五行分析 ====================

/** 五行统计 */
export interface WuXingCount {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
}

/** 五行分析结果 */
export interface WuXingAnalysis {
  count: WuXingCount;       // 五行个数统计
  strongest: WuXing;        // 最旺五行
  weakest: WuXing;          // 最弱五行
  yongShen: string;         // 用神（建议）
  jiShen: string;           // 忌神（建议）
  balance: number;          // 五行平衡度（0-100）
}

// ==================== 地支关系 ====================

/** 地支关系信息 */
export interface DiZhiRelation {
  type: '六合' | '三合' | '六冲' | '三刑' | '相害';
  positions: string[];      // 涉及的柱位，如["年", "月"]
  branches: string[];       // 涉及的地支，如["子", "丑"]
  description: string;      // 关系描述
}

/** 地支关系分析 */
export interface DiZhiRelations {
  liuHe: DiZhiRelation[];   // 六合关系
  sanHe: DiZhiRelation[];   // 三合局
  liuChong: DiZhiRelation[]; // 六冲关系
  sanXing: DiZhiRelation[]; // 三刑关系
  xiangHai: DiZhiRelation[]; // 相害关系
}

// ==================== 大运信息 ====================

/** 单步大运 */
export interface DaYunStep {
  gan: string;              // 天干
  zhi: string;              // 地支
  ganZhi: string;           // 干支组合
  wuXing: {
    gan: WuXing;            // 天干五行
    zhi: WuXing;            // 地支五行
  };
  shiShen?: {
    gan: ShiShen;           // 天干十神
    zhi: ShiShen;           // 地支十神
  };
  startAge: number;         // 起始年龄
  endAge: number;           // 结束年龄
  cangGan: string[];        // 地支藏干
}

/** 大运排盘结果 */
export interface DaYunResult {
  steps: DaYunStep[];       // 大运步骤（通常8步，80年）
  qiyunAge: number;         // 起运年龄
  shunPai: boolean;         // 是否顺排（true顺false逆）
}

// ==================== 完整装饰信息 ====================

/** 完整的八字分析结果 */
export interface BaZiDecoration {
  bazi: BaZi;                       // 四柱八字
  shiShen: ShiShenAnalysis;         // 十神分析
  wuXing: WuXingAnalysis;           // 五行分析
  relations: DiZhiRelations;        // 地支关系
  monthBranch: string;              // 月建地支
  dayGanZhi: string;                // 日干支
  kongWang: [string, string];       // 空亡地支
}

// ==================== 八字记录 ====================

/** 创建八字请求 */
export interface CreateBaziRequest {
  name?: string;                    // 姓名（可选）
  gender: Gender;                   // 性别
  birthDatetime: number;            // 出生时间戳（毫秒）
  birthLocation?: string;           // 出生地（可选）
  useTrueSolarTime?: boolean;       // 是否使用真太阳时（可选，默认false）
  question?: string;                // 问题或备注（可选）
}

/** 八字记录 */
export interface BaziRecord {
  id: string;                       // 记录ID
  userId: string;                   // 用户ID
  timestamp: number;                // 创建时间戳
  name?: string;                    // 姓名
  gender: Gender;                   // 性别
  birthDatetime: number;            // 出生时间戳
  birthLocation?: string;           // 出生地
  useTrueSolarTime: boolean;        // 是否使用真太阳时
  question?: string;                // 问题或备注

  // 四柱简化显示
  yearPillar: string;               // 年柱干支
  monthPillar: string;              // 月柱干支
  dayPillar: string;                // 日柱干支
  hourPillar: string;               // 时柱干支

  // 完整数据（JSON）
  baziData: BaZiDecoration;         // 完整八字分析
  dayunData: DaYunResult;           // 大运数据
  qiyunAge: number;                 // 起运年龄

  // AI分析
  aiAnalysis?: string;              // AI批注内容（Markdown）
  aiModel?: string;                 // AI模型名称
  aiAnalyzedAt?: number;            // AI分析时间戳

  // 验证反馈
  isVerified?: boolean;             // 是否已验证
  actualFeedback?: string;          // 实际反馈
  accuracyRating?: number;          // 准确度评分（1-5星）
  verificationDate?: number;        // 验证日期
}

/** 获取记录列表的请求参数 */
export interface GetRecordsRequest {
  search?: string;                  // 搜索关键词（姓名）
  limit?: number;                   // 每页数量
  offset?: number;                  // 偏移量
}

/** 获取记录列表的响应 */
export interface GetRecordsResponse {
  records: BaziRecord[];            // 记录列表
  total: number;                    // 总数
  limit: number;                    // 每页数量
  offset: number;                   // 偏移量
}

// ==================== AI分析请求 ====================

/** AI流式分析请求 */
export interface AiAnalyzeRequest {
  recordId?: string;                // 记录ID（可选，如果提供则保存分析结果）
  baziData: BaZiDecoration;         // 八字数据
  dayunData: DaYunStep[];           // 大运数据（前5步即可）
  name?: string;                    // 姓名（用于Prompt）
  gender?: Gender;                  // 性别（用于Prompt）
  question?: string;                // 特别关注的问题（可选）
}

/** SSE流式响应的数据块 */
export interface SSEChunk {
  content?: string;                 // 文本内容
  done?: boolean;                   // 是否完成
  error?: string;                   // 错误信息
}

// ==================== API响应类型 ====================

/** 标准API响应 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/** 创建八字的响应数据 */
export interface CreateBaziResponse {
  id: string;                       // 记录ID
  bazi: BaZi;                       // 四柱八字
  shiShen: ShiShenAnalysis;         // 十神分析
  wuXing: WuXingAnalysis;           // 五行分析
  relations: DiZhiRelations;        // 地支关系
  dayun: DaYunResult;               // 大运数据
  qiyunAge: number;                 // 起运年龄
}

/** 仅计算四柱的响应数据 */
export interface CalculatePillarsResponse {
  bazi: BaZi;                       // 四柱八字
  shiShen: ShiShenAnalysis;         // 十神分析
  wuXing: WuXingAnalysis;           // 五行分析
  relations: DiZhiRelations;        // 地支关系
  dayun: DaYunResult;               // 大运数据
  qiyunAge: number;                 // 起运年龄
}

// ==================== 辅助类型 ====================

/** 五行颜色映射（用于UI展示） */
export const WUXING_COLORS: Record<WuXing, string> = {
  '木': '#10b981',  // 绿色
  '火': '#ef4444',  // 红色
  '土': '#f59e0b',  // 黄色
  '金': '#fbbf24',  // 金色
  '水': '#3b82f6',  // 蓝色
};

/** 十神颜色映射（用于UI展示） */
export const SHISHEN_COLORS: Record<ShiShen, string> = {
  '比肩': '#8b5cf6',
  '劫财': '#a855f7',
  '食神': '#10b981',
  '伤官': '#14b8a6',
  '偏财': '#f59e0b',
  '正财': '#eab308',
  '七杀': '#ef4444',
  '正官': '#dc2626',
  '偏印': '#6366f1',
  '正印': '#4f46e5',
};
