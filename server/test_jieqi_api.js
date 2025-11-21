// 测试节气API
const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function testJieQiAPI() {
  console.log('=== 测试节气查询功能 ===\n');

  // 测试1: 查询今天的节气
  console.log('测试1: 查询今天的节气');
  try {
    const today = new Date();
    const response = await axios.get(`${baseURL}/tools/calendar/solar-to-lunar`, {
      params: {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      }
    });
    console.log('查询结果:', JSON.stringify(response.data.jieQi, null, 2));
  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
  }

  // 测试2: 查询2025年的24节气表
  console.log('\n测试2: 查询2025年的24节气表');
  try {
    const response = await axios.get(`${baseURL}/tools/jieqi/table`, {
      params: { year: 2025 }
    });
    console.log('2025年24节气:');
    response.data.jieQi.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name.padEnd(4, ' ')} - ${item.date} ${item.time}`);
    });
  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
  }

  // 测试3: 查询立春那天的节气
  console.log('\n测试3: 查询立春那天的节气');
  try {
    const response = await axios.get(`${baseURL}/tools/calendar/solar-to-lunar`, {
      params: {
        year: 2025,
        month: 2,
        day: 3
      }
    });
    console.log('立春当天节气信息:', JSON.stringify(response.data.jieQi, null, 2));
  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
  }
}

// 运行测试
testJieQiAPI().catch(console.error);
