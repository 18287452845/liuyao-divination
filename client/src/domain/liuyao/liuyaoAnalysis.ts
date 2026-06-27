// @ts-nocheck
import { FIVE_ELEMENTS, FIVE_ELEMENTS_RELATION } from './constants';
import type { FuShen, Gua, GuaDecoration } from './liuyao';

export type DivinationCategory =
  | 'wealth'
  | 'career'
  | 'relationship'
  | 'health'
  | 'exam'
  | 'lawsuit'
  | 'lost'
  | 'travel'
  | 'cooperation'
  | 'general';

export type FinalTendency = '吉' | '凶' | '平' | '先吉后凶' | '先凶后吉' | '不成' | '待时';

export interface YongShenLine {
  position: number;
  yaoName: string;
  branch: string;
  element: string;
  sixRelative: string;
  isMoving: boolean;
  isKongWang: boolean;
  state: string;
  score: number;
  notes: string[];
}

export interface YongShenResult {
  category: DivinationCategory;
  categoryLabel: string;
  primaryRelative: string;
  reason: string;
  lines: YongShenLine[];
  fuShen?: {
    position: number;
    yaoName: string;
    branch: string;
    element: string;
    relation: string;
    canComeOut: boolean;
    notes: string[];
  };
}

export interface UsefulGodLine {
  type: '原神' | '忌神' | '仇神' | '同类';
  position: number;
  yaoName: string;
  branch: string;
  element: string;
  sixRelative: string;
  isMoving: boolean;
  isKongWang: boolean;
  score: number;
  effect: string;
}

export interface ShiYingAnalysis {
  shi: {
    position: number;
    yaoName: string;
    branch: string;
    element: string;
    sixRelative: string;
    score: number;
  };
  ying: {
    position: number;
    yaoName: string;
    branch: string;
    element: string;
    sixRelative: string;
    score: number;
  };
  relation: string;
  effect: string;
}

export interface MovingLineJudgement {
  position: number;
  yaoName: string;
  sixRelative: string;
  branch: string;
  element: string;
  changeType?: string;
  isGood?: boolean;
  effectOnYongShen: string;
  scoreDelta: number;
}

export interface TimingHint {
  type: string;
  branch?: string;
  period: string;
  confidence: number;
  basis: string;
}

export interface LiuyaoJudgement {
  category: DivinationCategory;
  categoryLabel: string;
  yongShen: YongShenResult;
  shiYing: ShiYingAnalysis;
  usefulGods: UsefulGodLine[];
  movingLines: MovingLineJudgement[];
  timingHints: TimingHint[];
  totalScore: number;
  finalTendency: FinalTendency;
  confidence: number;
  reasoningSteps: string[];
}

const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

const RELATIVE_CANONICAL = Object.fromEntries([
  ['父母', '父母'],
  ['兄弟', '兄弟'],
  ['子孙', '子孙'],
  ['妻财', '妻财'],
  ['官鬼', '官鬼'],
  ['鐖舵瘝', '父母'],
  ['鍏勫紵', '兄弟'],
  ['瀛愬瓩', '子孙'],
  ['濡昏储', '妻财'],
  ['瀹橀', '官鬼'],
]) as Record<string, string>;

const ELEMENT_CANONICAL = Object.fromEntries([
  ['木', '木'],
  ['火', '火'],
  ['土', '土'],
  ['金', '金'],
  ['水', '水'],
  ['鏈', '木'],
  ['鏈?', '木'],
  ['鐏', '火'],
  ['鐏?', '火'],
  ['鍦', '土'],
  ['鍦?', '土'],
  ['閲', '金'],
  ['閲?', '金'],
  ['姘', '水'],
  ['姘?', '水'],
]) as Record<string, string>;

const STATE_SCORE: Record<string, number> = {
  旺: 3,
  相: 2,
  休: 0,
  囚: -2,
  死: -3,
  鏃: 3,
  鐩: 2,
  浼: 0,
  鍥: -2,
  姝: -3,
};

