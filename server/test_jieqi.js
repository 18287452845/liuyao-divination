// 测试lunar-javascript节气API
const { Lunar, Solar } = require('lunar-javascript');

// 测试今天的日期
const today = new Date();
console.log('测试日期:', today.toLocaleDateString());

// 创建Lunar对象
const lunar = Lunar.fromDate(today);
console.log('\n农历对象创建成功');

// 测试各种方法
console.log('\n=== 基本信息 ===');
console.log('年干支:', lunar.getYearInGanZhi());
console.log('月干支:', lunar.getMonthInGanZhi());
console.log('日干支:', lunar.getDayInGanZhi());

// 尝试获取节气
console.log('\n=== 节气相关方法测试 ===');

// 列出所有可用方法
console.log('\nLunar对象的所有方法:');
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(lunar));
const jieqiMethods = methods.filter(m =>
  m.toLowerCase().includes('jie') ||
  m.toLowerCase().includes('qi') ||
  m.toLowerCase().includes('solar') ||
  m.toLowerCase().includes('term')
);
console.log('可能与节气相关的方法:', jieqiMethods);

// 尝试一些可能的方法
try {
  console.log('\n尝试 getJieQi():');
  const jieqi = lunar.getJieQi();
  console.log('结果:', jieqi);
} catch (e) {
  console.log('错误:', e.message);
}

try {
  console.log('\n尝试 getCurrentJieQi():');
  const currentJieQi = lunar.getCurrentJieQi();
  console.log('结果:', currentJieQi);
  if (currentJieQi) {
    console.log('getName():', currentJieQi.getName());
  }
} catch (e) {
  console.log('错误:', e.message);
}

try {
  console.log('\n尝试 getNextJie():');
  const nextJie = lunar.getNextJie();
  console.log('结果:', nextJie);
  if (nextJie) {
    console.log('getName():', nextJie.getName());
    console.log('getSolar():', nextJie.getSolar());
  }
} catch (e) {
  console.log('错误:', e.message);
}

try {
  console.log('\n尝试 getNextQi():');
  const nextQi = lunar.getNextQi();
  console.log('结果:', nextQi);
  if (nextQi) {
    console.log('getName():', nextQi.getName());
  }
} catch (e) {
  console.log('错误:', e.message);
}

// 测试Solar对象
console.log('\n=== Solar对象测试 ===');
const solar = Solar.fromDate(today);
console.log('Solar对象创建成功');

const solarMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(solar));
const solarJieqiMethods = solarMethods.filter(m =>
  m.toLowerCase().includes('jie') ||
  m.toLowerCase().includes('qi') ||
  m.toLowerCase().includes('term')
);
console.log('Solar可能与节气相关的方法:', solarJieqiMethods);

try {
  console.log('\n尝试 Solar.getJieQi():');
  const sjieqi = solar.getJieQi();
  console.log('结果:', sjieqi);
} catch (e) {
  console.log('错误:', e.message);
}

// 测试JieQi类
console.log('\n=== 尝试直接使用JieQi ===');
try {
  const { JieQi } = require('lunar-javascript');
  console.log('JieQi类存在');

  // 尝试获取某个日期的节气
  const jieqi = JieQi.fromYmd(2024, 2, 4); // 2024年立春
  console.log('JieQi对象:', jieqi);
} catch (e) {
  console.log('错误:', e.message);
}
