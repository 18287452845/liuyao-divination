const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Lunar } = require('lunar-javascript');

const {
  decorateGua,
  divinationByInput,
  divinationByManual,
  divinationByNumbers,
  divinationByTime,
  generateBianGua,
} = require('../dist/utils/liuyao');
const {
  GUA_NAMES,
  SHI_YING_POSITIONS,
  SIX_SPIRITS,
  SIX_SPIRIT_START_BY_DAY_STEM,
  TRIGRAM_ORDER,
  TRIGRAMS,
  ADVANCING_BRANCHES,
  RETREATING_BRANCHES,
} = require('../dist/utils/constants');
const {
  GUA_PALACE_MAP,
  getGuaPalace,
  getShiYingPositions,
} = require('../dist/utils/bagong');

const STATIC_GUA = divinationByInput(
  [1, 1, 1, 1, 1, 1],
  [false, false, false, false, false, false]
);

test('时间起卦使用年支数和正确的子时边界', () => {
  const midnight = divinationByTime(new Date(2024, 1, 10, 0, 0, 0));
  const lateZiHour = divinationByTime(new Date(2024, 1, 10, 23, 0, 0));
  const chouHour = divinationByTime(new Date(2024, 1, 10, 1, 0, 0));

  assert.equal(midnight.name, '山地剥');
  assert.deepEqual(midnight.trigrams, { upper: '艮', lower: '坤' });
  assert.equal(midnight.changes.findIndex(Boolean), 1);
  assert.deepEqual(lateZiHour, midnight);
  assert.equal(chouHour.name, '山天大畜');
  assert.equal(chouHour.changes.findIndex(Boolean), 2);
});

test('数字、摇卦和手工输入在算法边界拒绝非法数据', () => {
  assert.throws(() => divinationByNumbers(0, 2, 3), RangeError);
  assert.throws(() => divinationByNumbers(1.5, 2, 3), RangeError);
  assert.throws(() => divinationByNumbers(Number.NaN, 2, 3), RangeError);
  assert.throws(() => divinationByManual([7, 7, 7]), RangeError);
  assert.throws(() => divinationByManual([7, 7, 7, 8, 8, 10]), RangeError);
  assert.throws(() => divinationByInput([1, 1, 1, 1, 1], Array(6).fill(false)), RangeError);
  assert.throws(() => divinationByInput([1, 1, 1, 1, 1, 2], Array(6).fill(false)), RangeError);
  assert.throws(() => divinationByInput(Array(6).fill(1), [false, false, false, false, false, 0]), RangeError);
  assert.throws(() => divinationByTime(new Date(Number.NaN)), RangeError);
});

test('爻象是卦名和上下卦的唯一事实源', () => {
  const tai = divinationByManual([7, 7, 7, 8, 8, 8]);
  assert.equal(tai.name, '地天泰');
  assert.deepEqual(tai.trigrams, { upper: '坤', lower: '乾' });
  assert.equal(generateBianGua(tai), null);

  const moving = divinationByManual([9, 7, 7, 8, 8, 6]);
  const originalLines = [...moving.lines];
  const bianGua = generateBianGua(moving);
  assert.ok(bianGua);
  assert.deepEqual(moving.lines, originalLines, '生成变卦不应修改本卦');
  assert.equal(bianGua.lines[0], 0);
  assert.equal(bianGua.lines[5], 1);
  assert.ok(bianGua.changes.every(change => !change));
});

test('六神按日干起例', () => {
  const seenStems = new Set();

  for (let offset = 0; offset < 10; offset++) {
    const date = new Date(2024, 0, 1 + offset, 12, 0, 0);
    const dayStem = Lunar.fromDate(date).getDayGan();
    const decoration = decorateGua(STATIC_GUA, date);
    const start = SIX_SPIRIT_START_BY_DAY_STEM[dayStem];

    seenStems.add(dayStem);
    assert.equal(decoration.sixSpirits[0], SIX_SPIRITS[start], `${dayStem}日六神起例错误`);
    assert.deepEqual(
      decoration.sixSpirits,
      Array.from({ length: 6 }, (_, index) => SIX_SPIRITS[(start + index) % 6])
    );
  }

  assert.equal(seenStems.size, 10);
});