const CATEGORY_LABELS: Record<DivinationCategory, string> = {
  wealth: '求财财运',
  career: '事业功名',
  relationship: '感情婚姻',
  health: '疾病健康',
  exam: '考试文书',
  lawsuit: '诉讼是非',
  lost: '失物寻物',
  travel: '出行行人',
  cooperation: '合作交易',
  general: '泛问吉凶',
};

function normalizeRelative(value: string): string {
  return RELATIVE_CANONICAL[value] || value;
}

function normalizeElement(value: string): string {
  return ELEMENT_CANONICAL[value] || value;
}

function normalizeState(value: string): string {
  if (value.startsWith('旺') || value.startsWith('鏃')) return '旺';
  if (value.startsWith('相') || value.startsWith('鐩')) return '相';
  if (value.startsWith('休') || value.startsWith('浼')) return '休';
  if (value.startsWith('囚') || value.startsWith('鍥')) return '囚';
  if (value.startsWith('死') || value.startsWith('姝')) return '死';
  return value;
}

function isFemale(gender?: string): boolean {
  return Boolean(gender && (gender.includes('女') || gender.includes('濂')));
}

function inferCategory(question: string, explicitCategory?: string): DivinationCategory {
  const known = Object.keys(CATEGORY_LABELS) as DivinationCategory[];
  if (explicitCategory && known.includes(explicitCategory as DivinationCategory)) {
    return explicitCategory as DivinationCategory;
  }

  const q = question || '';
  if (/财|钱|收入|投资|利润|生意|项目收益|回款|薪|债|订单|客户/.test(q)) return 'wealth';
  if (/工作|事业|职位|升职|官|竞聘|创业|项目|公司|offer|面试|合作/.test(q)) return 'career';
  if (/感情|婚|恋|复合|对象|男友|女友|伴侣|夫妻|桃花/.test(q)) return 'relationship';
  if (/病|健康|手术|医院|药|身体|康复|症/.test(q)) return 'health';
  if (/考试|考研|考证|学习|论文|文书|合同|证件|申请/.test(q)) return 'exam';
  if (/官司|诉讼|纠纷|仲裁|投诉|警|处罚|是非/.test(q)) return 'lawsuit';
  if (/丢|失物|找|寻|遗失|被盗/.test(q)) return 'lost';
  if (/出行|旅行|搬家|外出|行人|归|回来|到达/.test(q)) return 'travel';
  if (/合作|交易|签约|合伙|客户|供应商|谈判/.test(q)) return 'cooperation';
  return 'general';
}

function getPrimaryRelative(category: DivinationCategory, gender?: string): { relative: string; reason: string } {
  switch (category) {
    case 'wealth':
      return { relative: '妻财', reason: '求财以妻财为用神，兼看子孙为财源、兄弟为劫财。' };
    case 'career':
      return { relative: '官鬼', reason: '事业功名以官鬼为用神，兼看父母文书与世爻承受力。' };
    case 'relationship':
      if (isFemale(gender)) {
        return { relative: '官鬼', reason: '女占感情婚姻以官鬼为夫星用神，兼看世应生合。' };
      }
      return { relative: '妻财', reason: '男占或未明性别占感情，以妻财为配偶/情缘用神，兼看世应生合。' };
    case 'health':
      return { relative: '官鬼', reason: '疾病以官鬼为病症，用神宜受制；另看子孙医药解神。' };
    case 'exam':
      return { relative: '父母', reason: '考试、文书、证件以父母为用神，兼看官鬼名位。' };
    case 'lawsuit':
      return { relative: '官鬼', reason: '诉讼是非以官鬼为官非压力，世应分主客，父母看文书证据。' };
    case 'lost':
      return { relative: '妻财', reason: '失物寻物以妻财为物，若不上卦须寻伏神。' };
    case 'travel':
      return { relative: '世爻', reason: '出行行人先看世应与动爻，世为己，应为目的地或所问之人。' };
    case 'cooperation':
      return { relative: '应爻', reason: '合作交易先看世应关系，应为对方，财爻为利益，父母为契约。' };
    default:
      return { relative: '世爻', reason: '泛问吉凶先以世爻为主，再参看动爻、用神与卦体。' };
  }
}

