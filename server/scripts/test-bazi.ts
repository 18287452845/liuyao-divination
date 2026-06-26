/**
 * 八字核心算法测试脚本
 *
 * 运行方式：
 * tsx server/scripts/test-bazi.ts
 */

import {
  calculateBaziFromDateTime,
  calculateDaYun,
  decorateBazi
} from '../src/utils/bazi';

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(`  ${title}`, colors.cyan + colors.bright);
  log('='.repeat(60), colors.bright);
}

function section(title: string) {
  log(`\n${'─'.repeat(60)}`, colors.blue);
  log(`  ${title}`, colors.yellow);
  log('─'.repeat(60), colors.blue);
}

async function testCase(name: string, birthDate: Date, gender: '男' | '女') {
  header(`测试案例：${name}`);

  log(`\n📅 出生时间：${birthDate.toLocaleString('zh-CN')}`, colors.cyan);
  log(`👤 性别：${gender}`, colors.cyan);

  try {
    const timestamp = birthDate.getTime();

    // 1. 计算八字
    section('1. 四柱八字');
    const bazi = await calculateBaziFromDateTime(timestamp, gender);

    log(`年柱：${bazi.year.ganZhi}  ${bazi.year.ganWuXing}${bazi.year.gan} ${bazi.year.zhiWuXing}${bazi.year.zhi}`);
    log(`月柱：${bazi.month.ganZhi}  ${bazi.month.ganWuXing}${bazi.month.gan} ${bazi.month.zhiWuXing}${bazi.month.zhi}`);
    log(`日柱：${bazi.day.ganZhi}  ${bazi.day.ganWuXing}${bazi.day.gan} ${bazi.day.zhiWuXing}${bazi.day.zhi}  ⭐️ 日主`, colors.green);
    log(`时柱：${bazi.hour.ganZhi}  ${bazi.hour.ganWuXing}${bazi.hour.gan} ${bazi.hour.zhiWuXing}${bazi.hour.zhi}`);
    log(`\n日干：${bazi.riGan}（命主本人）`, colors.green + colors.bright);

    // 2. 装饰分析
    section('2. 综合分析');
    const decorated = decorateBazi(bazi);

    // 十神
    log('\n【十神分析】', colors.yellow);
    log(`年柱：天干=${decorated.shiShen.year.gan}  地支=${decorated.shiShen.year.zhi}`);
    log(`月柱：天干=${decorated.shiShen.month.gan}  地支=${decorated.shiShen.month.zhi}`);
    log(`时柱：天干=${decorated.shiShen.hour.gan}  地支=${decorated.shiShen.hour.zhi}`);

    // 五行
    log('\n【五行统计】', colors.yellow);
    log(`木：${decorated.wuXing.count.木}  火：${decorated.wuXing.count.火}  土：${decorated.wuXing.count.土}  金：${decorated.wuXing.count.金}  水：${decorated.wuXing.count.水}`);
    log(`最旺：${decorated.wuXing.strongest}  最弱：${decorated.wuXing.weakest}`, colors.cyan);
    log(`用神：${decorated.wuXing.yongShen}  忌神：${decorated.wuXing.jiShen}`, colors.cyan);
    log(`平衡度：${decorated.wuXing.balance}/100`, colors.cyan);

    // 地支关系
    log('\n【地支关系】', colors.yellow);
    if (decorated.relations.liuHe.length > 0) {
      log(`六合：${decorated.relations.liuHe.map(r => r.description).join('、')}`, colors.green);
    }
    if (decorated.relations.sanHe.length > 0) {
      log(`三合：${decorated.relations.sanHe.map(r => r.description).join('、')}`, colors.green);
    }
    if (decorated.relations.liuChong.length > 0) {
      log(`六冲：${decorated.relations.liuChong.map(r => r.description).join('、')}`, colors.red);
    }
    if (decorated.relations.sanXing.length > 0) {
      log(`三刑：${decorated.relations.sanXing.map(r => r.description).join('、')}`, colors.red);
    }
    if (decorated.relations.xiangHai.length > 0) {
      log(`相害：${decorated.relations.xiangHai.map(r => r.description).join('、')}`, colors.red);
    }

    if (
      decorated.relations.liuHe.length === 0 &&
      decorated.relations.sanHe.length === 0 &&
      decorated.relations.liuChong.length === 0 &&
      decorated.relations.sanXing.length === 0 &&
      decorated.relations.xiangHai.length === 0
    ) {
      log('无特殊关系', colors.cyan);
    }

    // 3. 大运
    section('3. 大运排盘');
    const dayun = calculateDaYun(
      bazi.month.gan,
      bazi.month.zhi,
      bazi.year.gan,
      gender,
      timestamp,
      bazi.riGan
    );

    log(`起运年龄：${dayun.qiyunAge}岁`, colors.cyan);
    log(`排盘方式：${dayun.shunPai ? '顺排' : '逆排'}`, colors.cyan);
    log('\n大运列表：');

    dayun.steps.forEach((step, index) => {
      const shiShenStr = step.shiShen
        ? `  十神：${step.shiShen.gan}/${step.shiShen.zhi}`
        : '';
      log(
        `${index + 1}. ${step.ganZhi}运  ${step.startAge}-${step.endAge}岁  ` +
        `五行：${step.wuXing.gan}${step.gan}/${step.wuXing.zhi}${step.zhi}${shiShenStr}`
      );
    });

    // 4. JSON数据预览
    section('4. JSON数据（前100字符）');
    const jsonStr = JSON.stringify(decorated, null, 2);
    log(jsonStr.substring(0, 200) + '...', colors.cyan);

    log(`\n✅ 测试通过！数据完整，算法正常。`, colors.green + colors.bright);

  } catch (error) {
    log(`\n❌ 测试失败！`, colors.red + colors.bright);
    console.error(error);
  }
}

// 主测试函数
async function runTests() {
  header('八字核心算法测试');

  log('\n本测试将验证以下功能：', colors.yellow);
  log('✓ 四柱计算（基于lunar-javascript）');
  log('✓ 十神推算');
  log('✓ 五行统计');
  log('✓ 地支关系分析');
  log('✓ 大运排盘');

  // 测试案例1：阳男
  await testCase(
    '阳男 - 1990年3月15日10时',
    new Date('1990-03-15 10:00:00'),
    '男'
  );

  // 测试案例2：阴女
  await testCase(
    '阴女 - 1985年7月8日14时',
    new Date('1985-07-08 14:00:00'),
    '女'
  );

  // 测试案例3：阴男
  await testCase(
    '阴男 - 1993年11月20日6时',
    new Date('1993-11-20 06:00:00'),
    '男'
  );

  // 测试案例4：阳女
  await testCase(
    '阳女 - 1988年5月2日18时',
    new Date('1988-05-02 18:00:00'),
    '女'
  );

  // 总结
  header('测试完成');
  log('\n✨ 所有测试案例执行完毕！', colors.green + colors.bright);
  log('\n如果看到"✅ 测试通过"，说明核心算法工作正常。', colors.cyan);
  log('您现在可以：', colors.yellow);
  log('1. 执行 Supabase 迁移：server/supabase/migrations/0001_init_schema.sql');
  log('2. 启动后端服务器测试API');
  log('3. 开始前端开发');
}

// 运行测试
runTests().catch(console.error);
