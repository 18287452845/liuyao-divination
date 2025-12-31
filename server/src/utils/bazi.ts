/**
 * 八字批命功能 - 核心算法实现
 *
 * 本文件包含八字计算的所有核心算法
 */

import { Lunar, Solar } from 'lunar-javascript';
import {
  BaZi,
  Pillar,
  ShiShenAnalysis,
  WuXingAnalysis,
  WuXingCount,
  RelationsAnalysis,
  DiZhiRelation,
  DaYunResult,
  DaYunStep,
  BaZiDecoration,
  Gender,
  WuXing,
  ShiShen
} from '../types/bazi';
import {
  TIAN_GAN,
  DI_ZHI,
  TIAN_GAN_WU_XING,
  DI_ZHI_WU_XING,
  TIAN_GAN_YIN_YANG,
  DI_ZHI_YIN_YANG,
  DI_ZHI_CANG_GAN,
  NA_YIN_TABLE,
  wuXingGenerates,
  wuXingControls,
  DI_ZHI_LIU_HE,
  DI_ZHI_SAN_HE,
  DI_ZHI_LIU_CHONG,
  DI_ZHI_SAN_XING,
  DI_ZHI_XIANG_HAI,
  getNaYin
} from './baziConstants';

// ==================== 核心函数：计算八字 ====================

/**
 * 根据出生时间计算八字（四柱）
 *
 * @param birthTimestamp 出生时间戳（毫秒）
 * @param gender 性别（用于大运计算）
 * @param useTrueSolarTime 是否使用真太阳时
 * @param birthLocation 出生地点（用于真太阳时校正，暂未实现）
 * @returns 八字完整信息
 */
export async function calculateBaziFromDateTime(
  birthTimestamp: number,
  gender: Gender,
  useTrueSolarTime: boolean = false,
  birthLocation?: string
): Promise<BaZi> {
  // 1. 将时间戳转换为Date对象
  const birthDate = new Date(birthTimestamp);

  // 2. 使用lunar-javascript库获取农历和八字
  const solar = Solar.fromDate(birthDate);
  const lunar = solar.getLunar();

  // 3. 获取八字对象
  const eightChar = lunar.getEightChar();

  // 4. 构建四柱
  const year = buildPillar(eightChar.getYear());
  const month = buildPillar(eightChar.getMonth());
  const day = buildPillar(eightChar.getDay());
  const hour = buildPillar(eightChar.getTime());

  // 5. 返回完整八字
  return {
    year,
    month,
    day,
    hour,
    riGan: day.gan,     // 日干最关键，代表命主本人
    lunarDate: lunar,
    solarDate: solar
  };
}

/**
 * 构建单柱（年/月/日/时柱）的详细信息
 *
 * @param ganZhi 干支组合（如"甲子"）
 * @returns 柱的详细信息
 */
function buildPillar(ganZhi: string): Pillar {
  const gan = ganZhi[0];
  const zhi = ganZhi[1];

  return {
    gan,
    zhi,
    ganZhi,
    ganWuXing: TIAN_GAN_WU_XING[gan],
    zhiWuXing: DI_ZHI_WU_XING[zhi],
    ganYinYang: TIAN_GAN_YIN_YANG[gan],
    zhiYinYang: DI_ZHI_YIN_YANG[zhi],
    cangGan: DI_ZHI_CANG_GAN[zhi],
    naYin: getNaYin(ganZhi)
  };
}

// ==================== 十神计算 ====================

/**
 * 计算八字的十神关系
 *
 * @param bazi 八字信息
 * @returns 十神分析结果
 */
export function calculateShiShen(bazi: BaZi): ShiShenAnalysis {
  const riGan = bazi.riGan;

  return {
    year: {
      gan: getShiShenByGan(riGan, bazi.year.gan),
      zhi: getShiShenByZhi(riGan, bazi.year.zhi)
    },
    month: {
      gan: getShiShenByGan(riGan, bazi.month.gan),
      zhi: getShiShenByZhi(riGan, bazi.month.zhi)
    },
    hour: {
      gan: getShiShenByGan(riGan, bazi.hour.gan),
      zhi: getShiShenByZhi(riGan, bazi.hour.zhi)
    }
    // 注意：日柱不计算十神，因为日干就是"我"
  };
}

