import { Lunar, Solar } from 'lunar-javascript';
import {
  TRIGRAMS,
  GUA_NAMES,
  NAJIA,
  EARTH_BRANCHES,
  FIVE_ELEMENTS,
  SIX_RELATIVES_MAP,
  SIX_SPIRITS,
  TEN_STEMS,
  TWELVE_BRANCHES,
  KONG_WANG_MAP,
  FIVE_ELEMENTS_RELATION,
  FIVE_ELEMENTS_SEASON,
  LIU_HE,
  LIU_CHONG,
  TWELVE_GROWTH,
  SAN_HE,
  BRANCH_SAN_HE
} from './constants';
import { getGuaPalaceInfo, getShiYingPositions, getGuaPalace } from './bagong';

export type YaoType = 0 | 1;

export interface Gua {
  name: string;
  lines: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType];
  changes: [boolean, boolean, boolean, boolean, boolean, boolean];
  trigrams: {
    upper: string;
    lower: string;
  };
}

export interface GuaDecoration {
  earthBranches: string[];
  sixRelatives: string[];
  fiveElements: string[];
  heavenlyStems: string[];
  sixSpirits: string[];
  shiYing: [number, number];
  // 月建、日辰、空亡
  monthBranch: string;          // 月建地支，如"寅"
  monthConstruction: string;    // 月建干支，如"壬寅"
  dayGanZhi: string;            // 日辰干支，如"甲子"
  kongWang: [string, string];   // 空亡的两个地支，如["戌", "亥"]
  kongWangYao: number[];        // 落空亡的爻位（0-5）
  // 爻位旺衰状态
  yaoStates: YaoState[];
  // 化爻分析
  changeAnalyses: ChangeAnalysis[];  // 动爻的化爻分析
  // 爻位关系
  yaoRelations: YaoRelation[];       // 爻位之间的六合六冲三合关系
  // 伏神
  fuShens: FuShen[];                 // 伏神列表（不上卦的六亲）
  // 应期推断
  yingQi: YingQi[];                  // 应期推断列表（可能有多个应期）
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
  originalBranch: string;        // 原爻地支，如"子"
  changedBranch: string;         // 变爻地支，如"丑"
  originalElement: string;       // 原爻五行
  changedElement: string;        // 变爻五行
  changeType: '化进' | '化退' | '化回头生' | '化回头克' | '化回头冲' | '化合' | '化泄' | '无特殊';
  description: string;           // 变化描述
  isGood: boolean;              // 是否有利（化进、化回头生为吉）
}

// 爻位关系（六合、六冲、三合）
export interface YaoRelation {
  type: '六合' | '六冲' | '三合';
  positions: number[];           // 涉及的爻位（六合六冲为2个，三合为3个）
  branches: string[];            // 涉及的地支
  description: string;           // 关系描述
  effect: string;                // 作用和影响
  isGood: boolean;              // 是否有利
}

// 伏神信息
export interface FuShen {
  sixRelative: string;           // 伏神的六亲，如"妻财"
  fuPosition: number;            // 伏神所伏的爻位（0-5）
  fuBranch: string;              // 伏神的地支
  fuElement: string;             // 伏神的五行
  feiShen: string;               // 飞神（伏神所伏之爻）的六亲
  feiBranch: string;             // 飞神的地支
  feiElement: string;            // 飞神的五行
  relation: '飞来生伏' | '飞来克伏' | '伏去生飞' | '伏去克飞' | '比和' | '无关';
  description: string;           // 伏神描述
  canComeOut: boolean;           // 是否容易出现（飞神受制或伏神得生）
}

// 应期信息（预测事情应验的时间）
export interface YingQi {
  type: '近应' | '中应' | '远应';    // 应期类型
  period: string;                     // 时间描述，如"本月内"、"寅月"、"子日"
  basis: string[];                    // 推断依据
  confidence: '高' | '中' | '低';     // 可信度
  specificBranches: string[];         // 具体涉及的地支
  description: string;                // 详细说明
}

// 时间起卦法
export function divinationByTime(date: Date): Gua {
  const lunar = Lunar.fromDate(date);

  // 农历年月日时
  const year = lunar.getYear();
  const month = lunar.getMonth();
  const day = lunar.getDay();
  const hour = Math.floor(date.getHours() / 2) + 1; // 转换为时辰

  // 上卦 = (年 + 月 + 日) % 8
  const upperNum = (year + month + day) % 8;
  const upperIndex = upperNum === 0 ? 7 : upperNum - 1;

  // 下卦 = (年 + 月 + 日 + 时) % 8
  const lowerNum = (year + month + day + hour) % 8;
  const lowerIndex = lowerNum === 0 ? 7 : lowerNum - 1;

  // 动爻 = (年 + 月 + 日 + 时) % 6
  const changeYao = (year + month + day + hour) % 6;
  const changeIndex = changeYao === 0 ? 5 : changeYao - 1;

  return createGua(upperIndex, lowerIndex, changeIndex);
}

