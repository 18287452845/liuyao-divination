/**
 * JWT Token 黑名单管理工具
 * 用于实现Token登出和撤销功能
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';

export interface TokenBlacklistEntry {
  tokenJti: string;
  userId?: string;
  tokenType: 'access' | 'refresh';
  expiresAt: Date;
  reason?: string;
}

/**
 * 将Token加入黑名单
 */
export async function addToBlacklist(entry: TokenBlacklistEntry): Promise<void> {
  try {
    const blacklistId = uuidv4();
    
    await query(
      `INSERT INTO token_blacklist (
        id, token_jti, user_id, token_type, expires_at, reason
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        expires_at = VALUES(expires_at),
        reason = VALUES(reason)`,
      [
        blacklistId,
        entry.tokenJti,
        entry.userId || null,
        entry.tokenType,
        entry.expiresAt,
        entry.reason || null
      ]
    );

    console.log(`Token已加入黑名单: ${entry.tokenJti} (${entry.tokenType})`);
  } catch (error) {
    console.error('Token加入黑名单失败:', error);
    throw error;
  }
}

/**
 * 检查Token是否在黑名单中
 */
export async function isTokenBlacklisted(tokenJti: string): Promise<boolean> {
  try {
    const result: any = await queryOne(
      'SELECT id FROM token_blacklist WHERE token_jti = ? AND expires_at > NOW()',
      [tokenJti]
    );
    
    return !!result;
  } catch (error) {
    console.error('检查Token黑名单失败:', error);
    // 出错时为了安全，返回true
    return true;
  }
}

/**
 * 将用户所有Token加入黑名单
 */
export async function blacklistAllUserTokens(userId: string, reason?: string): Promise<void> {
  try {
    // 这里需要根据实际的JWT实现来获取用户的所有活跃Token
    // 由于我们无法直接获取所有Token，这里提供一个实现思路：
    // 1. 在用户登录时记录Token信息
    // 2. 或者使用Redis等存储活跃Token列表
    
    // 当前实现：只记录操作日志，具体Token黑名单需要在Token验证时检查
    console.log(`用户 ${userId} 的所有Token将被撤销: ${reason || '未知原因'}`);
    
    // 可以在这里添加额外的逻辑，比如清除用户的会话信息等
  } catch (error) {
    console.error('撤销用户所有Token失败:', error);
    throw error;
  }
}

/**
 * 清理过期的黑名单记录
 */
export async function cleanupExpiredBlacklist(): Promise<number> {
  try {
    const result: any = await query(
      'DELETE FROM token_blacklist WHERE expires_at < NOW()'
    );
    
    return result.affectedRows || 0;
  } catch (error) {
    console.error('清理Token黑名单失败:', error);
    throw error;
  }
}

/**
 * 获取黑名单记录列表
 */
export async function getBlacklistEntries(filters: {
  page?: number;
  pageSize?: number;
  userId?: string;
  tokenType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ entries: any[]; total: number }> {
  try {
    const {
      page = 1,
      pageSize = 20,
      userId,
      tokenType,
      startDate,
      endDate
    } = filters;

    const offset = (page - 1) * pageSize;
    let whereClauses: string[] = [];
    let params: any[] = [];

    // 构建查询条件
    if (userId) {
      whereClauses.push('user_id = ?');
      params.push(userId);
    }

    if (tokenType) {
      whereClauses.push('token_type = ?');
      params.push(tokenType);
    }

    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total FROM token_blacklist ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询黑名单记录
    const entries: any = await query(
      `SELECT * FROM token_blacklist ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)]
    );

    return { entries, total };
  } catch (error) {
    console.error('获取Token黑名单失败:', error);
    throw error;
  }
}

/**
 * 手动将Token加入黑名单（管理员功能）
 */
export async function manualBlacklistToken(
  tokenJti: string,
  reason: string,
  adminUserId: string
): Promise<void> {
  try {
    // 首先检查Token是否已存在
    const existing = await queryOne(
      'SELECT * FROM token_blacklist WHERE token_jti = ?',
      [tokenJti]
    );

    if (existing) {
      throw new Error('Token已在黑名单中');
    }

    // 这里需要解析Token来获取用户ID和过期时间
    // 实际实现中需要使用JWT库来解析
    const blacklistId = uuidv4();
    
    await query(
      `INSERT INTO token_blacklist (
        id, token_jti, token_type, expires_at, reason
      ) VALUES (?, ?, 'access', DATE_ADD(NOW(), INTERVAL 1 HOUR), ?)`,
      [blacklistId, tokenJti, reason]
    );

    // 记录管理员操作日志
    const { logSuccess } = await import('./audit');
    await logSuccess({
      userId: adminUserId,
      username: 'admin', // 手动操作时使用admin用户名
      action: 'MANUAL_BLACKLIST_TOKEN' as any,
      resourceType: 'token',
      resourceId: tokenJti,
      details: { reason },
      ipAddress: '127.0.0.1', // 实际应用中应该从请求中获取
      userAgent: 'system' // 系统操作
    });

    console.log(`管理员手动将Token加入黑名单: ${tokenJti}, 原因: ${reason}`);
  } catch (error) {
    console.error('手动加入Token黑名单失败:', error);
    throw error;
  }
}