/**
 * 根据天干计算十神
 *
 * @param riGan 日干（我）
 * @param targetGan 目标天干
 * @returns 十神名称
 */
function getShiShenByGan(riGan: string, targetGan: string): ShiShen {
  // 特殊情况：同一个天干
  if (riGan === targetGan) {
    return '比肩';
  }

  const riWuXing = TIAN_GAN_WU_XING[riGan];
  const targetWuXing = TIAN_GAN_WU_XING[targetGan];
  const riYinYang = TIAN_GAN_YIN_YANG[riGan];
  const targetYinYang = TIAN_GAN_YIN_YANG[targetGan];
  const sameYinYang = riYinYang === targetYinYang;

  // 1. 同五行
  if (riWuXing === targetWuXing) {
    return sameYinYang ? '比肩' : '劫财';
  }

  // 2. 我生者（食伤）
  if (wuXingGenerates(riWuXing, targetWuXing)) {
    return sameYinYang ? '食神' : '伤官';
  }

  // 3. 我克者（财）
  if (wuXingControls(riWuXing, targetWuXing)) {
    return sameYinYang ? '偏财' : '正财';
  }

  // 4. 克我者（官杀）
  if (wuXingControls(targetWuXing, riWuXing)) {
    return sameYinYang ? '偏官' : '正官';
  }

  // 5. 生我者（印）
  if (wuXingGenerates(targetWuXing, riWuXing)) {
    return sameYinYang ? '偏印' : '正印';
  }

  // 理论上不应该到这里
  return '比肩';
}

/**
 * 根据地支计算十神（通过地支藏干的主气）
 *
 * @param riGan 日干（我）
 * @param targetZhi 目标地支
 * @returns 十神名称
 */
function getShiShenByZhi(riGan: string, targetZhi: string): ShiShen {
  // 取地支藏干的第一个（主气）
  const cangGan = DI_ZHI_CANG_GAN[targetZhi];
  const mainGan = cangGan[0];

  return getShiShenByGan(riGan, mainGan);
}

// ==================== 大运计算 ====================

/**
 * 计算大运
 *
 * @param monthGan 月柱天干
 * @param monthZhi 月柱地支
 * @param yearGan 年柱天干（用于判断顺逆）
 * @param gender 性别
 * @param birthTimestamp 出生时间戳
 * @param riGan 日干（用于计算十神，可选）
 * @returns 大运信息
 */
export function calculateDaYun(
  monthGan: string,
  monthZhi: string,
  yearGan: string,
  gender: Gender,
  birthTimestamp: number,
  riGan?: string
): DaYunResult {
  // 1. 判断顺排还是逆排
  // 规则：阳男阴女顺排，阴男阳女逆排
  const isYangNan = TIAN_GAN_YIN_YANG[yearGan] === '阳' && gender === '男';
  const isYinNv = TIAN_GAN_YIN_YANG[yearGan] === '阴' && gender === '女';
  const shunPai = isYangNan || isYinNv;

  // 2. 计算起运年龄（简化版：固定为3岁）
  // 注意：真实算法需要根据出生日到节气的天数，3天折1年
  // 这里暂时使用固定值，后续可优化
  const qiyunAge = 3;

  // 3. 排大运（从月柱开始，顺排或逆排）
  const steps: DaYunStep[] = [];
  let ganIndex = TIAN_GAN.indexOf(monthGan);
  let zhiIndex = DI_ZHI.indexOf(monthZhi);

  for (let i = 0; i < 8; i++) {
    // 顺排：递增；逆排：递减
    if (shunPai) {
      ganIndex = (ganIndex + 1) % 10;
      zhiIndex = (zhiIndex + 1) % 12;
    } else {
      ganIndex = (ganIndex - 1 + 10) % 10;
      zhiIndex = (zhiIndex - 1 + 12) % 12;
    }

    const gan = TIAN_GAN[ganIndex];
    const zhi = DI_ZHI[zhiIndex];
    const ganZhi = gan + zhi;

    const step: DaYunStep = {
      ganZhi,
      gan,
      zhi,
      startAge: qiyunAge + i * 10,
      endAge: qiyunAge + (i + 1) * 10 - 1,
      wuXing: {
        gan: TIAN_GAN_WU_XING[gan],
        zhi: DI_ZHI_WU_XING[zhi]
      },
      naYin: getNaYin(ganZhi)
    };

    // 如果提供了日干，计算大运的十神
    if (riGan) {
      step.shiShen = {
        gan: getShiShenByGan(riGan, gan),
        zhi: getShiShenByZhi(riGan, zhi)
      };
    }

    steps.push(step);
  }

  return {
    qiyunAge,
    shunPai,
    steps
  };
}