// 数字起卦法
export function divinationByNumbers(num1: number, num2: number, num3: number): Gua {
  const upperIndex = (num1 % 8 === 0 ? 8 : num1 % 8) - 1;
  const lowerIndex = (num2 % 8 === 0 ? 8 : num2 % 8) - 1;
  const changeIndex = (num3 % 6 === 0 ? 6 : num3 % 6) - 1;

  return createGua(upperIndex, lowerIndex, changeIndex);
}

// 手动摇卦法
export function divinationByManual(yaoResults: number[]): Gua {
  // yaoResults 是6个数字，每个数字是摇卦结果（6,7,8,9）
  // 6: 老阴（变）, 7: 少阳, 8: 少阴, 9: 老阳（变）
  const lines: YaoType[] = [];
  const changes: boolean[] = [];

  yaoResults.forEach(result => {
    if (result === 6) {
      lines.push(0); // 阴爻
      changes.push(true); // 动爻
    } else if (result === 7) {
      lines.push(1); // 阳爻
      changes.push(false);
    } else if (result === 8) {
      lines.push(0); // 阴爻
      changes.push(false);
    } else if (result === 9) {
      lines.push(1); // 阳爻
      changes.push(true); // 动爻
    }
  });

  const upperLines = lines.slice(3, 6);
  const lowerLines = lines.slice(0, 3);

  const upperTrigram = findTrigramByLines(upperLines);
  const lowerTrigram = findTrigramByLines(lowerLines);

  return {
    name: getGuaName(upperTrigram, lowerTrigram),
    lines: lines as [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType],
    changes: changes as [boolean, boolean, boolean, boolean, boolean, boolean],
    trigrams: {
      upper: upperTrigram,
      lower: lowerTrigram
    }
  };
}

// 手动输入卦象法
export function divinationByInput(lines: number[], changes: boolean[]): Gua {
  // lines 是6个数字，每个数字是0（阴爻）或1（阳爻）
  // changes 是6个布尔值，表示每一爻是否为动爻
  const yaoLines = lines as [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType];
  const yaoChanges = changes as [boolean, boolean, boolean, boolean, boolean, boolean];

  const upperLines = yaoLines.slice(3, 6);
  const lowerLines = yaoLines.slice(0, 3);

  const upperTrigram = findTrigramByLines(upperLines);
  const lowerTrigram = findTrigramByLines(lowerLines);

  return {
    name: getGuaName(upperTrigram, lowerTrigram),
    lines: yaoLines,
    changes: yaoChanges,
    trigrams: {
      upper: upperTrigram,
      lower: lowerTrigram
    }
  };
}

// 创建卦象
function createGua(upperIndex: number, lowerIndex: number, changeIndex: number): Gua {
  const trigramNames = Object.keys(TRIGRAMS);
  const upperTrigram = trigramNames[upperIndex];
  const lowerTrigram = trigramNames[lowerIndex];

  const upperLines = TRIGRAMS[upperTrigram].lines;
  const lowerLines = TRIGRAMS[lowerTrigram].lines;

  const lines = [...lowerLines, ...upperLines] as [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType];
  const changes = [false, false, false, false, false, false] as [boolean, boolean, boolean, boolean, boolean, boolean];
  changes[changeIndex] = true;

  return {
    name: getGuaName(upperTrigram, lowerTrigram),
    lines,
    changes,
    trigrams: {
      upper: upperTrigram,
      lower: lowerTrigram
    }
  };
}

// 根据爻象查找卦名
function findTrigramByLines(lines: number[]): string {
  for (const [name, data] of Object.entries(TRIGRAMS)) {
    if (JSON.stringify(data.lines) === JSON.stringify(lines)) {
      return name;
    }
  }
  return '乾';
}

// 获取卦名
function getGuaName(upperTrigram: string, lowerTrigram: string): string {
  const trigramNames = Object.keys(TRIGRAMS);
  const upperIndex = trigramNames.indexOf(upperTrigram);
  const lowerIndex = trigramNames.indexOf(lowerTrigram);
  return GUA_NAMES[upperIndex][lowerIndex];
}

