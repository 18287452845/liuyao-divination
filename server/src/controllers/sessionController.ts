/**
 * 会话管理控制器
 * 处理用户会话的查询、管理、踢下线等操作
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';

/**
 * 获取用户会话列表
 */
export async function getUserSessions(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);

    // 查询总数
    const countResult: any = await queryOne(
      'SELECT COUNT(*) as total FROM user_sessions WHERE user_id = ? AND is_active = 1',
      [userId]
    );
    const total = countResult?.total || 0;

    // 查询会话列表
    const sessions: any = await query(
      `SELECT s.*
       FROM user_sessions s
       WHERE s.user_id = ? AND s.is_active = 1
       ORDER BY s.last_activity DESC
       LIMIT ? OFFSET ?`,
      [userId, Number(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        list: sessions,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取用户会话错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户会话失败',
    });
  }
}

/**
 * 获取所有活跃会话（管理员）
 */
export async function getAllActiveSessions(req: Request, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      search = '', 
      startDate = '', 
      endDate = ''
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    let whereClauses: string[] = ['s.is_active = 1'];
    let params: any[] = [];

    // 搜索条件
    if (search) {
      whereClauses.push('(u.username LIKE ? OR u.real_name LIKE ? OR s.ip_address LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 时间范围过滤
    if (startDate) {
      whereClauses.push('s.last_activity >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('s.last_activity <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total 
       FROM user_sessions s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询会话列表
    const sessions: any = await query(
      `SELECT s.*, u.username, u.real_name
       FROM user_sessions s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.last_activity DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        list: sessions,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取活跃会话错误:', error);
    res.status(500).json({
      success: false,
      message: '获取活跃会话失败',
    });
  }
}

/**
 * 创建新会话
 */
export async function createSession(
  userId: string,
  sessionToken: string,
  deviceInfo: any,
  ipAddress: string,
  userAgent: string,
  expiresInDays: number = 7
): Promise<string> {
  try {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await query(
      `INSERT INTO user_sessions (id, user_id, session_token, device_info, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        sessionToken,
        JSON.stringify(deviceInfo),
        ipAddress,
        userAgent,
        expiresAt
      ]
    );

    return sessionId;
  } catch (error) {
    console.error('创建会话错误:', error);
    throw new Error('创建会话失败');
  }
}

/**
 * 更新会话最后活跃时间
 */
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    await query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE session_token = ? AND is_active = 1',
      [sessionToken]
    );
  } catch (error) {
    console.error('更新会话活跃时间错误:', error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 使会话失效（踢下线）
 */
export async function invalidateSession(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    // 检查会话是否存在
    const session: any = await queryOne(
      'SELECT * FROM user_sessions WHERE id = ?',
      [sessionId]
    );

    if (!session) {
      res.status(404).json({
        success: false,
        message: '会话不存在',
      });
      return;
    }

    // 非管理员只能操作自己的会话
    if (!req.user?.roles.includes('admin') && session.user_id !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: '只能操作自己的会话',
      });
      return;
    }

    // 使会话失效
    await query(
      'UPDATE user_sessions SET is_active = 0 WHERE id = ?',
      [sessionId]
    );

    // 将相关token加入黑名单
    if (session.session_token) {
      const blacklistId = uuidv4();
      await query(
        `INSERT INTO token_blacklist (id, token_jti, user_id, token_type, expires_at, reason)
         VALUES (?, ?, ?, 'access', ?, '会话被管理员踢下线')`,
        [blacklistId, session.session_token, session.user_id, session.expires_at]
      );
    }

    res.json({
      success: true,
      message: '会话已失效',
    });
  } catch (error) {
    console.error('使会话失效错误:', error);
    res.status(500).json({
      success: false,
      message: '使会话失效失败',
    });
  }
}

/**
 * 使用户所有其他会话失效
 */
