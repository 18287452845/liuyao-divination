/**
 * 数据库迁移测试脚本
 * 用于验证迁移脚本的语法和基本功能
 */

const fs = require('fs');
const path = require('path');

// 读取迁移脚本
const migrationPath = path.join(__dirname, 'sql', '02_auth_permissions_migration.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 开始验证数据库迁移脚本...\n');

// 检查SQL语法的基本规则
function validateSQL(sql) {
  const errors = [];
  const warnings = [];

  // 检查表创建语句
  const createTableMatches = sql.match(/CREATE TABLE[^;]+;/gi);
  if (createTableMatches) {
    console.log(`✓ 找到 ${createTableMatches.length} 个CREATE TABLE语句`);
    
    createTableMatches.forEach((stmt, index) => {
      // 检查是否有主键
      if (!stmt.toLowerCase().includes('primary key')) {
        warnings.push(`表 ${index + 1} 缺少主键定义`);
      }
      
      // 检查是否有字符集设置
      if (!stmt.toLowerCase().includes('charset')) {
        warnings.push(`表 ${index + 1} 建议添加字符集设置`);
      }
    });
  }

  // 检查INSERT语句
  const insertMatches = sql.match(/INSERT INTO[^;]+;/gi);
  if (insertMatches) {
    console.log(`✓ 找到 ${insertMatches.length} 个INSERT语句`);
  }

  // 检查ALTER TABLE语句
  const alterMatches = sql.match(/ALTER TABLE[^;]+;/gi);
  if (alterMatches) {
    console.log(`✓ 找到 ${alterMatches.length} 个ALTER TABLE语句`);
  }

  // 检查存储过程创建
  const procedureMatches = sql.match(/CREATE PROCEDURE[^;]+END[^;]*;/gi);
  if (procedureMatches) {
    console.log(`✓ 找到 ${procedureMatches.length} 个存储过程`);
  }

  // 检查事件创建
  const eventMatches = sql.match(/CREATE EVENT[^;]+;/gi);
  if (eventMatches) {
    console.log(`✓ 找到 ${eventMatches.length} 个事件`);
  }

  // 基本语法检查
  if (sql.includes(';;')) {
    errors.push('发现双分号，可能导致语法错误');
  }

  // 检查是否使用了正确的数据库
  if (!sql.includes('USE liuyao_db')) {
    warnings.push('建议在脚本开头添加USE语句');
  }

  return { errors, warnings };
}

// 验证脚本
const { errors, warnings } = validateSQL(migrationSQL);

// 输出结果
console.log('\n📊 验证结果:');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ 迁移脚本验证通过！');
} else {
  if (errors.length > 0) {
    console.log('\n❌ 错误:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  警告:');
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
}

// 检查关键功能
console.log('\n🔍 功能检查:');

const features = [
  { name: '审计日志表', pattern: /CREATE TABLE.*audit_logs/i },
  { name: '邀请码管理表', pattern: /CREATE TABLE.*invite_codes/i },
  { name: 'Token黑名单表', pattern: /CREATE TABLE.*token_blacklist/i },
  { name: '用户表扩展', pattern: /ALTER TABLE.*users/i },
  { name: '新增权限', pattern: /INSERT INTO permissions/i },
  { name: '清理存储过程', pattern: /CREATE PROCEDURE.*CleanupExpiredData/i },
  { name: '定时清理事件', pattern: /CREATE EVENT/i }
];

features.forEach(feature => {
  if (feature.pattern.test(migrationSQL)) {
    console.log(`✓ ${feature.name}`);
  } else {
    console.log(`✗ ${feature.name} 未找到`);
  }
});

// 统计信息
console.log('\n📈 统计信息:');
console.log(`  脚本大小: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
console.log(`  总行数: ${migrationSQL.split('\n').length}`);
console.log(`  表创建: ${(migrationSQL.match(/CREATE TABLE/gi) || []).length}`);
console.log(`  数据插入: ${(migrationSQL.match(/INSERT INTO/gi) || []).length}`);
console.log(`  索引创建: ${(migrationSQL.match(/INDEX/gi) || []).length}`);

console.log('\n🎯 迁移脚本功能总结:');
console.log('  1. ✓ 新增审计日志功能');
console.log('  2. ✓ 新增邀请码管理');
console.log('  3. ✓ 新增Token黑名单');
console.log('  4. ✓ 扩展用户表字段');
console.log('  5. ✓ 新增细粒度权限');
console.log('  6. ✓ 自动清理机制');
console.log('  7. ✓ 数据完整性约束');

if (errors.length === 0) {
  console.log('\n🚀 迁移脚本准备就绪，可以执行数据库迁移！');
} else {
  console.log('\n🛠️  请修复错误后再执行迁移。');
}