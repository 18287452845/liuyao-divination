const mysql = require('mysql2/promise');

async function fixPasswords() {
  const connection = await mysql.createConnection({
    host: '14.103.147.50',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'liuyao_db'
  });

  try {
    // admin123 的 bcrypt hash
    const adminPassword = '$2a$10$V22LB4ExPdxHWa.8SVSwBuJUwC0iEjSYRxsWC076yHUY9cgVrQDXS';
    // test123 的 bcrypt hash
    const testPassword = '$2a$10$vhfaBKD2zUtCqaGbRnMYT.xPTpVYiXxD.CkURjPO87WVi9bJFF1Fa';

    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [adminPassword, 'admin']
    );

    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [testPassword, 'testuser']
    );

    console.log('✓ 密码更新成功');

    // 验证
    const [rows] = await connection.execute(
      'SELECT username, password FROM users'
    );
    console.log('✓ 验证用户密码:');
    rows.forEach(row => {
      console.log(`  ${row.username}: ${row.password.substring(0, 20)}...`);
    });

  } finally {
    await connection.end();
  }
}

fixPasswords().catch(console.error);
