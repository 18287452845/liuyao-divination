/**
 * API Key 管理控制器
 * 处理用户个人 DeepSeek API Key 的管理
 */

import { Request, Response } from 'express';
import { query, queryOne, update } from '../models/database';

/**
 * 获取当前用户的 API Key（脱敏显示）
 */
export async function getApiKey(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const user: any = await queryOne(
      'SELECT deepseek_api_key, api_key_updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 如果有API Key，进行脱敏处理
    let maskedKey = null;
    if (user.deepseek_api_key) {
      const key = user.deepseek_api_key;
      // 只显示前8位和后4位，中间用星号代替
      if (key.length > 12) {
        maskedKey = key.substring(0, 8) + '****' + key.substring(key.length - 4);
      } else {
        maskedKey = '****';
      }
    }

    res.json({
      success: true,
      data: {
        hasApiKey: !!user.deepseek_api_key,
        apiKey: maskedKey,
        updatedAt: user.api_key_updated_at,
      },
    });
  } catch (error) {
    console.error('获取API Key错误:', error);
    res.status(500).json({
      success: false,
      message: '获取API Key失败',
    });
  }
}

/**
 * 更新当前用户的 API Key
 */
export async function updateApiKey(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { apiKey } = req.body;

    // 验证API Key格式
    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({
        success: false,
        message: 'API Key不能为空',
      });
      return;
    }

    // 简单验证：DeepSeek API Key通常以 sk- 开头
    if (!apiKey.startsWith('sk-')) {
      res.status(400).json({
        success: false,
        message: 'API Key格式不正确，应以 sk- 开头',
      });
      return;
    }

    if (apiKey.length < 20) {
      res.status(400).json({
        success: false,
        message: 'API Key长度不正确',
      });
      return;
    }

    // 更新API Key
    await update(
      'UPDATE users SET deepseek_api_key = ?, api_key_updated_at = NOW() WHERE id = ?',
      [apiKey, req.user.userId]
    );

    res.json({
      success: true,
      message: 'API Key已更新',
    });
  } catch (error) {
    console.error('更新API Key错误:', error);
    res.status(500).json({
      success: false,
      message: '更新API Key失败',
    });
  }
}

/**
 * 删除当前用户的 API Key
 */
export async function deleteApiKey(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    // 删除API Key
    await update(
      'UPDATE users SET deepseek_api_key = NULL, api_key_updated_at = NULL WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'API Key已删除',
    });
  } catch (error) {
    console.error('删除API Key错误:', error);
    res.status(500).json({
      success: false,
      message: '删除API Key失败',
    });
  }
}

/**
 * 手动实现axios重试逻辑
 * 用于处理网络抖动和临时性连接问题
 */
