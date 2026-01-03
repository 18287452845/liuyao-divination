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
 * 测试 API Key 是否有效
 */
export async function testApiKey(req: Request, res: Response): Promise<void> {
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

    // 简单测试：调用 DeepSeek API
    const axios = require('axios');

    console.log('[API Key Test] 开始测试 DeepSeek API Key...');
    console.log('[API Key Test] API Key 前缀:', apiKey.substring(0, 10) + '...');

    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000  // 增加到30秒
        }
      );

      console.log('[API Key Test] DeepSeek API 响应状态:', response.status);

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
      console.error('[API Key Test] 验证失败 - 错误类型:', apiError.code);
      console.error('[API Key Test] 错误消息:', apiError.message);
      console.error('[API Key Test] 响应状态:', apiError.response?.status);
      console.error('[API Key Test] 响应数据:', JSON.stringify(apiError.response?.data, null, 2));

      if (apiError.code === 'ECONNREFUSED') {
        res.json({
          success: false,
          message: '无法连接到 DeepSeek API 服务器，请检查网络连接',
        });
      } else if (apiError.code === 'ETIMEDOUT' || apiError.code === 'ECONNABORTED') {
        res.json({
          success: false,
          message: '连接超时，请检查网络或稍后重试',
        });
      } else if (apiError.response?.status === 401) {
        res.json({
          success: false,
          message: 'API Key 无效或已过期',
        });
      } else if (apiError.response?.status === 429) {
        res.json({
          success: false,
          message: 'API 调用频率过高，请稍后再试',
        });
      } else {
        res.json({
          success: false,
          message: 'API Key 验证失败: ' + (apiError.response?.data?.error?.message || apiError.message),
        });
      }
    }
  } catch (error) {
    console.error('测试API Key错误:', error);
    res.status(500).json({
      success: false,
      message: '测试API Key失败',
    });
  }
}