// ==================== 五行分析 ====================

/**
 * 分析八字的五行强弱
 *
 * @param bazi 八字信息
 * @returns 五行分析结果
 */
export function analyzeWuXing(bazi: BaZi): WuXingAnalysis {
  // 1. 统计五行数量（天干 + 地支）
  const count: WuXingCount = {
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0
  };

  // 统计天干五行
  [bazi.year.gan, bazi.month.gan, bazi.day.gan, bazi.hour.gan].forEach(gan => {
    count[TIAN_GAN_WU_XING[gan]]++;
  });

  // 统计地支五行
  [bazi.year.zhi, bazi.month.zhi, bazi.day.zhi, bazi.hour.zhi].forEach(zhi => {
    count[DI_ZHI_WU_XING[zhi]]++;
  });

  // 2. 找出最旺和最弱的五行
  const wuXingList: WuXing[] = ['木', '火', '土', '金', '水'];
  let strongest: WuXing = '木';
  let weakest: WuXing = '木';
  let maxCount = count['木'];
  let minCount = count['木'];

  wuXingList.forEach(wx => {
    if (count[wx] > maxCount) {
      strongest = wx;
      maxCount = count[wx];
    }
    if (count[wx] < minCount) {
      weakest = wx;
      minCount = count[wx];
    }
  });

  // 3. 简化版用神推算（实际应更复杂，需考虑月令、日主旺衰等）
  // 这里简单规则：最弱的五行为用神，最旺的五行为忌神
  const yongShen = weakest;
  const jiShen = strongest;

  // 4. 计算平衡度（0-100，越高越平衡）
  const average = 8 / 5;  // 总共8个五行，理想平均值
  const variance = wuXingList.reduce((sum, wx) => {
    return sum + Math.pow(count[wx] - average, 2);
  }, 0) / 5;
  const balance = Math.max(0, 100 - variance * 20);  // 转换为0-100分

  return {
    count,
    strongest,
    weakest,
    yongShen,
    jiShen,
    balance: Math.round(balance)
  };
}

// ==================== 地支关系分析 ====================

/**
 * 分析八字的地支关系（合冲刑害）
 *
 * @param bazi 八字信息
 * @returns 地支关系分析结果
 */