function getLineElement(decoration: GuaDecoration, position: number): string {
  return normalizeElement(decoration.fiveElements[position]);
}

function getLineRelative(decoration: GuaDecoration, position: number): string {
  return normalizeRelative(decoration.sixRelatives[position]);
}

function getDayElement(decoration: GuaDecoration): string | undefined {
  const branch = decoration.dayGanZhi?.slice(1);
  return normalizeElement(FIVE_ELEMENTS[branch] || '');
}

function generates(from: string, to: string): boolean {
  const source = normalizeElement(from);
  const target = normalizeElement(to);
  const next = FIVE_ELEMENTS_RELATION.generates[from as keyof typeof FIVE_ELEMENTS_RELATION.generates];
  return normalizeElement(next || '') === target || (
    (source === '木' && target === '火') ||
    (source === '火' && target === '土') ||
    (source === '土' && target === '金') ||
    (source === '金' && target === '水') ||
    (source === '水' && target === '木')
  );
}

function controls(from: string, to: string): boolean {
  const source = normalizeElement(from);
  const target = normalizeElement(to);
  const next = FIVE_ELEMENTS_RELATION.controls[from as keyof typeof FIVE_ELEMENTS_RELATION.controls];
  return normalizeElement(next || '') === target || (
    (source === '木' && target === '土') ||
    (source === '土' && target === '水') ||
    (source === '水' && target === '火') ||
    (source === '火' && target === '金') ||
    (source === '金' && target === '木')
  );
}

function relationBetween(fromElement: string, toElement: string): string {
  const from = normalizeElement(fromElement);
  const to = normalizeElement(toElement);
  if (from === to) return '比和';
  if (generates(from, to)) return '生扶';
  if (generates(to, from)) return '泄气';
  if (controls(from, to)) return '克制';
  if (controls(to, from)) return '受克';
  return '无明显生克';
}

function lineBaseScore(gua: Gua, decoration: GuaDecoration, position: number): { score: number; notes: string[] } {
  const state = normalizeState(String(decoration.yaoStates[position]?.state || '休'));
  const yaoState = decoration.yaoStates[position];
  const notes: string[] = [];
  let score = STATE_SCORE[state] ?? 0;

  notes.push(`临月为${state}`);

  if (yaoState?.isProspered) {
    score += 1;
    notes.push('得月建生旺');
  }

  if (yaoState?.isDayHelped) {
    score += 2;
    notes.push('得日辰帮扶');
  }

  if (yaoState?.isKongWang) {
    score -= 4;
    notes.push('落空亡，有而若无，待出空方能发力');
  }

  if (gua.changes[position]) {
    score += 1;
    notes.push('发动，事态有变化');
  }

  const change = decoration.changeAnalyses?.find((item) => item.position === position);
  if (change) {
    if (change.isGood) {
      score += 2;
      notes.push(`${change.changeType}，变爻助势`);
    } else {
      score -= 2;
      notes.push(`${change.changeType}，变爻减力或反伤`);
    }
  }

  return { score, notes };
}

function createYongLine(gua: Gua, decoration: GuaDecoration, position: number): YongShenLine {
  const base = lineBaseScore(gua, decoration, position);
  return {
    position,
    yaoName: YAO_NAMES[position],
    branch: decoration.earthBranches[position],
    element: getLineElement(decoration, position),
    sixRelative: getLineRelative(decoration, position),
    isMoving: gua.changes[position],
    isKongWang: Boolean(decoration.yaoStates[position]?.isKongWang),
    state: normalizeState(String(decoration.yaoStates[position]?.state || '休')),
    score: base.score,
    notes: base.notes,
  };
}

function chooseTargetPositions(
  gua: Gua,
  decoration: GuaDecoration,
  primaryRelative: string
): number[] {
  if (primaryRelative === '世爻') return [decoration.shiYing[0]];
  if (primaryRelative === '应爻') return [decoration.shiYing[1]];

  return decoration.sixRelatives
    .map((relative, index) => (normalizeRelative(relative) === primaryRelative ? index : -1))
    .filter((index) => index >= 0)
    .sort((a, b) => lineBaseScore(gua, decoration, b).score - lineBaseScore(gua, decoration, a).score);
}

