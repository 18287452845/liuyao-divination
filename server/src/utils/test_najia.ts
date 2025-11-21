/**
 * 纳甲装卦正确性验证
 *
 * 对照《卜筮正宗》和《增删卜易》中的标准卦例进行验证
 */

import { decorateGua, divinationByInput } from './liuyao';
import { getGuaPalaceInfo } from './bagong';

// 测试用例1：乾为天（乾宫本宫卦）
function testQianWeiTian() {
  console.log('\n========== 测试1：乾为天 ==========');

  // 创建乾为天卦：六爻皆阳，无动爻
  const gua = divinationByInput(
    [1, 1, 1, 1, 1, 1],  // 六爻皆阳
    [false, false, false, false, false, false]  // 无动爻
  );

  console.log('卦名:', gua.name);
  console.log('上卦:', gua.trigrams.upper, '下卦:', gua.trigrams.lower);

  // 装卦
  const decoration = decorateGua(gua, new Date());

  // 验证结果
  console.log('\n装卦结果：');
  console.log('爻位\t纳甲\t\t地支\t五行\t六亲\t世应');
  for (let i = 5; i >= 0; i--) {
    const yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
    const najia = decoration.heavenlyStems[i] + decoration.earthBranches[i];
    const wuxing = decoration.fiveElements[i];
    const liuqin = decoration.sixRelatives[i];
    const shiying = decoration.shiYing[0] === i ? '世' :
                    (decoration.shiYing[1] === i ? '应' : '');

    console.log(`${yaoName}\t${najia}\t\t${decoration.earthBranches[i]}\t${wuxing}\t${liuqin}\t${shiying}`);
  }

  // 标准答案（来自《卜筮正宗》）
  console.log('\n标准答案：');
  console.log('上爻\t甲戌\t\t戌\t土\t父母\t世');
  console.log('五爻\t甲申\t\t申\t金\t兄弟');
  console.log('四爻\t甲午\t\t午\t火\t官鬼');
  console.log('三爻\t甲辰\t\t辰\t土\t父母\t应');
  console.log('二爻\t甲寅\t\t寅\t木\t妻财');
  console.log('初爻\t甲子\t\t子\t水\t子孙');

  // 验证
  const isCorrect =
    decoration.heavenlyStems[5] === '甲' && decoration.earthBranches[5] === '戌' &&
    decoration.heavenlyStems[4] === '甲' && decoration.earthBranches[4] === '申' &&
    decoration.heavenlyStems[3] === '甲' && decoration.earthBranches[3] === '午' &&
    decoration.heavenlyStems[2] === '甲' && decoration.earthBranches[2] === '辰' &&
    decoration.heavenlyStems[1] === '甲' && decoration.earthBranches[1] === '寅' &&
    decoration.heavenlyStems[0] === '甲' && decoration.earthBranches[0] === '子' &&
    decoration.shiYing[0] === 5 && decoration.shiYing[1] === 2;  // 世在上爻，应在三爻

  console.log('\n验证结果:', isCorrect ? '✅ 通过' : '❌ 失败');
  return isCorrect;
}

// 测试用例2：天风姤（乾宫一世卦）
function testTianFengGou() {
  console.log('\n========== 测试2：天风姤 ==========');

  // 创建天风姤卦：上卦乾（三阳），下卦巽（上二阳下一阴）
  const gua = divinationByInput(
    [0, 1, 1, 1, 1, 1],  // 初爻阴，其余阳
    [false, false, false, false, false, false]  // 无动爻
  );

  console.log('卦名:', gua.name);
  console.log('上卦:', gua.trigrams.upper, '下卦:', gua.trigrams.lower);

  // 获取卦宫信息
  const palaceInfo = getGuaPalaceInfo(gua.name);
  console.log('卦宫:', palaceInfo?.palace, '卦序:', palaceInfo?.type);

  // 装卦
  const decoration = decorateGua(gua, new Date());

  // 验证结果
  console.log('\n装卦结果：');
  console.log('爻位\t纳甲\t\t地支\t五行\t六亲\t世应');
  for (let i = 5; i >= 0; i--) {
    const yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
    const najia = decoration.heavenlyStems[i] + decoration.earthBranches[i];
    const wuxing = decoration.fiveElements[i];
    const liuqin = decoration.sixRelatives[i];
    const shiying = decoration.shiYing[0] === i ? '世' :
                    (decoration.shiYing[1] === i ? '应' : '');

    console.log(`${yaoName}\t${najia}\t\t${decoration.earthBranches[i]}\t${wuxing}\t${liuqin}\t${shiying}`);
  }

  // 标准答案（来自《卜筮正宗》）
  console.log('\n标准答案：');
  console.log('上爻\t甲戌\t\t戌\t土\t父母');
  console.log('五爻\t甲申\t\t申\t金\t兄弟');
  console.log('四爻\t甲午\t\t午\t火\t官鬼\t应');
  console.log('三爻\t辛酉\t\t酉\t金\t兄弟');
  console.log('二爻\t辛亥\t\t亥\t水\t子孙\t世');
  console.log('初爻\t辛丑\t\t丑\t土\t父母');

  // 验证
  const isCorrect =
    decoration.heavenlyStems[5] === '甲' && decoration.earthBranches[5] === '戌' &&
    decoration.heavenlyStems[4] === '甲' && decoration.earthBranches[4] === '申' &&
    decoration.heavenlyStems[3] === '甲' && decoration.earthBranches[3] === '午' &&
    decoration.heavenlyStems[2] === '辛' && decoration.earthBranches[2] === '酉' &&
    decoration.heavenlyStems[1] === '辛' && decoration.earthBranches[1] === '亥' &&
    decoration.heavenlyStems[0] === '辛' && decoration.earthBranches[0] === '丑' &&
    decoration.shiYing[0] === 1 && decoration.shiYing[1] === 3;  // 世在二爻，应在四爻（一世卦）

  console.log('\n验证结果:', isCorrect ? '✅ 通过' : '❌ 失败');
  return isCorrect;
}