export async function invalidateOtherSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    // 查找用户的所有其他活跃会话
    const otherSessions: any = await query(
      'SELECT * FROM user_sessions WHERE user_id = ? AND is_active = 1 AND session_token != ?',
      [userId, req.headers.authorization?.replace('Bearer ', '')]
    );

    // 使其他会话失效
    for (const session of otherSessions) {
      await query(
        'UPDATE user_sessions SET is_active = 0 WHERE id = ?',
        [session.id]
      );

      // 将相关token加入黑名单
      if (session.session_token) {
        const blacklistId = uuidv4();
        await query(
          `INSERT INTO token_blacklist (id, token_jti, user_id, token_type, expires_at, reason)
           VALUES (?, ?, ?, 'access', ?, '用户主动下线其他设备')`,
          [blacklistId, session.session_token, session.user_id, session.expires_at]
        );
      }
    }

    res.json({
      success: true,
      message: `已使 ${otherSessions.length} 个其他会话失效`,
      data: {
        invalidatedCount: otherSessions.length,
      },
    });
  } catch (error) {
    console.error('使其他会话失效错误:', error);
    res.status(500).json({
      success: false,
      message: '使其他会话失效失败',
    });
  }
}

/**
 * 使用户所有会话失效
 */
export async function invalidateAllUserSessions(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    // 检查权限（管理员或用户本人）
    if (!req.user?.roles.includes('admin') && userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: '权限不足',
      });
      return;
    }

    // 查找用户的所有活跃会话
    const userSessions: any = await query(
      'SELECT * FROM user_sessions WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    // 使所有会话失效
    for (const session of userSessions) {
      await query(
        'UPDATE user_sessions SET is_active = 0 WHERE id = ?',
        [session.id]
      );

      // 将相关token加入黑名单
      if (session.session_token) {
        const blacklistId = uuidv4();
        await query(
          `INSERT INTO token_blacklist (id, token_jti, user_id, token_type, expires_at, reason)
           VALUES (?, ?, ?, 'access', ?, '管理员强制下线')`,
          [blacklistId, session.session_token, session.user_id, session.expires_at]
        );
      }
    }

    res.json({
      success: true,
      message: `已使用户 ${userId} 的所有会话失效`,
      data: {
        invalidatedCount: userSessions.length,
      },
    });
  } catch (error) {
    console.error('使用户所有会话失效错误:', error);
    res.status(500).json({
      success: false,
      message: '使用户所有会话失效失败',
    });
  }
}

/**
 * 清理过期会话
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result: any = await query(
      'DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = 0'
    );
    return result.affectedRows || 0;
  } catch (error) {
    console.error('清理过期会话错误:', error);
    return 0;
  }
}

/**
 * 获取会话统计信息
 */
export async function getSessionStatistics(req: Request, res: Response): Promise<void> {
  try {
    // 总活跃会话数
    const totalActiveResult: any = await queryOne(
      'SELECT COUNT(*) as count FROM user_sessions WHERE is_active = 1'
    );
    const totalActive = totalActiveResult?.count || 0;

    // 今日活跃会话数
    const todayActiveResult: any = await queryOne(
      `SELECT COUNT(*) as count FROM user_sessions 
       WHERE is_active = 1 AND DATE(last_activity) = CURDATE()`
    );
    const todayActive = todayActiveResult?.count || 0;

    // 本周活跃会话数
    const weekActiveResult: any = await queryOne(
      `SELECT COUNT(*) as count FROM user_sessions 
       WHERE is_active = 1 AND last_activity >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const weekActive = weekActiveResult?.count || 0;

    // 按设备类型统计
    const deviceStats: any = await query(
      `SELECT 
         CASE 
           WHEN user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' OR user_agent LIKE '%iPhone%' THEN '移动端'
           ELSE '桌面端'
         END as device_type,
         COUNT(*) as count
       FROM user_sessions 
       WHERE is_active = 1
       GROUP BY device_type`
    );

    // 按日期统计最近7天的活跃会话
    const dailyStats: any = await query(
      `SELECT 
         DATE(last_activity) as date,
         COUNT(*) as count
       FROM user_sessions 
       WHERE is_active = 1 AND last_activity >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(last_activity)
       ORDER BY date DESC`
    );

    res.json({
      success: true,
      data: {
        totalActive,
        todayActive,
        weekActive,
        deviceStats,
        dailyStats,
      },
    });
  } catch (error) {
    console.error('获取会话统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取会话统计失败',
    });
  }
}