// 生成变卦
export function generateBianGua(benGua: Gua): Gua | null {
  const hasChanges = benGua.changes.some(c => c);
  if (!hasChanges) return null;

  const newLines = benGua.lines.map((line, index) => {
    if (benGua.changes[index]) {
      return line === 1 ? 0 : 1;
    }
    return line;
  }) as [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType];

  const upperLines = newLines.slice(3, 6);
  const lowerLines = newLines.slice(0, 3);

  const upperTrigram = findTrigramByLines(Array.from(upperLines));
  const lowerTrigram = findTrigramByLines(Array.from(lowerLines));

  return {
    name: getGuaName(upperTrigram, lowerTrigram),
    lines: newLines,
    changes: [false, false, false, false, false, false],
    trigrams: {
      upper: upperTrigram,
      lower: lowerTrigram
    }
  };
}

/**
 * 计算空亡
 * 根据日干支所在的旬来确定空亡
 * 根据《增删卜易》，六十甲子分为六旬，每旬10个干支，空亡最后两个地支
 * @param dayGanZhi 日干支，如"甲子"
 * @returns 空亡的两个地支，如["戌", "亥"]
 */
function calculateKongWang(dayGanZhi: string): [string, string] {
  const dayGan = dayGanZhi[0];
  const dayZhi = dayGanZhi[1];

  // 找到天干在十天干中的索引
  const ganIndex = TEN_STEMS.indexOf(dayGan);
  // 找到地支在十二地支中的索引
  const zhiIndex = TWELVE_BRANCHES.indexOf(dayZhi);

  if (ganIndex === -1 || zhiIndex === -1) {
    return ['戌', '亥'];  // 默认值
  }

  // 在六十甲子中找到对应的序号
  // 六十甲子的规律：天干和地支同步递增，形成循环
  // 使用中国剩余定理：找到满足 i % 10 === ganIndex 且 i % 12 === zhiIndex 的i
  let jiazi60Index = -1;
  for (let i = 0; i < 60; i++) {
    if ((i % 10) === ganIndex && (i % 12) === zhiIndex) {
      jiazi60Index = i;
      break;
    }
  }

  if (jiazi60Index === -1) {
    return ['戌', '亥'];  // 默认值
  }

  // 找到所在的旬（每旬10个干支）
  // 0-9:甲子旬, 10-19:甲戌旬, 20-29:甲申旬, 30-39:甲午旬, 40-49:甲辰旬, 50-59:甲寅旬
  const xunIndex = Math.floor(jiazi60Index / 10);

  // 计算旬首的地支索引
  const xunStartIndex = xunIndex * 10;
  const xunZhiIndex = xunStartIndex % 12;

  // 旬首干支
  const xunGan = '甲';
  const xunZhi = TWELVE_BRANCHES[xunZhiIndex];
  const xunShou = xunGan + xunZhi;

  // 查表获取空亡
  return KONG_WANG_MAP[xunShou] || ['戌', '亥'];
}

/**
 * 判断五行是否得月令生旺
 * @param element 五行
 * @param monthBranch 月建地支
 * @returns 是否得月令生旺（旺或相）
 */
function isProspered(element: string, monthBranch: string): boolean {
  const state = FIVE_ELEMENTS_SEASON[monthBranch]?.[element];
  return state === '旺' || state === '相';
}

/**
 * 判断五行是否得日辰帮扶
 * 帮扶指：日辰生我 或 日辰与我同五行
 * @param element 爻位五行
 * @param dayElement 日辰五行
 * @returns 是否得日辰帮扶
 */
function isDayHelped(element: string, dayElement: string): boolean {
  // 同五行
  if (element === dayElement) {
    return true;
  }

  // 日辰生我
  const dayGenerates = FIVE_ELEMENTS_RELATION.generates[dayElement as keyof typeof FIVE_ELEMENTS_RELATION.generates];
  return dayGenerates === element;
}

/**
 * 获取五行旺衰状态
 * @param element 五行
 * @param monthBranch 月建地支
 * @returns 旺衰状态
 */
function getFiveElementState(element: string, monthBranch: string): '旺' | '相' | '休' | '囚' | '死' {
  return FIVE_ELEMENTS_SEASON[monthBranch]?.[element] || '休';
}

/**
 * 检测爻位之间的六合、六冲、三合关系
 * @param earthBranches 六个爻位的地支
 * @param sixRelatives 六个爻位的六亲
 * @returns 爻位关系数组
 */
