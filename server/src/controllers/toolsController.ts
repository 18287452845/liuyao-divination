import { Request, Response } from 'express';
import { Lunar } from 'lunar-javascript';
import {
  FIVE_ELEMENTS,
  LIU_HE,
  LIU_CHONG,
  SAN_HE,
  BRANCH_SAN_HE,
  TWELVE_BRANCHES,
  KONG_WANG_MAP,
  TRIGRAMS
} from '../utils/constants';
import { query, queryOne } from '../models/database';

/**
 * 万年历 - 公历转农历
 */
export const solarToLunar = async (req: Request, res: Response) => {
  try {
    const { year, month, day } = req.query;

    if (!year || !month || !day) {
      return res.status(400).json({ error: '请提供完整的年月日' });
    }

    const date = new Date(
      parseInt(year as string),
      parseInt(month as string) - 1,
      parseInt(day as string)
    );
    const lunar = Lunar.fromDate(date);

    // 计算空亡
    const dayGanZhi = lunar.getDayInGanZhi();
    const kongWang = calculateKongWang(dayGanZhi);

    // 获取星期
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[date.getDay()];

    // 获取当前节气信息
    const prevJie = (lunar as any).getPrevJie();
    const nextJie = (lunar as any).getNextJie();
    const prevQi = (lunar as any).getPrevQi();
    const nextQi = (lunar as any).getNextQi();

    // 判断当前节气（离得更近的那个）
    let currentJieQi = '无';
    if (prevJie && nextJie) {
      const prevJieDate = new Date(prevJie.getSolar().toYmd());
      const nextJieDate = new Date(nextJie.getSolar().toYmd());
      const daysDiffPrev = Math.abs(date.getTime() - prevJieDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysDiffNext = Math.abs(nextJieDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

      // 如果距离前一个节气更近，则当前节气是前一个节气
      if (daysDiffPrev <= daysDiffNext) {
        currentJieQi = prevJie.getName();
      } else {
        // 否则还未到下一个节气
        currentJieQi = `${prevJie.getName()}后，${nextJie.getName()}前`;
      }
    }

    // 获取下一个节（立春、雨水等）
    let nextJieName = '无';
    let nextJieDate = '';
    if (nextJie) {
      nextJieName = nextJie.getName();
      nextJieDate = nextJie.getSolar().toYmd();
    }

    // 获取下一个气（立冬、小雪等）
    let nextQiName = '无';
    let nextQiDate = '';
    if (nextQi) {
      nextQiName = nextQi.getName();
      nextQiDate = nextQi.getSolar().toYmd();
    }

    res.json({
      solar: {
        year: parseInt(year as string),
        month: parseInt(month as string),
        day: parseInt(day as string),
        weekDay
      },
      lunar: {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        yearGanZhi: lunar.getYearInGanZhi(),
        monthGanZhi: lunar.getMonthInGanZhi(),
        dayGanZhi: lunar.getDayInGanZhi(),
        yearZodiac: `${lunar.getYearInGanZhi()}年`,
        monthName: `${lunar.getMonth()}月`,
        dayName: `${lunar.getDay()}日`
      },
      jieQi: {
        current: currentJieQi,
        nextJie: nextJieName,
        nextJieDate: nextJieDate,
        nextQi: nextQiName,
        nextQiDate: nextQiDate
      },
      kongWang: {
        branches: kongWang,
        description: `${kongWang[0]}${kongWang[1]}空`
      }
    });
  } catch (error) {
    console.error('万年历转换错误:', error);
    res.status(500).json({ error: '万年历转换失败' });
  }
};

/**
 * 农历转公历
 */
export const lunarToSolar = async (req: Request, res: Response) => {
  try {
    const { year, month, day } = req.query;

    if (!year || !month || !day) {
      return res.status(400).json({ error: '请提供完整的年月日' });
    }

    // 简化实现：提示用户使用公历查询
    res.json({
      message: '农历转公历功能暂未完全实现，请使用公历查询功能',
      input: {
        year: parseInt(year as string),
        month: parseInt(month as string),
        day: parseInt(day as string)
      }
    });
  } catch (error) {
    console.error('农历转换错误:', error);
    res.status(500).json({ error: '农历转换失败' });
  }
};

/**
 * 计算空亡
 * 根据日干支确定空亡的两个地支
 */
function calculateKongWang(dayGanZhi: string): [string, string] {
  // 提取地支
  const zhi = dayGanZhi.substring(1);

  // 在KONG_WANG_MAP中查找
  for (const [xun, kong] of Object.entries(KONG_WANG_MAP)) {
    // 检查日支是否在这一旬中
    const xunStart = xun.substring(1); // 如"甲子"旬，起始地支是"子"
    const zhiIndex = TWELVE_BRANCHES.indexOf(zhi);
    const xunStartIndex = TWELVE_BRANCHES.indexOf(xunStart);

    // 判断是否在同一旬（10天为一旬）
    let inXun = false;
    for (let i = 0; i < 10; i++) {
      if ((xunStartIndex + i) % 12 === zhiIndex) {
        inXun = true;
        break;
      }
    }

    if (inXun) {
      return kong as [string, string];
    }
  }

  return ['戌', '亥']; // 默认值
}

/**
 * 地支关系查询
 */
export const branchRelations = async (req: Request, res: Response) => {
  try {
    const { branch } = req.query;

    if (!branch || typeof branch !== 'string') {
      return res.status(400).json({ error: '请提供地支' });
    }

    if (!TWELVE_BRANCHES.includes(branch)) {
      return res.status(400).json({ error: '无效的地支' });
    }

    // 五行
    const element = FIVE_ELEMENTS[branch] || '未知';

    // 六合
    const hePartner = Object.entries(LIU_HE).find(
      ([k, v]) => k === branch || v === branch
    );
    const he = hePartner ? (hePartner[0] === branch ? hePartner[1] : hePartner[0]) : null;

    // 六冲
    const chongPartner = Object.entries(LIU_CHONG).find(
      ([k, v]) => k === branch || v === branch
    );
    const chong = chongPartner ? (chongPartner[0] === branch ? chongPartner[1] : chongPartner[0]) : null;

    // 三合
    const sanhe = getSanHe(branch);

    // 地支描述
    const description = getBranchDescription(branch);

    res.json({
      branch,
      element,
      he,
      chong,
      sanhe,
      description
    });
  } catch (error) {
    console.error('地支关系查询错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
};

/**
 * 获取三合局
 */
function getSanHe(branch: string): { name: string; branches: string[] } | null {
  for (const [name, sanheData] of Object.entries(SAN_HE)) {
    if (sanheData.branches.includes(branch)) {
      return { name, branches: sanheData.branches };
    }
  }
  return null;
}

/**
 * 地支描述
 */
function getBranchDescription(branch: string): string {
  const descriptions: { [key: string]: string } = {
    '子': '属水，冬月建，北方，子时（23-1点）',
    '丑': '属土，冬月建，东北方，丑时（1-3点）',
    '寅': '属木，春月建，东北方，寅时（3-5点）',
    '卯': '属木，春月建，东方，卯时（5-7点）',
    '辰': '属土，春月建，东南方，辰时（7-9点）',
    '巳': '属火，夏月建，东南方，巳时（9-11点）',
    '午': '属火，夏月建，南方，午时（11-13点）',
    '未': '属土，夏月建，西南方，未时（13-15点）',
    '申': '属金，秋月建，西南方，申时（15-17点）',
    '酉': '属金，秋月建，西方，酉时（17-19点）',
    '戌': '属土，秋月建，西北方，戌时（19-21点）',
    '亥': '属水，冬月建，西北方，亥时（21-23点）'
  };
  return descriptions[branch] || '未知地支';
}

/**
 * 用神速查
 */
export const yongShenHelper = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: '请提供占问类型' });
    }

    const mapping: { [key: string]: any } = {
      '求财': {
        yongShen: '妻财',
        yuanShen: '子孙',
        jiShen: '兄弟',
        chouShen: '父母',
        description: '财爻为用神，子孙爻生财为原神，兄弟爻劫财为忌神'
      },
      '求官': {
        yongShen: '官鬼',
        yuanShen: '父母',
        jiShen: '兄弟',
        chouShen: '子孙',
        description: '官鬼为用神，父母爻生官为原神，子孙爻克官为忌神'
      },
      '考试': {
        yongShen: '官鬼',
        yuanShen: '父母',
        jiShen: '兄弟',
        chouShen: '子孙',
        description: '官鬼为功名，父母爻为文书，宜官鬼父母两旺'
      },
      '婚姻男': {
        yongShen: '妻财',
        yuanShen: '子孙',
        jiShen: '兄弟',
        chouShen: '官鬼',
        description: '妻财为用神，宜旺相不宜空亡。官鬼为情敌，不宜发动'
      },
      '婚姻女': {
        yongShen: '官鬼',
        yuanShen: '父母',
        jiShen: '兄弟',
        chouShen: '子孙',
        description: '官鬼为夫星，宜旺相有力。兄弟爻为争夫之人，不宜旺'
      },
      '求子': {
        yongShen: '子孙',
        yuanShen: '妻财',
        jiShen: '官鬼',
        chouShen: '兄弟',
        description: '子孙爻为用神，宜旺相临青龙。官鬼克制子孙为忌'
      },
      '疾病': {
        yongShen: '官鬼',
        yuanShen: '父母',
        jiShen: '子孙',
        chouShen: '兄弟',
        description: '官鬼为病症，子孙为医药。病宜官鬼衰弱，子孙旺相'
      },
      '出行': {
        yongShen: '世爻',
        yuanShen: '父母',
        jiShen: '官鬼',
        chouShen: '兄弟',
        description: '世爻为自己，应爻为目的地。宜世旺应生，不宜官鬼发动'
      },
      '官司': {
        yongShen: '世爻',
        yuanShen: '子孙',
        jiShen: '应爻',
        chouShen: '官鬼',
        description: '世爻为自己，应爻为对方，官鬼为官府。子孙制鬼为有理'
      }
    };

    const result = mapping[category];

    if (!result) {
      // 返回所有可用类型
      return res.json({
        availableCategories: Object.keys(mapping),
        message: '请选择有效的占问类型'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('用神查询错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
};

/**
 * 获取所有可用的占问类型
 */
export const getCategories = async (req: Request, res: Response) => {
  const categories = [
    { id: '求财', name: '求财占', icon: '💰' },
    { id: '求官', name: '求官占', icon: '🎓' },
    { id: '考试', name: '考试占', icon: '📝' },
    { id: '婚姻男', name: '婚姻占（男）', icon: '💑' },
    { id: '婚姻女', name: '婚姻占（女）', icon: '💑' },
    { id: '求子', name: '求子占', icon: '👶' },
    { id: '疾病', name: '疾病占', icon: '🏥' },
    { id: '出行', name: '出行占', icon: '✈️' },
    { id: '官司', name: '官司占', icon: '⚖️' }
  ];

  res.json(categories);
};

/**
 * 获取某年的24节气表
 */
export const getJieQiTable = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: '请提供年份' });
    }

    // 创建该年任意一天的lunar对象来获取节气表
    const date = new Date(parseInt(year as string), 0, 1);
    const lunar = Lunar.fromDate(date);

    // 获取节气表
    const jieQiTable = (lunar as any).getJieQiTable();

    // 24节气顺序
    const jieQiOrder = [
      '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
      '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
      '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
    ];

    // 格式化输出
    const formattedTable: any[] = [];
    jieQiOrder.forEach((name) => {
      if (jieQiTable[name]) {
        const solar = jieQiTable[name];
        formattedTable.push({
          name,
          date: solar.toYmd(),
          time: `${solar.getHour()}:${solar.getMinute()}:${solar.getSecond()}`,
          dateTime: solar.toYmdHms()
        });
      }
    });

    res.json({
      year: parseInt(year as string),
      jieQi: formattedTable
    });
  } catch (error) {
    console.error('获取节气表错误:', error);
    res.status(500).json({ error: '获取节气表失败' });
  }
};

