// 测试lunar-javascript节气API - 第2轮
const { Lunar } = require('lunar-javascript');

const today = new Date();
console.log('测试日期:', today.toLocaleDateString());

const lunar = Lunar.fromDate(today);

console.log('\n=== 测试更多节气方法 ===');

// 列出所有方法
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(lunar));
console.log('所有包含Jie/Qi/Prev的方法:');
const relevantMethods = methods.filter(m =>
  m.toLowerCase().includes('jie') ||
  m.toLowerCase().includes('qi') ||
  m.toLowerCase().includes('prev') ||
  m.toLowerCase().includes('current')
);
console.log(relevantMethods);

// 测试每个方法
relevantMethods.forEach(method => {
  try {
    console.log(`\n${method}():`);
    const result = lunar[method]();
    if (result && typeof result === 'object') {
      if (result.getName) {
        console.log('  名称:', result.getName());
      }
      if (result.getSolar) {
        const solar = result.getSolar();
        console.log('  日期:', solar.toYmd());
      }
    } else {
      console.log('  结果:', result);
    }
  } catch (e) {
    console.log('  错误:', e.message);
  }
});

// 测试获取所有节气
console.log('\n=== 测试年度节气 ===');
try {
  const jieqiTable = lunar.getJieQiTable();
  console.log('getJieQiTable():', jieqiTable);
} catch (e) {
  console.log('错误:', e.message);
}

// 尝试从当前日期往前查找节气
console.log('\n=== 测试查找当前所处节气 ===');
try {
  // 获取前一个节
  const prevJie = lunar.getPrevJie();
  if (prevJie) {
    console.log('前一个节:', prevJie.getName());
    console.log('日期:', prevJie.getSolar().toYmd());
  }
} catch (e) {
  console.log('getPrevJie错误:', e.message);
}

try {
  // 获取前一个气
  const prevQi = lunar.getPrevQi();
  if (prevQi) {
    console.log('前一个气:', prevQi.getName());
    console.log('日期:', prevQi.getSolar().toYmd());
  }
} catch (e) {
  console.log('getPrevQi错误:', e.message);
}

// 综合信息
console.log('\n=== 当前节气信息总结 ===');
const prevJie = lunar.getPrevJie();
const nextJie = lunar.getNextJie();
const prevQi = lunar.getPrevQi();
const nextQi = lunar.getNextQi();

if (prevJie) {
  console.log(`前一个节: ${prevJie.getName()} (${prevJie.getSolar().toYmd()})`);
}
if (nextJie) {
  console.log(`下一个节: ${nextJie.getName()} (${nextJie.getSolar().toYmd()})`);
}
if (prevQi) {
  console.log(`前一个气: ${prevQi.getName()} (${prevQi.getSolar().toYmd()})`);
}
if (nextQi) {
  console.log(`下一个气: ${nextQi.getName()} (${nextQi.getSolar().toYmd()})`);
}

// 判断当前所处的节气
if (prevJie && nextJie) {
  const prevJieDate = new Date(prevJie.getSolar().toYmd());
  const nextJieDate = new Date(nextJie.getSolar().toYmd());

  if (today >= prevJieDate && today < nextJieDate) {
    console.log(`\n当前所处节气: ${prevJie.getName()}`);
  }
}