function detectYaoRelations(earthBranches: string[], sixRelatives: string[]): YaoRelation[] {
  const relations: YaoRelation[] = [];

  // 1. 检测六合关系
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      const branch1 = earthBranches[i];
      const branch2 = earthBranches[j];

      if (LIU_HE[branch1] === branch2) {
        const yaoName1 = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
        const yaoName2 = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][j];
        const relative1 = sixRelatives[i];
        const relative2 = sixRelatives[j];

        relations.push({
          type: '六合',
          positions: [i, j],
          branches: [branch1, branch2],
          description: `${yaoName1}${branch1}（${relative1}）与${yaoName2}${branch2}（${relative2}）六合`,
          effect: '主和合、缠绵、成就之象，两爻互相帮扶，吉',
          isGood: true
        });
      }
    }
  }

  // 2. 检测六冲关系
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      const branch1 = earthBranches[i];
      const branch2 = earthBranches[j];

      if (LIU_CHONG[branch1] === branch2) {
        const yaoName1 = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
        const yaoName2 = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][j];
        const relative1 = sixRelatives[i];
        const relative2 = sixRelatives[j];

        relations.push({
          type: '六冲',
          positions: [i, j],
          branches: [branch1, branch2],
          description: `${yaoName1}${branch1}（${relative1}）与${yaoName2}${branch2}（${relative2}）六冲`,
          effect: '主散、破、不稳、冲突之象，两爻相互冲克，凶',
          isGood: false
        });
      }
    }
  }

  // 3. 检测三合关系
  // 统计各地支出现的位置
  const branchPositions: { [key: string]: number[] } = {};
  for (let i = 0; i < 6; i++) {
    const branch = earthBranches[i];
    if (!branchPositions[branch]) {
      branchPositions[branch] = [];
    }
    branchPositions[branch].push(i);
  }

  // 检查每个三合局
  for (const [juName, juInfo] of Object.entries(SAN_HE)) {
    const { branches: juBranches, element } = juInfo;

    // 检查三个地支是否都存在
    const foundBranches: string[] = [];
    const foundPositions: number[] = [];

    for (const juBranch of juBranches) {
      if (branchPositions[juBranch] && branchPositions[juBranch].length > 0) {
        foundBranches.push(juBranch);
        foundPositions.push(branchPositions[juBranch][0]); // 取第一个位置
      }
    }

    // 三个地支都存在，成三合局
    if (foundBranches.length === 3) {
      const yaoNames = foundPositions.map(pos => ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][pos]);
      const relatives = foundPositions.map(pos => sixRelatives[pos]);

      const desc = foundPositions.map((pos, idx) =>
        `${yaoNames[idx]}${foundBranches[idx]}（${relatives[idx]}）`
      ).join('、');

      relations.push({
        type: '三合',
        positions: foundPositions,
        branches: foundBranches,
        description: `${desc}三合${element}局`,
        effect: `三合成局，化为${element}，三爻合力，力量强大，主成就、吉祥`,
        isGood: true
      });
    }
  }

  return relations;
}

/**
 * 检测伏神（不上卦的六亲）
 * @param guaName 卦名
 * @param sixRelatives 六个爻位的六亲
 * @param earthBranches 六个爻位的地支
 * @param fiveElements 六个爻位的五行
 * @param guaGongElement 卦宫五行
 * @returns 伏神列表
 */
function detectFuShens(
  guaName: string,
  sixRelatives: string[],
  earthBranches: string[],
  fiveElements: string[],
  guaGongElement: string
): FuShen[] {
  const fuShens: FuShen[] = [];

  // 统计卦中出现的六亲
  const presentRelatives = new Set(sixRelatives);

  // 所有可能的六亲
  const allRelatives = ['父母', '兄弟', '子孙', '妻财', '官鬼'];

  // 找出不上卦的六亲（伏神）
  const missingRelatives = allRelatives.filter(rel => !presentRelatives.has(rel));

  if (missingRelatives.length === 0) {
    return fuShens; // 所有六亲都上卦，无伏神
  }

  // 获取卦宫信息
  const palaceInfo = getGuaPalaceInfo(guaName);
  if (!palaceInfo) {
    return fuShens;
  }

  // 获取本宫八纯卦名称
  const palace = palaceInfo.palace; // 如"乾宫"
  const palaceTrigramName = palace.replace('宫', ''); // 如"乾"

  // 本宫八纯卦的六亲配置
  const palaceElement = TRIGRAMS[palaceTrigramName]?.element || guaGongElement;
  const palaceBranches = EARTH_BRANCHES[palaceTrigramName] || EARTH_BRANCHES['乾'];

  // 为本宫八纯卦装六亲
  const palaceFiveElements = palaceBranches.map(branch => FIVE_ELEMENTS[branch]);
  const palaceSixRelatives = palaceFiveElements.map(element => {
    return SIX_RELATIVES_MAP[palaceElement]?.[element] || '兄弟';
  });

  // 对于每个不上卦的六亲，找到其在本宫八纯卦中的位置
  for (const missingRel of missingRelatives) {
    // 在本宫八纯卦中找到该六亲的位置
    const fuPosition = palaceSixRelatives.indexOf(missingRel);

    if (fuPosition !== -1) {
      // 伏神信息
      const fuBranch = palaceBranches[fuPosition];
      const fuElement = FIVE_ELEMENTS[fuBranch];

      // 飞神信息（当前卦同位置的爻）
      const feiShen = sixRelatives[fuPosition];
      const feiBranch = earthBranches[fuPosition];
      const feiElement = fiveElements[fuPosition];

      // 分析飞伏关系
      let relation: FuShen['relation'] = '无关';
      let canComeOut = false;

      if (FIVE_ELEMENTS_RELATION.generates[feiElement as keyof typeof FIVE_ELEMENTS_RELATION.generates] === fuElement) {
        relation = '飞来生伏';
        canComeOut = true; // 飞来生伏，伏神得生，容易出现
      } else if (FIVE_ELEMENTS_RELATION.controls[feiElement as keyof typeof FIVE_ELEMENTS_RELATION.controls] === fuElement) {
        relation = '飞来克伏';
        canComeOut = false; // 飞来克伏，伏神受制，难以出现
      } else if (FIVE_ELEMENTS_RELATION.generates[fuElement as keyof typeof FIVE_ELEMENTS_RELATION.generates] === feiElement) {
        relation = '伏去生飞';
        canComeOut = false; // 伏去生飞，伏神泄气，难以出现
      } else if (FIVE_ELEMENTS_RELATION.controls[fuElement as keyof typeof FIVE_ELEMENTS_RELATION.controls] === feiElement) {
        relation = '伏去克飞';
        canComeOut = true; // 伏去克飞，飞神受制，伏神容易出现
      } else if (fuElement === feiElement) {
        relation = '比和';
        canComeOut = true; // 比和，伏神有力
      }

      const yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][fuPosition];

      fuShens.push({
        sixRelative: missingRel,
        fuPosition,
        fuBranch,
        fuElement,
        feiShen,
        feiBranch,
        feiElement,
        relation,
        description: `${missingRel}不上卦，伏于${yaoName}${feiBranch}${feiElement}（${feiShen}）之下，伏神为${fuBranch}${fuElement}`,
        canComeOut
      });
    }
  }

  return fuShens;
}