async function axiosWithRetry(
  config: any,
  maxRetries = 3,
  retryDelay = 1500
): Promise<any> {
  const https = require('https');
  const axios = require('axios');
  const httpsAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: true
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[API Key Test] 请求尝试 ${attempt}/${maxRetries}`);
      const response = await axios({
        method: 'post',
        ...config,
        httpsAgent: {
          ...httpsAgent,
          timeout: 30000
        }
      });
      console.log(`[API Key Test] 请求成功（尝试 ${attempt}）`);
      return response;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;

      console.log(`[API Key Test] 请求失败（尝试 ${attempt}/${maxRetries}）`);
      console.log(`[API Key Test] 错误类型: ${error.code}`);
      console.log(`[API Key Test] 错误消息: ${error.message}`);

      if (error.response) {
        console.log(`[API Key Test] HTTP状态: ${error.response.status}`);
        console.log(`[API Key Test] 响应数据:`, JSON.stringify(error.response.data));

        // 4xx错误（除了429）不应重试
        if (error.response.status >= 400 &&
            error.response.status < 500 &&
            error.response.status !== 429) {
          throw error;
        }
      }

      if (isLastAttempt) {
        console.error(`[API Key Test] 所有重试均失败`);
        throw error;
      }

      // 等待后重试
      const delay = retryDelay * attempt;
      console.log(`[API Key Test] 等待 ${delay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * 测试 API Key 是否有效
 */
export async function testApiKey(req: Request, res: Response): Promise<void> {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] [API Key Test] 开始测试...`);

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    let { apiKey } = req.body;

    // 如果请求中没有提供apiKey，则从数据库中读取用户已保存的key
    if (!apiKey) {
      const user: any = await queryOne(
        'SELECT deepseek_api_key FROM users WHERE id = ?',
        [req.user.userId]
      );

      if (!user || !user.deepseek_api_key) {
        res.status(400).json({
          success: false,
          message: '请先配置API Key',
        });
        return;
      }

      apiKey = user.deepseek_api_key;
    }

    console.log(`[${requestId}] [API Key Test] API Key 前缀: ${apiKey.substring(0, 10)}...`);
    console.log(`[${requestId}] [API Key Test] 请求URL: https://api.deepseek.com/v1/chat/completions`);

    try {
      // 使用带重试的请求
      const response = await axiosWithRetry({
        url: 'https://api.deepseek.com/v1/chat/completions',
        data: {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ],
          max_tokens: 10
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }, 3, 1500); // 最多重试3次，初始延迟1.5秒

      console.log(`[${requestId}] [API Key Test] 响应状态: ${response.status}`);
      console.log(`[${requestId}] [API Key Test] 响应数据:`, JSON.stringify(response.data));

      if (response.status === 200) {
        res.json({
          success: true,
          message: 'API Key 验证成功',
        });
      } else {
        res.json({
          success: false,
          message: 'API Key 验证失败',
        });
      }
    } catch (apiError: any) {
      console.error(`[${requestId}] [API Key Test] 验证失败`);

      // 详细的错误日志
      if (apiError.code) {
        console.error(`[${requestId}] [API Key Test] 错误代码: ${apiError.code}`);
      }
      if (apiError.message) {
        console.error(`[${requestId}] [API Key Test] 错误消息: ${apiError.message}`);
      }
      if (apiError.response) {
        console.error(`[${requestId}] [API Key Test] HTTP状态: ${apiError.response.status}`);
        console.error(`[${requestId}] [API Key Test] 响应头:`, JSON.stringify(apiError.response.headers));
        console.error(`[${requestId}] [API Key Test] 响应数据:`, JSON.stringify(apiError.response.data));
      }
      if (apiError.stack) {
        console.error(`[${requestId}] [API Key Test] 堆栈跟踪:`, apiError.stack);
      }

      let errorMessage = 'API Key 验证失败';

      if (apiError.code === 'ECONNREFUSED') {
        errorMessage = '无法连接到 DeepSeek API 服务器，请检查网络连接';
      } else if (apiError.code === 'ETIMEDOUT' || apiError.code === 'ECONNABORTED') {
        errorMessage = '连接超时，请检查网络或稍后重试';
      } else if (apiError.code === 'ECONNRESET') {
        errorMessage = '连接被重置，可能是网络不稳定导致';
      } else if (apiError.response?.status === 401) {
        errorMessage = 'API Key 无效或已过期';
      } else if (apiError.response?.status === 429) {
        errorMessage = 'API 调用频率过高，请稍后再试';
      } else if (apiError.response?.status === 500) {
        errorMessage = 'DeepSeek API 服务器错误，请稍后重试';
      } else if (apiError.response?.status === 503) {
        errorMessage = 'DeepSeek API 服务暂时不可用，请稍后重试';
      } else if (apiError.response?.data?.error?.message) {
        errorMessage = `API 返回错误: ${apiError.response.data.error.message}`;
      } else if (apiError.message) {
        errorMessage = `请求失败: ${apiError.message}`;
      }

      res.json({
        success: false,
        message: errorMessage,
        // 开发环境返回详细信息
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            code: apiError.code,
            status: apiError.response?.status,
            details: apiError.response?.data
          }
        })
      });
    }
  } catch (error) {
    console.error(`[${requestId}] [API Key Test] 未知错误:`, error);
    res.status(500).json({
      success: false,
      message: '测试API Key失败',
    });
  }
}
