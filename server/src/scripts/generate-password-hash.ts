/**
 * 生成密码哈希脚本
 * 用于生成初始用户的密码哈希值
 *
 * 使用方法:
 * cd server
 * npx tsx src/scripts/generate-password-hash.ts
 */

import bcrypt from 'bcryptjs';

// 默认密码
const passwords = {
  admin: 'admin123',
  testuser: 'test123',
};

async function generateHashes() {
  console.log('='.repeat(60));
  console.log('生成密码哈希');
  console.log('='.repeat(60));
  console.log('');

  for (const [username, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`用户名: ${username}`);
    console.log(`明文密码: ${password}`);
    console.log(`哈希值: ${hash}`);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('请将上面的哈希值复制到 sql/auth_init_data.sql 文件中');
  console.log('='.repeat(60));
}

generateHashes().catch(console.error);