/**
 * 分析化爻（动爻变化）
 * 包括：化进、化退、化回头生、化回头克、化回头冲、化合等
 * @param position 爻位
 * @param originalBranch 原爻地支
 * @param changedBranch 变爻地支
 * @param originalElement 原爻五行
 * @param changedElement 变爻五行
 * @returns 化爻分析结果
 */
function analyzeChange(
  position: number,
  originalBranch: string,
  changedBranch: string,
  originalElement: string,
  changedElement: string
): ChangeAnalysis {
  let changeType: ChangeAnalysis['changeType'] = '无特殊';
  let description = '';
  let isGood = false;

  // 1. 判断化进化退
  const originalGrowth = TWELVE_GROWTH[originalElement]?.[originalBranch];
  const changedGrowth = TWELVE_GROWTH[originalElement]?.[changedBranch];

  if (originalGrowth && changedGrowth) {
    // 长生1 -> 帝旺5 为进
    // 帝旺5 -> 长生1 为退
    if (changedGrowth > originalGrowth && changedGrowth <= 5) {
      changeType = '化进';
      description = `${originalBranch}化${changedBranch}，由${getGrowthName(originalGrowth)}化为${getGrowthName(changedGrowth)}，为化进神，主事态向好发展`;
      isGood = true;
    } else if (changedGrowth < originalGrowth && originalGrowth <= 5) {
      changeType = '化退';
      description = `${originalBranch}化${changedBranch}，由${getGrowthName(originalGrowth)}化为${getGrowthName(changedGrowth)}，为化退神，主力量减弱`;
      isGood = false;
    }
  }

  // 2. 判断六合
  if (LIU_HE[originalBranch] === changedBranch) {
    changeType = '化合';
    description = `${originalBranch}化${changedBranch}，六合成化，主和合、缠绵难分`;
    isGood = true;
  }

  // 3. 判断六冲
  if (LIU_CHONG[originalBranch] === changedBranch) {
    changeType = '化回头冲';
    description = `${originalBranch}化${changedBranch}，变爻冲原爻（六冲），主散、破、不稳`;
    isGood = false;
  }

  // 4. 判断回头生克
  if (changeType === '无特殊' || changeType === '化进' || changeType === '化退') {
    // 变爻生原爻
    if (FIVE_ELEMENTS_RELATION.generates[changedElement as keyof typeof FIVE_ELEMENTS_RELATION.generates] === originalElement) {
      if (changeType === '无特殊') {
        changeType = '化回头生';
      }
      description = `${originalBranch}${originalElement}化${changedBranch}${changedElement}，变爻生原爻，锦上添花，得助有力`;
      isGood = true;
    }
    // 变爻克原爻
    else if (FIVE_ELEMENTS_RELATION.controls[changedElement as keyof typeof FIVE_ELEMENTS_RELATION.controls] === originalElement) {
      if (changeType === '无特殊') {
        changeType = '化回头克';
      }
      description = `${originalBranch}${originalElement}化${changedBranch}${changedElement}，变爻克原爻，事成反败，反受其害`;
      isGood = false;
    }
    // 原爻生变爻（化泄）
    else if (FIVE_ELEMENTS_RELATION.generates[originalElement as keyof typeof FIVE_ELEMENTS_RELATION.generates] === changedElement) {
      if (changeType === '无特殊') {
        changeType = '化泄';
      }
      description += description ? `；原爻生变爻，力量被泄` : `${originalBranch}${originalElement}化${changedBranch}${changedElement}，原爻生变爻，力量被泄`;
      if (isGood === false) {
        isGood = false;
      }
    }
  }

  // 如果没有特殊变化，给出默认描述
  if (!description) {
    description = `${originalBranch}${originalElement}化${changedBranch}${changedElement}，无特殊生克制化关系`;
  }

  return {
    position,
    originalBranch,
    changedBranch,
    originalElement,
    changedElement,
    changeType,
    description,
    isGood
  };
}

