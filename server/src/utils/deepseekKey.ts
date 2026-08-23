/**
 * DeepSeek API Key 解析
 *
 * 统一规则（保证按账号隔离）：
 * 1. 优先使用当前登录用户自己的 Key（users.deepseek_api_key，仅属于该账号）
 * 2. 用户未配置时回退到系统 Key（环境变量 DEEPSEEK_API_KEY）
 * 3. 两者都没有时返回 null，由调用方返回配置错误
 */

import { queryOne } from '../models/database';

export interface DeepSeekKeyResolution {
  apiKey: string | null;
  source: 'user' | 'system' | 'none';
}

export async function resolveDeepSeekKey(userId?: string): Promise<DeepSeekKeyResolution> {
  if (userId) {
    const user: any = await queryOne(
      'SELECT deepseek_api_key FROM users WHERE id = ?',
      [userId]
    );
    const personalKey: string | undefined = user?.deepseek_api_key;
    if (personalKey && personalKey.trim() !== '') {
      return { apiKey: personalKey, source: 'user' };
    }
  }

  const systemKey = (process.env.DEEPSEEK_API_KEY || '').trim();
  if (systemKey !== '') {
    return { apiKey: systemKey, source: 'system' };
  }

  return { apiKey: null, source: 'none' };
}

export function hasSystemDeepSeekKey(): boolean {
  return (process.env.DEEPSEEK_API_KEY || '').trim() !== '';
}
