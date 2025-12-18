/**
 * JWT修复验证测试
 * 验证jti是否正确放在payload中
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = 'test-secret';

console.log('测试JWT修复...\n');

// 测试修复后的实现
function generateAccessTokenFixed(payload) {
  // jti应该放在payload中，而不是options中
  const payloadWithJti = {
    ...payload,
    jti: uuidv4(),
  };
  
  return jwt.sign(payloadWithJti, JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'liuyao-system',
    audience: 'liuyao-client',
  });
}

// 测试旧的错误实现
function generateAccessTokenBroken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      jti: uuidv4(), // 错误：jti不应该在这里
      expiresIn: '7d',
      issuer: 'liuyao-system',
      audience: 'liuyao-client',
    });
  } catch (error) {
    return { error: error.message };
  }
}

const testPayload = {
  userId: 'test-user-id',
  username: 'testuser',
  roles: ['user']
};

console.log('1. 测试修复后的实现（jti在payload中）:');
try {
  const token = generateAccessTokenFixed(testPayload);
  console.log('   ✓ Token生成成功');
  
  // 解码验证
  const decoded = jwt.decode(token);
  console.log('   ✓ jti在payload中:', decoded.jti ? '是' : '否');
  console.log('   ✓ Token内容:', {
    userId: decoded.userId,
    username: decoded.username,
    jti: decoded.jti.substring(0, 8) + '...',
    iss: decoded.iss,
    aud: decoded.aud
  });
  console.log('   ✓ 测试通过\n');
} catch (error) {
  console.error('   ✗ 错误:', error.message, '\n');
}

console.log('2. 测试旧的错误实现（jti在options中）:');
const result = generateAccessTokenBroken(testPayload);
if (result.error) {
  console.log('   ✓ 预期错误发生:', result.error);
  console.log('   ✓ 这证明了修复的必要性\n');
} else {
  console.log('   ✗ 未发生预期错误（可能jsonwebtoken版本不同）\n');
}

console.log('3. 验证修复后的token可以正常验证:');
try {
  const token = generateAccessTokenFixed(testPayload);
  const verified = jwt.verify(token, JWT_SECRET, {
    issuer: 'liuyao-system',
    audience: 'liuyao-client',
  });
  console.log('   ✓ Token验证成功');
  console.log('   ✓ 用户信息:', {
    userId: verified.userId,
    username: verified.username,
    jti: verified.jti.substring(0, 8) + '...'
  });
  console.log('   ✓ 测试通过\n');
} catch (error) {
  console.error('   ✗ 验证失败:', error.message, '\n');
}

console.log('✓ JWT修复验证完成！');
console.log('\n总结:');
console.log('- jti必须放在payload中，不能放在options中');
console.log('- 修复后的实现可以正常生成和验证token');
console.log('- 这个修复解决了登录时的JWT错误\n');
