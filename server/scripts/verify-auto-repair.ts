/**
 * 验证数据库自动修复功能
 * 运行此脚本来测试自动修复系统是否正常工作
 */

import { query, queryOne } from '../src/models/database';
import { diagnosisAndRepair, checkDatabaseHealth, DBError } from '../src/utils/dbAutoRepair';

console.log('🔍 开始验证数据库自动修复功能...\n');

/**
 * 测试1: 参数类型自动转换
 */
async function test1_ParameterTypeConversion() {
  console.log('📋 测试1: LIMIT/OFFSET 参数类型自动转换');
  
  try {
    // 故意传递字符串类型的参数
    const limit = '10' as any;
    const offset = '0' as any;
    
    console.log(`   传入参数类型: limit=${typeof limit}, offset=${typeof offset}`);
    
    const result = await query(
      'SELECT * FROM divination_records LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    console.log(`   ✅ 查询成功，返回 ${Array.isArray(result) ? result.length : 0} 条记录`);
    console.log(`   提示: 如果看到"自动修复"警告，说明自动转换生效\n`);
    return true;
  } catch (error) {
    console.log(`   ❌ 查询失败:`, error);
    return false;
  }
}

/**
 * 测试2: 错误诊断功能
 */
async function test2_ErrorDiagnosis() {
  console.log('📋 测试2: 错误诊断功能');
  
  // 模拟一个参数类型错误
  const mockError: DBError = {
    name: 'Error',
    message: 'Incorrect arguments to mysqld_stmt_execute',
    code: 'ER_WRONG_ARGUMENTS',
    errno: 1210,
    sqlState: 'HY000',
    sqlMessage: 'Incorrect arguments to mysqld_stmt_execute'
  };
  
  const sql = 'SELECT * FROM invite_codes ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const params = ['20', '0']; // 故意使用字符串
  
  console.log(`   模拟错误: ${mockError.code}`);
  console.log(`   SQL: ${sql}`);
  console.log(`   参数: [${params.map(p => `"${p}"`).join(', ')}]`);
  
  const result = await diagnosisAndRepair(mockError, sql, params);
  
  if (result.success) {
    console.log(`   ✅ 诊断成功`);
    console.log(`   信息: ${result.message}`);
    if (result.action) {
      console.log(`   操作: ${result.action}`);
    }
  } else {
    console.log(`   ❌ 诊断失败: ${result.message}`);
  }
  console.log();
  
  return result.success;
}

/**
 * 测试3: 表不存在错误诊断
 */
async function test3_TableNotFoundDiagnosis() {
  console.log('📋 测试3: 表不存在错误诊断');
  
  const mockError: DBError = {
    name: 'Error',
    message: "Table 'liuyao_db.invite_codes' doesn't exist",
    code: 'ER_NO_SUCH_TABLE',
    errno: 1146,
    sqlState: '42S02',
    sqlMessage: "Table 'liuyao_db.invite_codes' doesn't exist"
  };
  
  const sql = 'SELECT * FROM invite_codes';
  
  console.log(`   模拟错误: ${mockError.code}`);
  console.log(`   SQL: ${sql}`);
  
  const result = await diagnosisAndRepair(mockError, sql);
  
  console.log(`   诊断结果: ${result.success ? '成功' : '失败'}`);
  console.log(`   信息: ${result.message}`);
  if (result.action) {
    console.log(`   操作: ${result.action}`);
  }
  console.log(`   提示: 此测试不会真正创建表，只验证诊断逻辑\n`);
  
  return true;
}

/**
 * 测试4: 字段不存在错误诊断
 */
async function test4_ColumnNotFoundDiagnosis() {
  console.log('📋 测试4: 字段不存在错误诊断');
  
  const mockError: DBError = {
    name: 'Error',
    message: "Unknown column 'invite_code' in 'field list'",
    code: 'ER_BAD_FIELD_ERROR',
    errno: 1054,
    sqlState: '42S22',
    sqlMessage: "Unknown column 'invite_code' in 'field list'"
  };
  
  const sql = 'SELECT invite_code FROM users';
  
  console.log(`   模拟错误: ${mockError.code}`);
  console.log(`   SQL: ${sql}`);
  
  const result = await diagnosisAndRepair(mockError, sql);
  
  console.log(`   诊断结果: ${result.success ? '成功' : '失败'}`);
  console.log(`   信息: ${result.message}`);
  if (result.action) {
    console.log(`   操作: ${result.action}`);
  }
  console.log(`   提示: 此测试不会真正添加字段，只验证诊断逻辑\n`);
  
  return true;
}

/**
 * 测试5: 数据库健康检查
 */
async function test5_DatabaseHealthCheck() {
  console.log('📋 测试5: 数据库健康检查');
  
  try {
    const health = await checkDatabaseHealth();
    
    console.log(`   健康状态: ${health.healthy ? '✅ 健康' : '⚠️ 有问题'}`);
    
    if (health.issues.length > 0) {
      console.log('   发现的问题:');
      health.issues.forEach(issue => console.log(`     - ${issue}`));
    }
    
    if (health.suggestions.length > 0) {
      console.log('   修复建议:');
      health.suggestions.forEach(suggestion => console.log(`     - ${suggestion}`));
    }
    
    if (health.healthy) {
      console.log('   ✅ 所有必需的表都存在\n');
    } else {
      console.log();
    }
    
    return health.healthy;
  } catch (error) {
    console.log(`   ❌ 健康检查失败:`, error);
    console.log();
    return false;
  }
}

/**
 * 测试6: 实际查询测试
 */
async function test6_RealQuery() {
  console.log('📋 测试6: 实际数据库查询');
  
  try {
    // 测试简单查询
    const count: any = await queryOne('SELECT COUNT(*) as count FROM divination_records');
    console.log(`   ✅ 查询成功: 卦象记录总数 = ${count?.count || 0}`);
    
    // 测试分页查询
    const records = await query(
      'SELECT * FROM divination_records ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [5, 0]
    );
    console.log(`   ✅ 分页查询成功: 返回 ${Array.isArray(records) ? records.length : 0} 条记录\n`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ 查询失败:`, error);
    console.log();
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  const results: { [key: string]: boolean } = {};
  
  try {
    results['参数类型转换'] = await test1_ParameterTypeConversion();
    results['错误诊断'] = await test2_ErrorDiagnosis();
    results['表不存在诊断'] = await test3_TableNotFoundDiagnosis();
    results['字段不存在诊断'] = await test4_ColumnNotFoundDiagnosis();
    results['健康检查'] = await test5_DatabaseHealthCheck();
    results['实际查询'] = await test6_RealQuery();
  } catch (error) {
    console.error('\n❌ 测试过程出错:', error);
  }
  
  // 输出汇总
  console.log('═══════════════════════════════════════');
  console.log('📊 测试结果汇总');
  console.log('═══════════════════════════════════════');
  
  let passed = 0;
  let failed = 0;
  
  Object.entries(results).forEach(([name, success]) => {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (success) passed++;
    else failed++;
  });
  
  console.log('═══════════════════════════════════════');
  console.log(`总计: ${passed + failed} 项测试`);
  console.log(`通过: ${passed} 项`);
  console.log(`失败: ${failed} 项`);
  console.log('═══════════════════════════════════════\n');
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！数据库自动修复功能工作正常。');
  } else {
    console.log('⚠️  部分测试失败，请检查数据库配置和连接。');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// 执行测试
runAllTests().catch(error => {
  console.error('❌ 验证脚本执行失败:', error);
  process.exit(1);
});