export function analyzeRelations(bazi: BaZi): RelationsAnalysis {
  const zhis = [
    { position: 'year' as const, zhi: bazi.year.zhi },
    { position: 'month' as const, zhi: bazi.month.zhi },
    { position: 'day' as const, zhi: bazi.day.zhi },
    { position: 'hour' as const, zhi: bazi.hour.zhi }
  ];

  const liuHe: DiZhiRelation[] = [];
  const sanHe: DiZhiRelation[] = [];
  const liuChong: DiZhiRelation[] = [];
  const sanXing: DiZhiRelation[] = [];
  const xiangHai: DiZhiRelation[] = [];

  // 检查六合（两两组合）
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i + 1; j < zhis.length; j++) {
      const zhi1 = zhis[i];
      const zhi2 = zhis[j];

      // 检查是否六合
      const isHe = DI_ZHI_LIU_HE.some(
        ([a, b]) =>
          (a === zhi1.zhi && b === zhi2.zhi) ||
          (a === zhi2.zhi && b === zhi1.zhi)
      );

      if (isHe) {
        liuHe.push({
          type: 'liuHe',
          positions: [zhi1.position, zhi2.position],
          zhis: [zhi1.zhi, zhi2.zhi],
          description: `${zhi1.zhi}${zhi2.zhi}合`
        });
      }

      // 检查是否六冲
      const isChong = DI_ZHI_LIU_CHONG.some(
        ([a, b]) =>
          (a === zhi1.zhi && b === zhi2.zhi) ||
          (a === zhi2.zhi && b === zhi1.zhi)
      );

      if (isChong) {
        liuChong.push({
          type: 'liuChong',
          positions: [zhi1.position, zhi2.position],
          zhis: [zhi1.zhi, zhi2.zhi],
          description: `${zhi1.zhi}${zhi2.zhi}冲`
        });
      }

      // 检查是否相害
      const isHai = DI_ZHI_XIANG_HAI.some(
        ([a, b]) =>
          (a === zhi1.zhi && b === zhi2.zhi) ||
          (a === zhi2.zhi && b === zhi1.zhi)
      );

      if (isHai) {
        xiangHai.push({
          type: 'xiangHai',
          positions: [zhi1.position, zhi2.position],
          zhis: [zhi1.zhi, zhi2.zhi],
          description: `${zhi1.zhi}${zhi2.zhi}害`
        });
      }
    }
  }

  // 检查三合（三个一组）
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i + 1; j < zhis.length; j++) {
      for (let k = j + 1; k < zhis.length; k++) {
        const zhi1 = zhis[i];
        const zhi2 = zhis[j];
        const zhi3 = zhis[k];

        const zhiSet = new Set([zhi1.zhi, zhi2.zhi, zhi3.zhi]);
        const heGroup = DI_ZHI_SAN_HE.find(([a, b, c]) => {
          const groupSet = new Set([a, b, c]);
          return (
            zhiSet.size === 3 &&
            Array.from(zhiSet).every(z => groupSet.has(z))
          );
        });

        if (heGroup) {
          sanHe.push({
            type: 'sanHe',
            positions: [zhi1.position, zhi2.position, zhi3.position],
            zhis: [zhi1.zhi, zhi2.zhi, zhi3.zhi],
            description: `${zhi1.zhi}${zhi2.zhi}${zhi3.zhi}三合`
          });
        }
      }
    }
  }

  // 检查三刑（简化版，只检查两两和三个的情况）
  // 注意：三刑规则比较复杂，这里仅实现基本判断
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i + 1; j < zhis.length; j++) {
      const zhi1 = zhis[i];
      const zhi2 = zhis[j];

      // 子卯刑
      if (
        (zhi1.zhi === '子' && zhi2.zhi === '卯') ||
        (zhi1.zhi === '卯' && zhi2.zhi === '子')
      ) {
        sanXing.push({
          type: 'sanXing',
          positions: [zhi1.position, zhi2.position],
          zhis: [zhi1.zhi, zhi2.zhi],
          description: `子卯相刑（无礼之刑）`
        });
      }

      // 自刑
      if (
        zhi1.zhi === zhi2.zhi &&
        ['辰', '午', '酉', '亥'].includes(zhi1.zhi)
      ) {
        sanXing.push({
          type: 'sanXing',
          positions: [zhi1.position, zhi2.position],
          zhis: [zhi1.zhi, zhi2.zhi],
          description: `${zhi1.zhi}${zhi2.zhi}自刑`
        });
      }
    }
  }

  return {
    liuHe,
    sanHe,
    liuChong,
    sanXing,
    xiangHai
  };
}

// ==================== 组装完整八字装饰数据 ====================

/**
 * 组装完整的八字装饰数据（包含所有分析）
 *
 * @param bazi 基础八字信息
 * @returns 完整的八字装饰数据
 */
export function decorateBazi(bazi: BaZi): BaZiDecoration {
  const shiShen = calculateShiShen(bazi);
  const wuXing = analyzeWuXing(bazi);
  const relations = analyzeRelations(bazi);

  return {
    bazi,
    shiShen,
    wuXing,
    relations
  };
}

// ==================== 导出所有函数 ====================

export {
  buildPillar,
  getShiShenByGan,
  getShiShenByZhi
};