function findFuShen(decoration: GuaDecoration, primaryRelative: string): YongShenResult['fuShen'] | undefined {
  const fu = decoration.fuShens?.find((item: FuShen) => normalizeRelative(item.sixRelative) === primaryRelative);
  if (!fu) return undefined;

  const notes = [
    `${primaryRelative}不上卦，取伏神参考`,
    fu.canComeOut ? '飞伏关系允许出伏，有待冲飞、出空、得生日月时发用' : '飞神压伏或伏神泄气，短期不易发挥',
  ];

  return {
    position: fu.fuPosition,
    yaoName: YAO_NAMES[fu.fuPosition],
    branch: fu.fuBranch,
    element: normalizeElement(fu.fuElement),
    relation: fu.relation,
    canComeOut: fu.canComeOut,
    notes,
  };
}

function analyzeYongShen(
  gua: Gua,
  decoration: GuaDecoration,
  question: string,
  gender?: string,
  explicitCategory?: string
): YongShenResult {
  const category = inferCategory(question, explicitCategory);
  const primary = getPrimaryRelative(category, gender);
  const positions = chooseTargetPositions(gua, decoration, primary.relative);
  const lines = positions.map((position) => createYongLine(gua, decoration, position));

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    primaryRelative: primary.relative,
    reason: primary.reason,
    lines,
    fuShen: lines.length === 0 && primary.relative !== '世爻' && primary.relative !== '应爻'
      ? findFuShen(decoration, primary.relative)
      : undefined,
  };
}

function analyzeUsefulGods(
  gua: Gua,
  decoration: GuaDecoration,
  yongElement?: string
): UsefulGodLine[] {
  if (!yongElement) return [];

  const usefulGods: UsefulGodLine[] = [];
  const normalizedYong = normalizeElement(yongElement);

  for (let position = 0; position < 6; position++) {
    const element = getLineElement(decoration, position);
    const relative = getLineRelative(decoration, position);
    const base = lineBaseScore(gua, decoration, position);
    let type: UsefulGodLine['type'] | null = null;
    let effect = '';

    if (generates(element, normalizedYong)) {
      type = '原神';
      effect = '生扶用神，为成事之源';
    } else if (controls(element, normalizedYong)) {
      type = '忌神';
      effect = '克制用神，为主要阻力';
    } else if (element === normalizedYong) {
      type = '同类';
      effect = '同气相扶，可补用神之力';
    } else {
      const originalElement = ['木', '火', '土', '金', '水'].find((item) => generates(item, normalizedYong));
      const hostileElement = ['木', '火', '土', '金', '水'].find((item) => controls(item, normalizedYong));
      if ((originalElement && controls(element, originalElement)) || (hostileElement && generates(element, hostileElement))) {
        type = '仇神';
        effect = '损原神或助忌神，间接不利用神';
      }
    }

    if (type) {
      usefulGods.push({
        type,
        position,
        yaoName: YAO_NAMES[position],
        branch: decoration.earthBranches[position],
        element,
        sixRelative: relative,
        isMoving: gua.changes[position],
        isKongWang: Boolean(decoration.yaoStates[position]?.isKongWang),
        score: base.score,
        effect,
      });
    }
  }

  return usefulGods.sort((a, b) => {
    const order = ['原神', '忌神', '仇神', '同类'];
    return order.indexOf(a.type) - order.indexOf(b.type) || b.score - a.score;
  });
}