// 测试用例3：坤为地（坤宫本宫卦）
function testKunWeiDi() {
  console.log('\n========== 测试3：坤为地 ==========');

  // 创建坤为地卦：六爻皆阴
  const gua = divinationByInput(
    [0, 0, 0, 0, 0, 0],  // 六爻皆阴
    [false, false, false, false, false, false]  // 无动爻
  );

  console.log('卦名:', gua.name);
  console.log('上卦:', gua.trigrams.upper, '下卦:', gua.trigrams.lower);

  // 装卦
  const decoration = decorateGua(gua, new Date());

  // 验证结果
  console.log('\n装卦结果：');
  console.log('爻位\t纳甲\t\t地支\t五行\t六亲\t世应');
  for (let i = 5; i >= 0; i--) {
    const yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
    const najia = decoration.heavenlyStems[i] + decoration.earthBranches[i];
    const wuxing = decoration.fiveElements[i];
    const liuqin = decoration.sixRelatives[i];
    const shiying = decoration.shiYing[0] === i ? '世' :
                    (decoration.shiYing[1] === i ? '应' : '');

    console.log(`${yaoName}\t${najia}\t\t${decoration.earthBranches[i]}\t${wuxing}\t${liuqin}\t${shiying}`);
  }

  // 标准答案（来自《卜筮正宗》）
  console.log('\n标准答案：');
  console.log('上爻\t乙酉\t\t酉\t金\t子孙\t世');
  console.log('五爻\t乙亥\t\t亥\t水\t父母');
  console.log('四爻\t乙丑\t\t丑\t土\t兄弟');
  console.log('三爻\t乙卯\t\t卯\t木\t官鬼\t应');
  console.log('二爻\t乙巳\t\t巳\t火\t妻财');
  console.log('初爻\t乙未\t\t未\t土\t兄弟');

  // 验证
  const isCorrect =
    decoration.heavenlyStems[5] === '乙' && decoration.earthBranches[5] === '酉' &&
    decoration.heavenlyStems[4] === '乙' && decoration.earthBranches[4] === '亥' &&
    decoration.heavenlyStems[3] === '乙' && decoration.earthBranches[3] === '丑' &&
    decoration.heavenlyStems[2] === '乙' && decoration.earthBranches[2] === '卯' &&
    decoration.heavenlyStems[1] === '乙' && decoration.earthBranches[1] === '巳' &&
    decoration.heavenlyStems[0] === '乙' && decoration.earthBranches[0] === '未' &&
    decoration.shiYing[0] === 5 && decoration.shiYing[1] === 2;  // 世在上爻，应在三爻

  console.log('\n验证结果:', isCorrect ? '✅ 通过' : '❌ 失败');
  return isCorrect;
}

// 运行所有测试
export function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    纳甲装卦正确性验证测试              ║');
  console.log('╚════════════════════════════════════════╝');

  const test1 = testQianWeiTian();
  const test2 = testTianFengGou();
  const test3 = testKunWeiDi();

  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║            测试总结                    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('测试1（乾为天）:', test1 ? '✅ 通过' : '❌ 失败');
  console.log('测试2（天风姤）:', test2 ? '✅ 通过' : '❌ 失败');
  console.log('测试3（坤为地）:', test3 ? '✅ 通过' : '❌ 失败');

  const allPassed = test1 && test2 && test3;
  console.log('\n总体结果:', allPassed ? '✅ 全部通过' : '❌ 存在失败');

  return allPassed;
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests();
}