test('月建以节气交节为界，空亡与历法库的日旬空一致', () => {
  const boundaryDate = new Date(2024, 0, 6, 0, 0, 0);
  const boundaryLunar = Lunar.fromDate(boundaryDate);
  const boundaryDecoration = decorateGua(STATIC_GUA, boundaryDate);

  assert.notEqual(boundaryLunar.getMonthZhi(), boundaryLunar.getMonthZhiExact());
  assert.equal(boundaryDecoration.monthBranch, boundaryLunar.getMonthZhiExact());
  assert.equal(boundaryDecoration.monthConstruction, boundaryLunar.getMonthInGanZhiExact());

  for (let offset = 0; offset < 60; offset++) {
    const date = new Date(2024, 0, 1 + offset, 12, 0, 0);
    const lunar = Lunar.fromDate(date);
    const decoration = decorateGua(STATIC_GUA, date);
    assert.equal(decoration.kongWang.join(''), lunar.getDayXunKong(), lunar.getDayInGanZhi());
  }
});

test('化进化退只按六爻固定地支配对判定', () => {
  let advancingCount = 0;
  let retreatingCount = 0;

  for (let mask = 0; mask < 64; mask++) {
    const lines = Array.from({ length: 6 }, (_, position) => (mask >> position) & 1);
    for (let position = 0; position < 6; position++) {
      const changes = Array(6).fill(false);
      changes[position] = true;
      const gua = divinationByInput(lines, changes);
      const analysis = decorateGua(gua, new Date(2024, 0, 1, 12, 0, 0)).changeAnalyses[0];

      if (analysis.changeType === '化进') {
        advancingCount++;
        assert.equal(ADVANCING_BRANCHES[analysis.originalBranch], analysis.changedBranch);
      }
      if (analysis.changeType === '化退') {
        retreatingCount++;
        assert.equal(RETREATING_BRANCHES[analysis.originalBranch], analysis.changedBranch);
      }
    }
  }

  assert.ok(advancingCount > 0);
  assert.ok(retreatingCount > 0);
});

test('六十四卦名、八宫归属和世应位置完整一致', () => {
  const guaNames = GUA_NAMES.flat();
  assert.equal(new Set(guaNames).size, 64);
  assert.deepEqual(Object.keys(GUA_PALACE_MAP).sort(), [...guaNames].sort());

  const palacePositions = new Map();
  for (const [guaName, info] of Object.entries(GUA_PALACE_MAP)) {
    assert.deepEqual([info.worldYao, info.responseYao], SHI_YING_POSITIONS[info.position], guaName);
    assert.deepEqual(getShiYingPositions(guaName), SHI_YING_POSITIONS[info.position]);
    assert.equal(getGuaPalace(guaName), info.palace);
    const positions = palacePositions.get(info.palace) || [];
    positions.push(info.position);
    palacePositions.set(info.palace, positions);
  }

  assert.equal(palacePositions.size, 8);
  for (const positions of palacePositions.values()) {
    assert.deepEqual(positions.sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7]);
  }
  assert.throws(() => getShiYingPositions('不存在的卦'), RangeError);
});

test('八卦数序与六十四卦矩阵可双向重建', () => {
  for (let upperIndex = 0; upperIndex < TRIGRAM_ORDER.length; upperIndex++) {
    for (let lowerIndex = 0; lowerIndex < TRIGRAM_ORDER.length; lowerIndex++) {
      const upper = TRIGRAM_ORDER[upperIndex];
      const lower = TRIGRAM_ORDER[lowerIndex];
      const lines = [
        ...[...TRIGRAMS[lower].lines].reverse(),
        ...[...TRIGRAMS[upper].lines].reverse(),
      ];
      const gua = divinationByInput(lines, Array(6).fill(false));
      assert.equal(gua.name, GUA_NAMES[upperIndex][lowerIndex]);
      assert.deepEqual(gua.trigrams, { upper, lower });
    }
  }
});