function analyzeShiYing(gua: Gua, decoration: GuaDecoration): ShiYingAnalysis {
  const [shiPosition, yingPosition] = decoration.shiYing;
  const shiScore = lineBaseScore(gua, decoration, shiPosition).score;
  const yingScore = lineBaseScore(gua, decoration, yingPosition).score;
  const shiElement = getLineElement(decoration, shiPosition);
  const yingElement = getLineElement(decoration, yingPosition);
  const relation = relationBetween(shiElement, yingElement);

  let effect = '世应关系平常，须回到用神与动爻综合判断。';
  if (relation === '生扶') effect = '世生应，自己主动付出，成事需耗力。';
  if (relation === '泄气') effect = '应生世，对方或外部条件较能助己。';
  if (relation === '克制') effect = '世克应，自己能制约对方，但也易形成压力。';
  if (relation === '受克') effect = '应克世，外部压力较重，自己较被动。';
  if (relation === '比和') effect = '世应比和，双方同气，成败取决于旺衰与动爻。';

  return {
    shi: {
      position: shiPosition,
      yaoName: YAO_NAMES[shiPosition],
      branch: decoration.earthBranches[shiPosition],
      element: shiElement,
      sixRelative: getLineRelative(decoration, shiPosition),
      score: shiScore,
    },
    ying: {
      position: yingPosition,
      yaoName: YAO_NAMES[yingPosition],
      branch: decoration.earthBranches[yingPosition],
      element: yingElement,
      sixRelative: getLineRelative(decoration, yingPosition),
      score: yingScore,
    },
    relation,
    effect,
  };
}

function analyzeMovingLines(gua: Gua, decoration: GuaDecoration, yongElement?: string): MovingLineJudgement[] {
  const moving: MovingLineJudgement[] = [];

  for (let position = 0; position < 6; position++) {
    if (!gua.changes[position]) continue;

    const element = getLineElement(decoration, position);
    const change = decoration.changeAnalyses?.find((item) => item.position === position);
    let effectOnYongShen = '动爻发动，主事情已有变化。';
    let scoreDelta = 0;

    if (yongElement) {
      if (generates(element, yongElement)) {
        effectOnYongShen = '动爻生扶用神，为助力。';
        scoreDelta += 2;
      } else if (controls(element, yongElement)) {
        effectOnYongShen = '动爻克制用神，为阻力。';
        scoreDelta -= 3;
      } else if (generates(yongElement, element)) {
        effectOnYongShen = '用神生动爻，主用神泄气。';
        scoreDelta -= 1;
      } else if (controls(yongElement, element)) {
        effectOnYongShen = '用神克动爻，能制其事，但耗力。';
        scoreDelta += 0;
      } else if (normalizeElement(element) === normalizeElement(yongElement)) {
        effectOnYongShen = '动爻与用神同气，可为帮扶。';
        scoreDelta += 1;
      }
    }

    if (change) {
      scoreDelta += change.isGood ? 1 : -1;
    }

    moving.push({
      position,
      yaoName: YAO_NAMES[position],
      sixRelative: getLineRelative(decoration, position),
      branch: decoration.earthBranches[position],
      element,
      changeType: change?.changeType,
      isGood: change?.isGood,
      effectOnYongShen,
      scoreDelta,
    });
  }

  return moving;
}

function buildTimingHints(decoration: GuaDecoration, yongLines: YongShenLine[], movingLines: MovingLineJudgement[]): TimingHint[] {
  const hints: TimingHint[] = [];

  for (const yong of yongLines) {
    if (yong.isKongWang) {
      hints.push({
        type: '出空',
        branch: yong.branch,
        period: `${yong.branch}日、${yong.branch}月或逢冲填实之时`,
        confidence: 0.62,
        basis: '用神空亡，须待出空或冲实后才能发力。',
      });
    }
  }

  for (const moving of movingLines) {
    hints.push({
      type: '动爻值日',
      branch: moving.branch,
      period: `${moving.branch}日或${moving.branch}月`,
      confidence: 0.58,
      basis: '动爻为变化枢纽，常以动爻地支值日值月为应期。',
    });
  }

  for (const item of decoration.yingQi || []) {
    if (!hints.some((hint) => hint.period === item.period)) {
      hints.push({
        type: item.type,
        branch: item.specificBranches?.[0],
        period: item.period,
        confidence: item.confidence === '高' ? 0.7 : item.confidence === '中' ? 0.55 : 0.4,
        basis: item.basis?.join('；') || item.description,
      });
    }
  }

  return hints.slice(0, 5);
}