/**
 * 获取所有卦象列表
 */
export const getGuaList = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let sql = 'SELECT number, name, upper_trigram, lower_trigram, gua_ci FROM gua_data';
    const params: any[] = [];

    // 如果有搜索关键词
    if (search && typeof search === 'string') {
      sql += ' WHERE name LIKE ? OR gua_ci LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY number';

    const results: any = await query(sql, params);

    // 为每个卦添加卦象符号
    const guaList = results.map((gua: any) => {
      const upperSymbol = TRIGRAMS[gua.upper_trigram]?.symbol || '';
      const lowerSymbol = TRIGRAMS[gua.lower_trigram]?.symbol || '';

      return {
        number: gua.number,
        name: gua.name,
        upperTrigram: gua.upper_trigram,
        lowerTrigram: gua.lower_trigram,
        upperSymbol,
        lowerSymbol,
        guaCi: gua.gua_ci
      };
    });

    res.json(guaList);
  } catch (error) {
    console.error('获取卦象列表错误:', error);
    res.status(500).json({ error: '获取卦象列表失败' });
  }
};

/**
 * 获取单个卦象详情
 */
export const getGuaDetail = async (req: Request, res: Response) => {
  try {
    const { number } = req.params;

    if (!number) {
      return res.status(400).json({ error: '请提供卦序号' });
    }

    const result: any = await queryOne(
      'SELECT * FROM gua_data WHERE number = ?',
      [parseInt(number)]
    );

    if (!result) {
      return res.status(404).json({ error: '未找到该卦象' });
    }

    // 解析爻辞JSON
    let yaoCi: string[] = [];
    try {
      yaoCi = JSON.parse(result.yao_ci);
    } catch (e) {
      console.error('爻辞JSON解析失败:', e);
      yaoCi = [];
    }

    // 获取卦象符号
    const upperSymbol = TRIGRAMS[result.upper_trigram]?.symbol || '';
    const lowerSymbol = TRIGRAMS[result.lower_trigram]?.symbol || '';
    const upperElement = TRIGRAMS[result.upper_trigram]?.element || '';
    const lowerElement = TRIGRAMS[result.lower_trigram]?.element || '';

    res.json({
      number: result.number,
      name: result.name,
      upperTrigram: result.upper_trigram,
      lowerTrigram: result.lower_trigram,
      upperSymbol,
      lowerSymbol,
      upperElement,
      lowerElement,
      guaCi: result.gua_ci,
      yaoCi
    });
  } catch (error) {
    console.error('获取卦象详情错误:', error);
    res.status(500).json({ error: '获取卦象详情失败' });
  }
};
