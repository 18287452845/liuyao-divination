/**
 * API功能测试脚本
 * 测试新增的认证和权限管理功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// 测试用户信息
const ADMIN_USER = {
  username: 'admin',
  password: 'admin123'
};

const TEST_USER = {
  username: 'testuser',
  password: 'test123'
};

let adminToken = null;
let testToken = null;

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

// 测试函数
async function test(name, testFn) {
  try {
    console.log(`\n🧪 测试: ${name}`);
    await testFn();
    console.log(`✅ 通过: ${name}`);
    testResults.passed++;
    testResults.details.push({ name, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ 失败: ${name}`);
    console.log(`   错误: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ name, status: 'FAILED', error: error.message });
  }
}

// HTTP请求辅助函数
async function request(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {}
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await axios(config);
  return response.data;
}

// 登录获取Token
async function login(user) {
  const response = await request('POST', '/auth/login', user);
  return response.data.accessToken;
}

// 开始测试
async function runTests() {
  console.log('🚀 开始API功能测试...\n');

  try {
    // 1. 测试管理员登录
    await test('管理员登录', async () => {
      adminToken = await login(ADMIN_USER);
      if (!adminToken) throw new Error('未获取到管理员Token');
    });

    // 2. 测试普通用户登录
    await test('普通用户登录', async () => {
      testToken = await login(TEST_USER);
      if (!testToken) throw new Error('未获取到用户Token');
    });

    // 3. 测试获取当前用户信息
    await test('获取当前用户信息', async () => {
      const response = await request('GET', '/auth/me', null, adminToken);
      if (!response.success) throw new Error('获取用户信息失败');
    });

    // 4. 测试邀请码管理 - 获取列表
    await test('获取邀请码列表', async () => {
      const response = await request('GET', '/invite-codes', null, adminToken);
      if (!response.success) throw new Error('获取邀请码列表失败');
    });

    // 5. 测试邀请码管理 - 获取统计
    await test('获取邀请码统计', async () => {
      const response = await request('GET', '/invite-codes/statistics', null, adminToken);
      if (!response.success) throw new Error('获取邀请码统计失败');
    });

    // 6. 测试创建邀请码
    await test('创建邀请码', async () => {
      const inviteData = {
        code: 'TEST' + Date.now(),
        name: '测试邀请码',
        description: 'API测试创建的邀请码',
        maxUses: 5
      };
      const response = await request('POST', '/invite-codes', inviteData, adminToken);
      if (!response.success) throw new Error('创建邀请码失败');
    });

    // 7. 测试审计日志 - 获取列表
    await test('获取审计日志列表', async () => {
      const response = await request('GET', '/audit-logs', null, adminToken);
      if (!response.success) throw new Error('获取审计日志失败');
    });

    // 8. 测试审计日志 - 获取统计
    await test('获取审计日志统计', async () => {
      const response = await request('GET', '/audit-logs/statistics', null, adminToken);
      if (!response.success) throw new Error('获取审计日志统计失败');
    });

    // 9. 测试权限验证 - 普通用户访问管理员功能
    await test('权限验证 - 普通用户访问管理员功能', async () => {
      try {
        await request('GET', '/invite-codes', null, testToken);
        throw new Error('普通用户不应该能访问管理员功能');
      } catch (error) {
        if (error.response && error.response.status === 403) {
          // 期望的403错误，说明权限控制正常
          return;
        }
        throw error;
      }
    });

    // 10. 测试用户管理 - 获取用户列表
    await test('获取用户列表', async () => {
      const response = await request('GET', '/users', null, adminToken);
      if (!response.success) throw new Error('获取用户列表失败');
    });

    // 11. 测试角色管理 - 获取角色列表
    await test('获取角色列表', async () => {
      const response = await request('GET', '/roles', null, adminToken);
      if (!response.success) throw new Error('获取角色列表失败');
    });

    // 12. 测试权限管理 - 获取权限列表
    await test('获取权限列表', async () => {
      const response = await request('GET', '/permissions', null, adminToken);
      if (!response.success) throw new Error('获取权限列表失败');
    });

    // 13. 测试未授权访问
    await test('未授权访问测试', async () => {
      try {
        await request('GET', '/users');
        throw new Error('未授权访问应该被拒绝');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // 期望的401错误
          return;
        }
        throw error;
      }
    });

    // 14. 测试Token验证
    await test('Token验证测试', async () => {
      try {
        await request('GET', '/auth/me', null, 'invalid-token');
        throw new Error('无效Token应该被拒绝');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // 期望的401错误
          return;
        }
        throw error;
      }
    });

    // 15. 测试用户注册（使用邀请码）
    await test('用户注册测试', async () => {
      const userData = {
        username: 'testuser' + Date.now(),
        password: 'TestPass123!',
        email: 'test@example.com',
        inviteCode: '1663929970' // 使用默认邀请码
      };
      const response = await request('POST', '/auth/register', userData);
      if (!response.success) throw new Error('用户注册失败');
    });

  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }

  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
  }

  console.log('\n🎯 功能测试完成！');
  console.log('注意: 某些测试可能需要数据库中有相应的初始数据');
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/auth/me`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return true; // 401说明服务器在运行
    }
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 检查服务器状态...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ 服务器未运行或无法连接');
    console.log('请确保后端服务器在 http://localhost:5000 上运行');
    process.exit(1);
  }

  console.log('✅ 服务器运行正常');
  await runTests();
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, testResults };