/**
 * 获取十二长生阶段名称
 */
function getGrowthName(stage: number): string {
  const names = ['', '长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  return names[stage] || '';
}

/**
 * 推断应期（事情应验的时间）
 * 根据《增删卜易》《卜筮正宗》的应期理论
 *
 * 主要依据：
 * 1. 动爻值日应期 - 动爻地支当值之日月
 * 2. 用神得生旺之时
 * 3. 空亡出空之期
 * 4. 合处逢冲、冲处逢合
 * 5. 入墓逢冲之时
 */
function calculateYingQi(
  gua: Gua,
  earthBranches: string[],
  changeAnalyses: ChangeAnalysis[],
  kongWangYao: number[],
  monthBranch: string,
  dayGanZhi: string
): YingQi[] {
  const yingQiList: YingQi[] = [];

  // 1. 动爻值日应期
  const movingYaoBranches: string[] = [];
  for (let i = 0; i < 6; i++) {
    if (gua.changes[i]) {
      movingYaoBranches.push(earthBranches[i]);
    }
  }

  if (movingYaoBranches.length > 0) {
    // 有动爻，以动爻值日为主要应期
    const uniqueBranches = Array.from(new Set(movingYaoBranches));

    yingQiList.push({
      type: '近应',
      period: `${uniqueBranches.join('、')}日或${uniqueBranches.join('、')}月`,
      basis: [
        '��爻值日应期',
        `动爻临${uniqueBranches.join('、')}，当这些地支当值之时应验`
      ],
      confidence: '高',
      specificBranches: uniqueBranches,
      description: `卦中${uniqueBranches.join('、')}爻发动，应验时间多在${uniqueBranches.join('或')}日、月。若近期有${uniqueBranches.join('或')}日，则近应；若当月无此日，则远应于${uniqueBranches.join('或')}月。`
    });
  }

  // 2. 空亡出空应期
  if (kongWangYao.length > 0) {
    const kongWangBranches = kongWangYao.map(pos => earthBranches[pos]);
    const uniqueKongWangBranches = Array.from(new Set(kongWangBranches));

    // 计算出空时间（下一旬）
    const dayZhi = dayGanZhi.substring(1); // 提取地支
    const zhiList = TWELVE_BRANCHES;
    const currentIndex = zhiList.indexOf(dayZhi);

    // 空亡爻出空后才能应验
    yingQiList.push({
      type: '中应',
      period: '待出空后应验',
      basis: [
        '空亡爻需出空',
        `${uniqueKongWangBranches.join('、')}爻落空亡，须待出空之时方能应验`
      ],
      confidence: '中',
      specificBranches: uniqueKongWangBranches,
      description: `${uniqueKongWangBranches.join('、')}爻空亡，有而若无。需等到下一旬或被日月冲实、填实之时出空，方能发挥作用。空亡期间难以应验。`
    });
  }

  // 3. 六合逢冲应期、六冲逢合应期
  for (const analysis of changeAnalyses) {
    if (analysis.changeType === '化合') {
      // 合处逢冲时应验
      yingQiList.push({
        type: '中应',
        period: `逢冲之日月`,
        basis: [
          '合处逢冲应期',
          `${analysis.originalBranch}与${analysis.changedBranch}相合，逢冲则应`
        ],
        confidence: '中',
        specificBranches: [getChongBranch(analysis.changedBranch)],
        description: `${analysis.position + 1}爻${analysis.originalBranch}化${analysis.changedBranch}成合，合则不动，须待冲开之时应验。`
      });
    } else if (analysis.changeType === '化回头冲') {
      // 冲处逢合时应验
      const heBranch = getHeBranch(analysis.changedBranch);
      if (heBranch) {
        yingQiList.push({
          type: '近应',
          period: `${heBranch}日或逢合之时`,
          basis: [
            '冲处逢合应期',
            `${analysis.originalBranch}与${analysis.changedBranch}相冲，逢合则解`
          ],
          confidence: '中',
          specificBranches: [heBranch],
          description: `${analysis.position + 1}爻${analysis.originalBranch}化${analysis.changedBranch}相冲，冲则速应，但可逢合日解冲应验。`
        });
      }
    }
  }

  // 4. 如果没有动爻，以月建、日辰推断
  if (movingYaoBranches.length === 0) {
    yingQiList.push({
      type: '远应',
      period: '静卦应期较远',
      basis: [
        '静卦无动爻',
        '事态平稳，变化缓慢，应期较远'
      ],
      confidence: '低',
      specificBranches: [],
      description: '卦中六爻皆静��无动爻引动变化，事态多保持现状，若有应验则应期较远，或需外力触发。'
    });
  }

  // 5. 根据化进化退调整应期快慢
  const hasHuaJin = changeAnalyses.some(a => a.changeType === '化进');
  const hasHuaTui = changeAnalyses.some(a => a.changeType === '化退');

  if (hasHuaJin && yingQiList.length > 0) {
    yingQiList[0].description += ' 且有化进神,事态向好发展，应期可能提前。';
  }

  if (hasHuaTui && yingQiList.length > 0) {
    yingQiList[0].description += ' 但有化退神，力量减弱，应期可能推迟。';
  }

  return yingQiList.length > 0 ? yingQiList : [{
    type: '中应',
    period: '综合判断',
    basis: ['需根据具体占问事项和卦象综合判断'],
    confidence: '低',
    specificBranches: [],
    description: '应期需结合占问事项、用神旺衰、月建日辰等因素综合判断。'
  }];
}

/**
 * 获取与指定地支相冲的地支
 */
function getChongBranch(branch: string): string {
  const chongMap: { [key: string]: string } = {
    '子': '午', '午': '子',
    '丑': '未', '未': '丑',
    '寅': '申', '申': '寅',
    '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰',
    '巳': '亥', '亥': '巳'
  };
  return chongMap[branch] || '';
}

/**
 * 获取与指定地支相合的地支
 */
function getHeBranch(branch: string): string {
  const heMap: { [key: string]: string } = {
    '子': '丑', '丑': '子',
    '寅': '亥', '亥': '寅',
    '卯': '戌', '戌': '卯',
    '辰': '酉', '酉': '辰',
    '巳': '申', '申': '巳',
    '午': '未', '未': '午'
  };
  return heMap[branch] || '';
}

// 装卦（装纳甲、地支、五行、六亲、六神、世应）
export function decorateGua(gua: Gua, date: Date): GuaDecoration {
  // 获取上卦和下卦
  const upperTrigram = gua.trigrams.upper;
  const lowerTrigram = gua.trigrams.lower;

  // 装地支和天干：下三爻用下卦的配置，上三爻用上卦的配置
  const lowerBranches = EARTH_BRANCHES[lowerTrigram] || EARTH_BRANCHES['乾'];
  const upperBranches = EARTH_BRANCHES[upperTrigram] || EARTH_BRANCHES['乾'];
  const lowerStems = NAJIA[lowerTrigram] || NAJIA['乾'];
  const upperStems = NAJIA[upperTrigram] || NAJIA['乾'];

  // 组合：初二三爻用下卦，四五上爻用上卦
  const earthBranches = [
    lowerBranches[0], lowerBranches[1], lowerBranches[2],  // 初二三爻
    upperBranches[3], upperBranches[4], upperBranches[5]   // 四五上爻
  ];

  const heavenlyStems = [
    lowerStems[0], lowerStems[1], lowerStems[2],  // 初二三爻
    upperStems[3], upperStems[4], upperStems[5]   // 四五上爻
  ];

  // 确定卦宫（用于六亲）- 使用八宫归属表
  const guaName = gua.name;
  const palaceInfo = getGuaPalaceInfo(guaName);
  const guaGong = palaceInfo ? palaceInfo.palace.replace('宫', '') : lowerTrigram;  // 去掉"宫"字，只保留卦名
  const guaGongElement = TRIGRAMS[guaGong]?.element || TRIGRAMS['乾'].element;

  // 装五行
  const fiveElements = earthBranches.map(branch => FIVE_ELEMENTS[branch]);

  // 装六亲
  const sixRelatives = fiveElements.map(element => {
    return SIX_RELATIVES_MAP[guaGongElement]?.[element] || '兄弟';
  });

  // 装六神（根据日期天干）
  const lunar = Lunar.fromDate(date);
  const dayGan = lunar.getDayGan();
  const dayGanIndex = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(dayGan);
  const sixSpiritsStart = dayGanIndex % 6;
  const sixSpirits = [];
  for (let i = 0; i < 6; i++) {
    sixSpirits.push(SIX_SPIRITS[(sixSpiritsStart + i) % 6]);
  }

  // 确定世应位置 - 使用八宫归属表
  const shiYing = getShiYingPositions(guaName);

  // ========== 计算月建、日辰、空亡 ==========

  // 获取月建
  const monthBranch = lunar.getMonthZhi();  // 月建地支
  const monthGanZhi = lunar.getMonthInGanZhi();  // 月建干支

  // 获取日辰
  const dayGanZhi = lunar.getDayInGanZhi();  // 日辰干支

  // 计算空亡
  const kongWang = calculateKongWang(dayGanZhi);

  // 找出落空亡的爻位
  const kongWangYao: number[] = [];
  earthBranches.forEach((branch, index) => {
    if (kongWang.includes(branch)) {
      kongWangYao.push(index);
    }
  });

  // 获取日辰地支的五行
  const dayZhi = lunar.getDayZhi();
  const dayElement = FIVE_ELEMENTS[dayZhi] || '水';

  // ========== 计算每个爻位的旺衰状态 ==========
  const yaoStates: YaoState[] = [];
  for (let i = 0; i < 6; i++) {
    const element = fiveElements[i];
    const branch = earthBranches[i];

    const yaoState: YaoState = {
      position: i,
      isProspered: isProspered(element, monthBranch),  // 得月建生旺
      isDayHelped: isDayHelped(element, dayElement),   // 得日辰帮扶
      isKongWang: kongWang.includes(branch),           // 是否空亡
      state: getFiveElementState(element, monthBranch) // 旺相休囚死
    };

    yaoStates.push(yaoState);
  }

  // ========== 分析动爻化进化退 ==========
  const changeAnalyses: ChangeAnalysis[] = [];

  // 只有动爻才需要分析变化
  for (let i = 0; i < 6; i++) {
    if (gua.changes[i]) {
      // 原爻信息
      const originalBranch = earthBranches[i];
      const originalElement = fiveElements[i];

      // 变爻信息：动爻变为相反的阴阳
      // 需要找到变卦对应位置的地支和五行
      const bianGua = generateBianGua(gua);
      if (bianGua) {
        // 重新装变卦，获取变爻的地支
        const bianGuaUpperTrigram = bianGua.trigrams.upper;
        const bianGuaLowerTrigram = bianGua.trigrams.lower;
        const bianGuaLowerBranches = EARTH_BRANCHES[bianGuaLowerTrigram] || EARTH_BRANCHES['乾'];
        const bianGuaUpperBranches = EARTH_BRANCHES[bianGuaUpperTrigram] || EARTH_BRANCHES['乾'];
        const bianGuaEarthBranches = [
          bianGuaLowerBranches[0], bianGuaLowerBranches[1], bianGuaLowerBranches[2],
          bianGuaUpperBranches[3], bianGuaUpperBranches[4], bianGuaUpperBranches[5]
        ];

        const changedBranch = bianGuaEarthBranches[i];
        const changedElement = FIVE_ELEMENTS[changedBranch] || '水';

        // 分析化爻
        const analysis = analyzeChange(i, originalBranch, changedBranch, originalElement, changedElement);
        changeAnalyses.push(analysis);
      }
    }
  }

  // ========== 检测爻位之间的六合六冲三合关系 ==========
  const yaoRelations = detectYaoRelations(earthBranches, sixRelatives);

  // ========== 检测伏神 ==========
  const fuShens = detectFuShens(guaName, sixRelatives, earthBranches, fiveElements, guaGongElement);

  // ========== 推断应期 ==========
  const yingQi = calculateYingQi(
    gua,
    earthBranches,
    changeAnalyses,
    kongWangYao,
    monthBranch,
    dayGanZhi
  );

  return {
    earthBranches,
    sixRelatives,
    fiveElements,
    heavenlyStems,
    sixSpirits,
    shiYing,
    monthBranch,
    monthConstruction: monthGanZhi,
    dayGanZhi,
    kongWang,
    kongWangYao,
    yaoStates,
    changeAnalyses,
    yaoRelations,
    fuShens,
    yingQi
  };
}

// 模拟摇卦
export function simulateYaoGua(): number {
  // 每次摇3个铜钱，正面为3，反面为2
  // 三个铜钱的结果相加：6(老阴), 7(少阳), 8(少阴), 9(老阳)
  const coins = [
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2
  ];
  return coins.reduce((sum, coin) => sum + coin, 0);
}