function calculateTotalScore(
  category: DivinationCategory,
  yongLines: YongShenLine[],
  fuShen: YongShenResult['fuShen'],
  usefulGods: UsefulGodLine[],
  movingLines: MovingLineJudgement[],
  shiYing: ShiYingAnalysis,
  decoration: GuaDecoration
): number {
  let score = 0;

  if (yongLines.length > 0) {
    score += yongLines[0].score;
  } else if (fuShen) {
    score += fuShen.canComeOut ? -1 : -4;
  } else {
    score -= 3;
  }

  for (const god of usefulGods) {
    if (god.type === '原神' && god.isMoving && !god.isKongWang) score += 2;
    if (god.type === '忌神' && god.isMoving && !god.isKongWang) score -= 3;
    if (god.type === '忌神' && god.isKongWang) score += 1;
    if (god.type === '仇神' && god.isMoving && !god.isKongWang) score -= 1;
  }

  score += movingLines.reduce((sum, item) => sum + item.scoreDelta, 0);

  if (shiYing.relation === '受克') score -= 1;
  if (shiYing.relation === '泄气') score += 1;
  if (shiYing.relation === '比和') score += 0.5;
  if (shiYing.shi.score - shiYing.ying.score >= 3) score += 1;
  if (shiYing.ying.score - shiYing.shi.score >= 3) score -= 1;

  const hasLiuHe = decoration.yaoRelations?.some((item) => item.type === '六合');
  const hasLiuChong = decoration.yaoRelations?.some((item) => item.type === '六冲');
  if (hasLiuHe) score += 0.5;
  if (hasLiuChong) score -= 0.5;

  if (category === 'health') {
    // 疾病占以官鬼为病，用神太旺反主病势重，子孙发动克鬼为喜。
    const childMoving = usefulGods.some((item) => item.sixRelative === '子孙' && item.isMoving && !item.isKongWang);
    if (yongLines[0]?.score >= 4) score -= 2;
    if (childMoving) score += 3;
  }

  return Math.round(score * 10) / 10;
}

function finalFromScore(score: number, yongLines: YongShenLine[], movingLines: MovingLineJudgement[]): FinalTendency {
  const yong = yongLines[0];

  if (yong?.isKongWang && score > -1 && score < 4) return '待时';
  if (score >= 5) return movingLines.some((item) => item.scoreDelta < -1) ? '先吉后凶' : '吉';
  if (score >= 2) return movingLines.some((item) => item.scoreDelta < -2) ? '先吉后凶' : '先凶后吉';
  if (score > -2) return '平';
  if (score > -5) return movingLines.some((item) => item.scoreDelta > 1) ? '先凶后吉' : '不成';
  return '凶';
}

function confidenceFromEvidence(yongLines: YongShenLine[], movingLines: MovingLineJudgement[], usefulGods: UsefulGodLine[]): number {
  let confidence = 0.45;
  if (yongLines.length > 0) confidence += 0.18;
  if (movingLines.length === 1) confidence += 0.08;
  if (movingLines.length > 1) confidence += 0.04;
  if (usefulGods.some((item) => item.type === '原神')) confidence += 0.06;
  if (usefulGods.some((item) => item.type === '忌神')) confidence += 0.06;
  if (yongLines[0]?.isKongWang) confidence -= 0.08;
  return Math.max(0.25, Math.min(0.85, Math.round(confidence * 100) / 100));
}

