const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'rootpassword',
    database: 'liuyao_db'
  });

  try {
    console.log('=== 数据库连接测试 ===');
    
    // 测试 audit_logs 表
    console.log('\n1. 测试 audit_logs 表...');
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
      console.log(`✅ audit_logs 表存在，记录数: ${rows[0].count}`);
    } catch (error) {
      console.log(`❌ audit_logs 表错误: ${error.message}`);
    }

    // 测试 user_sessions 表
    console.log('\n2. 测试 user_sessions 表...');
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM user_sessions');
      console.log(`✅ user_sessions 表存在，记录数: ${rows[0].count}`);
    } catch (error) {
      console.log(`❌ user_sessions 表错误: ${error.message}`);
    }

    // 测试 token_blacklist 表和 token_jti 字段
    console.log('\n3. 测试 token_blacklist 表和 token_jti 字段...');
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM token_blacklist');
      console.log(`✅ token_blacklist 表存在，记录数: ${rows[0].count}`);
    } catch (error) {
      console.log(`❌ token_blacklist 表错误: ${error.message}`);
    }

    // 测试 token_jti 字段是否存在
    try {
      await connection.execute('SELECT token_jti FROM token_blacklist LIMIT 1');
      console.log('✅ token_jti 字段存在');
    } catch (error) {
      console.log(`❌ token_jti 字段错误: ${error.message}`);
    }

    // 测试数据库修复后的审计日志记录
    console.log('\n4. 测试审计日志记录功能...');
    try {
      const { v4: uuidv4 } = require('uuid');
      const logId = uuidv4();
      await connection.execute(
        'INSERT INTO audit_logs (id, user_id, username, action, status, error_message) VALUES (?, ?, ?, ?, ?, ?)',
        [logId, null, 'test_user', 'TEST_ACTION', 1, null]
      );
      console.log('✅ 审计日志记录功能正常');
      
      // 清理测试数据
      await connection.execute('DELETE FROM audit_logs WHERE id = ?', [logId]);
    } catch (error) {
      console.log(`❌ 审计日志记录错误: ${error.message}`);
    }

    // 测试用户会话记录功能
    console.log('\n5. 测试用户会话记录功能...');
    try {
      const { v4: uuidv4 } = require('uuid');
      const sessionId = uuidv4();
      await connection.execute(
        'INSERT INTO user_sessions (id, user_id, session_token, expires_at) VALUES (?, ?, ?, ?)',
        [sessionId, 'test_user', 'test_token', null]
      );
      console.log('✅ 用户会话记录功能正常');
      
      // 清理测试数据
      await connection.execute('DELETE FROM user_sessions WHERE id = ?', [sessionId]);
    } catch (error) {
      console.log(`❌ 用户会话记录错误: ${error.message}`);
    }

    // 测试Token黑名单功能
    console.log('\n6. 测试Token黑名单功能...');
    try {
      const { v4: uuidv4 } = require('uuid');
      const blacklistId = uuidv4();
      await connection.execute(
        'INSERT INTO token_blacklist (id, token_jti, token_type) VALUES (?, ?, ?)',
        [blacklistId, 'test_jti', 'access']
      );
      console.log('✅ Token黑名单记录功能正常');
      
      // 测试查询 token_jti 字段
      const [result] = await connection.execute('SELECT token_jti FROM token_blacklist WHERE id = ?', [blacklistId]);
      console.log(`✅ token_jti 字段查询正常，值: ${result[0].token_jti}`);
      
      // 清理测试数据
      await connection.execute('DELETE FROM token_blacklist WHERE id = ?', [blacklistId]);
    } catch (error) {
      console.log(`❌ Token黑名单错误: ${error.message}`);
    }

    console.log('\n=== 数据库修复测试完成 ===');
    console.log('如果看到所有 ✅，说明数据库问题已修复');

  } finally {
    await connection.end();
  }
}

testDatabaseConnection().catch(console.error);