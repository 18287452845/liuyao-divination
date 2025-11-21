/**
 * 八宫六十四卦归属表
 * 根据《卜筮正宗》和《增删卜易》整理
 *
 * 每宫八卦次序：
 * 1. 本宫卦（八纯卦）- 世在上爻
 * 2. 一世卦 - 世在初爻
 * 3. 二世卦 - 世在二爻
 * 4. 三世卦 - 世在三爻
 * 5. 四世卦 - 世在四爻
 * 6. 五世卦 - 世在五爻
 * 7. 游魂卦 - 世在四爻
 * 8. 归魂卦 - 世在三爻
 */

export interface GuaPalaceInfo {
  palace: string;        // 卦宫，如"乾宫"
  position: number;      // 在本宫的位置 0-7（本宫、一世...归魂）
  worldYao: number;      // 世爻位置 0-5（初爻到上爻）
  responseYao: number;   // 应爻位置 0-5
  type: '本宫' | '一世' | '二世' | '三世' | '四世' | '五世' | '游魂' | '归魂';
}

/**
 * 六十四卦归宫表
 * key: 卦名
 * value: 卦宫信息
 */
export const GUA_PALACE_MAP: { [guaName: string]: GuaPalaceInfo } = {
  // ========== 乾宫八卦 ==========
  '乾为天': {
    palace: '乾宫',
    position: 0,
    worldYao: 5,      // 上爻
    responseYao: 2,   // 三爻
    type: '本宫'
  },
  '天风姤': {
    palace: '乾宫',
    position: 1,
    worldYao: 0,      // 初爻
    responseYao: 3,   // 四爻
    type: '一世'
  },
  '天山遁': {
    palace: '乾宫',
    position: 2,
    worldYao: 1,      // 二爻
    responseYao: 4,   // 五爻
    type: '二世'
  },
  '天地否': {
    palace: '乾宫',
    position: 3,
    worldYao: 2,      // 三爻
    responseYao: 5,   // 上爻
    type: '三世'
  },
  '风地观': {
    palace: '乾宫',
    position: 4,
    worldYao: 3,      // 四爻
    responseYao: 0,   // 初爻
    type: '四世'
  },
  '山地剥': {
    palace: '乾宫',
    position: 5,
    worldYao: 4,      // 五爻
    responseYao: 1,   // 二爻
    type: '五世'
  },
  '火地晋': {
    palace: '乾宫',
    position: 6,
    worldYao: 3,      // 四爻（游魂）
    responseYao: 0,   // 初爻
    type: '游魂'
  },
  '火天大有': {
    palace: '乾宫',
    position: 7,
    worldYao: 2,      // 三爻（归魂）
    responseYao: 5,   // 上爻
    type: '归魂'
  },

  // ========== 坤宫八卦 ==========
  '坤为地': {
    palace: '坤宫',
    position: 0,
    worldYao: 5,
    responseYao: 2,
    type: '本宫'
  },
  '地雷复': {
    palace: '坤宫',
    position: 1,
    worldYao: 0,
    responseYao: 3,
    type: '一世'
  },
  '地泽临': {
    palace: '坤宫',
    position: 2,
    worldYao: 1,
    responseYao: 4,
    type: '二世'
  },
  '地天泰': {
    palace: '坤宫',
    position: 3,
    worldYao: 2,
    responseYao: 5,
    type: '三世'
  },
  '雷天大壮': {
    palace: '坤宫',
    position: 4,
    worldYao: 3,
    responseYao: 0,
    type: '四世'
  },
  '泽天夬': {
    palace: '坤宫',
    position: 5,
    worldYao: 4,
    responseYao: 1,
    type: '五世'
  },
  '水天需': {
    palace: '坤宫',
    position: 6,
    worldYao: 3,
    responseYao: 0,
    type: '游魂'
  },
  '水地比': {
    palace: '坤宫',
    position: 7,
    worldYao: 2,
    responseYao: 5,
    type: '归魂'
  },

  // ========== 震宫八卦 ==========
  '震为雷': {
    palace: '震宫',
    position: 0,
    worldYao: 5,
    responseYao: 2,
    type: '本宫'
  },
  '雷地豫': {
    palace: '震宫',
    position: 1,
    worldYao: 0,
    responseYao: 3,
    type: '一世'
  },
  '雷水解': {
    palace: '震宫',
    position: 2,
    worldYao: 1,
    responseYao: 4,
    type: '二世'
  },
  '雷风恒': {
    palace: '震宫',
    position: 3,
    worldYao: 2,
    responseYao: 5,
    type: '三世'
  },
  '地风升': {
    palace: '震宫',
    position: 4,
    worldYao: 3,
    responseYao: 0,
    type: '四世'
  },
  '水风井': {
    palace: '震宫',
    position: 5,
    worldYao: 4,
    responseYao: 1,
    type: '五世'
  },
  '泽风大过': {
    palace: '震宫',
    position: 6,
    worldYao: 3,
    responseYao: 0,
    type: '游魂'
  },
  '泽雷随': {
    palace: '震宫',
    position: 7,
    worldYao: 2,
    responseYao: 5,
    type: '归魂'
  },

  // ========== 巽宫八卦 ==========
  '巽为风': {
    palace: '巽宫',
    position: 0,
    worldYao: 5,
    responseYao: 2,
    type: '本宫'
  },
  '风天小畜': {
    palace: '巽宫',
    position: 1,
    worldYao: 0,
    responseYao: 3,
    type: '一世'
  },
  '风火家人': {
    palace: '巽宫',
    position: 2,
    worldYao: 1,
    responseYao: 4,
    type: '二世'
  },
  '风雷益': {
    palace: '巽宫',
    position: 3,
    worldYao: 2,
    responseYao: 5,
    type: '三世'
  },
  '天雷无妄': {
    palace: '巽宫',
    position: 4,
    worldYao: 3,
    responseYao: 0,
    type: '四世'
  },
  '火雷噬嗑': {
    palace: '巽宫',
    position: 5,
    worldYao: 4,
    responseYao: 1,
    type: '五世'
  },
  '山雷颐': {
    palace: '巽宫',
    position: 6,
    worldYao: 3,
    responseYao: 0,
    type: '游魂'
  },
  '山风蛊': {
    palace: '巽宫',
    position: 7,
    worldYao: 2,
    responseYao: 5,
    type: '归魂'
  },

  // ========== 坎宫八卦 ==========
  '坎为水': {
    palace: '坎宫',
    position: 0,
    worldYao: 5,
    responseYao: 2,
    type: '本宫'
  },
  '水泽节': {
    palace: '坎宫',
    position: 1,
    worldYao: 0,
    responseYao: 3,
    type: '一世'
  },
  '水雷屯': {
    palace: '坎宫',
    position: 2,
    worldYao: 1,
    responseYao: 4,
    type: '二世'
  },
  '水火既济': {
    palace: '坎宫',
    position: 3,
    worldYao: 2,
    responseYao: 5,
    type: '三世'
  },
  '泽火革': {
    palace: '坎宫',
    position: 4,
    worldYao: 3,
    responseYao: 0,
    type: '四世'
  },
  '雷火丰': {
    palace: '坎宫',
    position: 5,
    worldYao: 4,
    responseYao: 1,
    type: '五世'
  },
  '地火明夷': {
    palace: '坎宫',
    position: 6,
    worldYao: 3,
    responseYao: 0,
    type: '游魂'
  },
  '地水师': {
    palace: '坎宫',
    position: 7,
    worldYao: 2,
    responseYao: 5,
    type: '归魂'
  },

  // ========== 离宫八卦 ==========
  '离为火': {
    palace: '离宫',
    position: 0,
    worldYao: 5,
    responseYao: 2,
    type: '本宫'
  },
  '火山旅': {
    palace: '离宫',
    position: 1,
    worldYao: 0,
    responseYao: 3,
    type: '一世'
  },
  '火风鼎': {
    palace: '离宫',
    position: 2,
    worldYao: 1,
    responseYao: 4,
    type: '二世'
  },
  '火水未济': {
    palace: '离宫',
    position: 3,
    worldYao: 2,
    responseYao: 5,
    type: '三世'
  },
  '山水蒙': {
    palace: '离宫',
    position: 4,
    worldYao: 3,
    responseYao: 0,
    type: '四世'
  },
  '风水涣': {
    palace: '离宫',
    position: 5,
    worldYao: 4,
    responseYao: 1,
    type: '五世'
  },
  '天水讼': {
    palace: '离宫',
    position: 6,
    worldYao: 3,
    responseYao: 0,
    type: '游魂'
  },
  '天火同人': {
    palace: '离宫',
    position: 7,
    worldYao: 2,
    responseYao: 5,
    type: '归魂'
  },

  // ========== 艮宫八卦 ==========
  '艮为山': {
    palace: '艮宫',
    position: 0,
    worldYao: 5,
    responseYao: 2,
    type: '本宫'
  },
  '山火贲': {
    palace: '艮宫',
    position: 1,
    worldYao: 0,
    responseYao: 3,
    type: '一世'
  },
  '山天大畜': {
    palace: '艮宫',
    position: 2,
    worldYao: 1,
    responseYao: 4,
    type: '二世'
  },
  '山泽损': {
    palace: '艮宫',
    position: 3,
    worldYao: 2,
    responseYao: 5,
    type: '三世'
  },
  '火泽睽': {
    palace: '艮宫',
    position: 4,
    worldYao: 3,
    responseYao: 0,
    type: '四世'
  },
  '天泽履': {
    palace: '艮宫',
    position: 5,
    worldYao: 4,
    responseYao: 1,
    type: '五世'
  },
  '风泽中孚': {
    palace: '艮宫',
    position: 6,
    worldYao: 3,
    responseYao: 0,
    type: '游魂'
  },
  '风山渐': {
    palace: '艮宫',
    position: 7,
    worldYao: 2,
    responseYao: 5,
    type: '归魂'
  },

  // ========== 兑宫八卦 ==========
  '兑为泽': {
    palace: '兑宫',
    position: 0,
    worldYao: 5,
    responseYao: 2,
    type: '本宫'
  },
  '泽水困': {
    palace: '兑宫',
    position: 1,
    worldYao: 0,
    responseYao: 3,
    type: '一世'
  },
  '泽地萃': {
    palace: '兑宫',
    position: 2,
    worldYao: 1,
    responseYao: 4,
    type: '二世'
  },
  '泽山咸': {
    palace: '兑宫',
    position: 3,
    worldYao: 2,
    responseYao: 5,
    type: '三世'
  },
  '水山蹇': {
    palace: '兑宫',
    position: 4,
    worldYao: 3,
    responseYao: 0,
    type: '四世'
  },
  '地山谦': {
    palace: '兑宫',
    position: 5,
    worldYao: 4,
    responseYao: 1,
    type: '五世'
  },
  '雷山小过': {
    palace: '兑宫',
    position: 6,
    worldYao: 3,
    responseYao: 0,
    type: '游魂'
  },
  '雷泽归妹': {
    palace: '兑宫',
    position: 7,
    worldYao: 2,
    responseYao: 5,
    type: '归魂'
  }
};

/**
 * 根据卦名获取卦宫信息
 * @param guaName 卦名，如"乾为天"、"天风姤"等
 * @returns 卦宫信息，如果找不到则返回null
 */
export function getGuaPalaceInfo(guaName: string): GuaPalaceInfo | null {
  return GUA_PALACE_MAP[guaName] || null;
}

/**
 * 获取世应位置
 * @param guaName 卦名
 * @returns [世爻位置, 应爻位置]，位置范围0-5（初爻到上爻）
 */
export function getShiYingPositions(guaName: string): [number, number] {
  const info = getGuaPalaceInfo(guaName);
  if (info) {
    return [info.worldYao, info.responseYao];
  }
  // 默认返回本宫卦的世应
  return [5, 2];
}

/**
 * 获取卦宫
 * @param guaName 卦名
 * @returns 卦宫名称，如"乾宫"
 */
export function getGuaPalace(guaName: string): string {
  const info = getGuaPalaceInfo(guaName);
  if (info) {
    return info.palace;
  }
  // 默认返回乾宫
  return '乾宫';
}