function buildReasoningSteps(
  judgement: Omit<LiuyaoJudgement, 'reasoningSteps'>
): string[] {
  const steps: string[] = [];
  const yong = judgement.yongShen.lines[0];

  steps.push(`本占归类为${judgement.categoryLabel}，${judgement.yongShen.reason}`);

  if (yong) {
    steps.push(`用神${judgement.yongShen.primaryRelative}落${yong.yaoName}${yong.branch}${yong.element}，${yong.notes.join('，')}，用神评分为${yong.score}。`);
  } else if (judgement.yongShen.fuShen) {
    steps.push(`用神${judgement.yongShen.primaryRelative}不上卦，取伏神：伏于${judgement.yongShen.fuShen.yaoName}${judgement.yongShen.fuShen.branch}${judgement.yongShen.fuShen.element}，${judgement.yongShen.fuShen.notes.join('，')}。`);
  } else {
    steps.push(`用神${judgement.yongShen.primaryRelative}不明或不上卦且无可用伏神，卦证不足，不宜武断。`);
  }

  const original = judgement.usefulGods.filter((item) => item.type === '原神').slice(0, 2);
  const hostile = judgement.usefulGods.filter((item) => item.type === '忌神').slice(0, 2);

  if (original.length > 0) {
    steps.push(`原神见${original.map((item) => `${item.yaoName}${item.branch}${item.element}${item.isMoving ? '发动' : ''}`).join('、')}，${original.some((item) => item.isMoving && !item.isKongWang) ? '能生扶用神' : '需看旺衰动静方能发力'}。`);
  }

  if (hostile.length > 0) {
    steps.push(`忌神见${hostile.map((item) => `${item.yaoName}${item.branch}${item.element}${item.isMoving ? '发动' : ''}`).join('、')}，${hostile.some((item) => item.isMoving && !item.isKongWang) ? '对用神构成实质压力' : '虽有阻力但未必成害'}。`);
  }

  if (judgement.movingLines.length > 0) {
    steps.push(`卦中${judgement.movingLines.length}爻发动：${judgement.movingLines.map((item) => `${item.yaoName}${item.sixRelative}${item.branch}，${item.effectOnYongShen}${item.changeType ? `，${item.changeType}` : ''}`).join('；')}。`);
  } else {
    steps.push('本卦无动爻，为静卦，重点看用神旺衰、月日生克与世应关系。');
  }

  steps.push(`世爻在${judgement.shiYing.shi.yaoName}${judgement.shiYing.shi.branch}${judgement.shiYing.shi.element}，应爻在${judgement.shiYing.ying.yaoName}${judgement.shiYing.ying.branch}${judgement.shiYing.ying.element}，世应关系为${judgement.shiYing.relation}：${judgement.shiYing.effect}`);

  if (judgement.timingHints.length > 0) {
    steps.push(`应期参考：${judgement.timingHints.map((item) => `${item.type}${item.branch ? `(${item.branch})` : ''}：${item.period}`).join('；')}。`);
  }

  steps.push(`综合评分${judgement.totalScore}，倾向判断为${judgement.finalTendency}，置信度${Math.round(judgement.confidence * 100)}%。`);

  return steps;
}

export function analyzeLiuyaoJudgement(params: {
  gua: Gua;
  decoration: GuaDecoration;
  question: string;
  gender?: string;
  category?: string;
}): LiuyaoJudgement {
  const { gua, decoration, question, gender, category } = params;
  const yongShen = analyzeYongShen(gua, decoration, question, gender, category);
  const yongElement = yongShen.lines[0]?.element || yongShen.fuShen?.element;
  const usefulGods = analyzeUsefulGods(gua, decoration, yongElement);
  const shiYing = analyzeShiYing(gua, decoration);
  const movingLines = analyzeMovingLines(gua, decoration, yongElement);
  const timingHints = buildTimingHints(decoration, yongShen.lines, movingLines);
  const totalScore = calculateTotalScore(
    yongShen.category,
    yongShen.lines,
    yongShen.fuShen,
    usefulGods,
    movingLines,
    shiYing,
    decoration
  );
  const finalTendency = finalFromScore(totalScore, yongShen.lines, movingLines);
  const confidence = confidenceFromEvidence(yongShen.lines, movingLines, usefulGods);

  const judgementWithoutSteps = {
    category: yongShen.category,
    categoryLabel: yongShen.categoryLabel,
    yongShen,
    shiYing,
    usefulGods,
    movingLines,
    timingHints,
    totalScore,
    finalTendency,
    confidence,
  };

  return {
    ...judgementWithoutSteps,
    reasoningSteps: buildReasoningSteps(judgementWithoutSteps),
  };
}
