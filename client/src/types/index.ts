// 起卦方式
export type DivinationMethod = 'time' | 'number' | 'manual' | 'input';

// 性别类型
export type Gender = '男' | '女' | '未知';

// 六爻单爻类型
export type YaoType = 0 | 1; // 0阴 1阳

// 八字信息
export interface BaZi {
  year?: string;  // 年柱，如"辛未"
  month?: string; // 月柱，如"庚寅"
  day?: string;   // 日柱，如"己亥"
  hour?: string;  // 时柱，如"戊辰"
}

// 卦象结构
export interface Gua {
  name: string;
  lines: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType];
  changes: [boolean, boolean, boolean, boolean, boolean, boolean];
  trigrams: {
    upper: string; // 上卦
    lower: string; // 下卦
  };
}

// 爻位旺衰状态
export interface YaoState {
  position: number;             // 爻位 0-5
  isProspered: boolean;         // 得月建生旺
  isDayHelped: boolean;         // 得日辰帮扶
  isKongWang: boolean;          // 是否空亡
  state: '旺' | '相' | '休' | '囚' | '死';  // 五行旺衰
}

// 化爻分析（动爻变化分析）
export interface ChangeAnalysis {
  position: number;              // 动爻位置 0-5
  originalBranch: string;        // 原爻地支
  changedBranch: string;         // 变爻地支
  originalElement: string;       // 原爻五行
  changedElement: string;        // 变爻五行
  changeType: '化进' | '化退' | '化回头生' | '化回头克' | '化回头冲' | '化合' | '化泄' | '无特殊';
  description: string;           // 变化描述
  isGood: boolean;              // 是否有利
}

// 爻位关系（六合、六冲、三合）
export interface YaoRelation {
  type: '六合' | '六冲' | '三合';
  positions: number[];           // 涉及的爻位
  branches: string[];            // 涉及的地支
  description: string;           // 关系描述
  effect: string;                // 作用和影响
  isGood: boolean;              // 是否有利
}

// 伏神信息
export interface FuShen {
  sixRelative: string;           // 伏神的六亲
  fuPosition: number;            // 伏神所伏的爻位（0-5）
  fuBranch: string;              // 伏神的地支
  fuElement: string;             // 伏神的五行
  feiShen: string;               // 飞神的六亲
  feiBranch: string;             // 飞神的地支
  feiElement: string;            // 飞神的五行
  relation: '飞来生伏' | '飞来克伏' | '伏去生飞' | '伏去克飞' | '比和' | '无关';
  description: string;           // 伏神描述
  canComeOut: boolean;           // 是否容易出现
}

// 应期信息（预测事情应验的时间）
export interface YingQi {
  type: '近应' | '中应' | '远应';    // 应期类型
  period: string;                     // 时间描述
  basis: string[];                    // 推断依据
  confidence: '高' | '中' | '低';     // 可信度
  specificBranches: string[];         // 具体涉及的地支
  description: string;                // 详细说明
}

// 装卦信息
export interface GuaDecoration {
  earthBranches: string[]; // 地支
  sixRelatives: string[]; // 六亲
  fiveElements: string[]; // 五行
  heavenlyStems: string[]; // 天干（纳甲）
  sixSpirits: string[]; // 六神
  shiYing: [number, number]; // 世应位置 [世, 应]
  // 月建、日辰、空亡
  monthBranch: string;          // 月建地支
  monthConstruction: string;    // 月建干支
  dayGanZhi: string;            // 日辰干支
  kongWang: [string, string];   // 空亡的两个地支
  kongWangYao: number[];        // 落空亡的爻位（0-5）
  // 爻位旺衰状态
  yaoStates: YaoState[];
  // 化爻分析
  changeAnalyses: ChangeAnalysis[];
  // 爻位关系
  yaoRelations: YaoRelation[];
  // 伏神
  fuShens: FuShen[];
  // 应期推断
  yingQi: YingQi[];
  // 卦辞和爻辞（从gua_data表加载）
  guaCi?: string;               // 卦辞（原文+白话）
  yaoCi?: string[];             // 爻辞数组（6个，原文+白话）
}

// 完整卦象记录
export interface DivinationRecord {
  id: string;
  timestamp: number;
  question: string;
  gender?: Gender;        // 命主性别
  bazi?: BaZi;           // 命主八字
  method: DivinationMethod;
  benGua: Gua; // 本卦
  bianGua: Gua | null; // 变卦
  decoration: GuaDecoration;
  aiAnalysis?: string;
  // 验证反馈相关
  isVerified?: boolean;
  actualResult?: string;
  verifyTime?: number;
  accuracyRating?: number;  // 1-5星
  userNotes?: string;
}

// 八卦基础数据
export interface Trigram {
  name: string;
  symbol: string;
  nature: string;
  element: string;
}

// 六十四卦数据
export interface GuaData {
  number: number;
  name: string;
  upperTrigram: string;
  lowerTrigram: string;
  guaCi: string; // 卦辞
  yaoCi: string[]; // 爻辞
}
