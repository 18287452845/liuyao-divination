/**
 * 安全管理控制器
 * 处理安全设置、账号锁定、密码重置、双因素认证等
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

/**
 * 获取安全设置
 */
export async function getSecuritySettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    // 查询用户安全设置
    const user: any = await queryOne(
      `SELECT id, username, email, email_verified, phone, phone_verified, 
              two_factor_enabled, login_fail_count, locked_until
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 查询用户活跃会话数
    const sessionCount: any = await queryOne(
      'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    // 查询最近登录记录
    const recentLogins: any = await query(
      `SELECT login_time, ip_address, login_status, user_agent
       FROM login_logs 
       WHERE user_id = ? 
       ORDER BY login_time DESC 
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.email_verified,
          phone: user.phone,
          phoneVerified: user.phone_verified,
          twoFactorEnabled: user.two_factor_enabled,
          loginAttempts: user.login_fail_count,
          lockedUntil: user.locked_until,
        },
        activeSessionCount: sessionCount?.count || 0,
        recentLogins,
      },
    });
  } catch (error) {
    console.error('获取安全设置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取安全设置失败',
    });
  }
}

/**
 * 启用双因素认证
 */
export async function enableTwoFactor(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    // 生成密钥（这里简化处理，实际应该使用专业的2FA库）
    const secret = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);

    // 更新用户的双因素认证设置
    await query(
      'UPDATE users SET two_factor_secret = ?, two_factor_enabled = 1 WHERE id = ?',
      [secret, userId]
    );

    res.json({
      success: true,
      message: '双因素认证已启用',
      data: {
        secret, // 实际应用中应该只显示一次，让用户保存
        qrCode: `otpauth://totp/LiuYao:${req.user?.username}?secret=${secret}&issuer=LiuYao`, // 简化的QR码内容
      },
    });
  } catch (error) {
    console.error('启用双因素认证错误:', error);
    res.status(500).json({
      success: false,
      message: '启用双因素认证失败',
    });
  }
}

/**
 * 禁用双因素认证
 */
export async function disableTwoFactor(req: Request, res: Response): Promise<void> {
  try {
    const { password } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: '请提供密码确认',
      });
      return;
    }

    // 验证密码
    const user: any = await queryOne(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '密码错误',
      });
      return;
    }

    // 禁用双因素认证
    await query(
      'UPDATE users SET two_factor_secret = NULL, two_factor_enabled = 0 WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '双因素认证已禁用',
    });
  } catch (error) {
    console.error('禁用双因素认证错误:', error);
    res.status(500).json({
      success: false,
      message: '禁用双因素认证失败',
    });
  }
}

/**
 * 锁定用户账号
 */
export async function lockUserAccount(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { reason, lockHours = 24 } = req.body;

    // 检查权限
    if (!req.user?.roles.includes('admin')) {
      res.status(403).json({
        success: false,
        message: '权限不足',
      });
      return;
    }

    // 检查目标用户是否存在
    const targetUser: any = await queryOne(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 防止锁定管理员账号
    if (targetUser.username === 'admin') {
      res.status(403).json({
        success: false,
        message: '不能锁定管理员账号',
      });
      return;
    }

    // 设置锁定时间
    const lockedUntil = new Date();
    lockedUntil.setHours(lockedUntil.getHours() + lockHours);

    // 锁定账号（仅锁定到期时间，不修改 status；status 用于禁用/启用账号）
    await query(
      'UPDATE users SET locked_until = ?, login_fail_count = 0 WHERE id = ?',
      [lockedUntil, userId]
    );

    // 使该用户所有会话失效
    const userSessions: any = await query(
      'SELECT * FROM user_sessions WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    for (const session of userSessions) {
      await query(
        'UPDATE user_sessions SET is_active = 0 WHERE id = ?',
        [session.id]
      );

      if (session.session_token) {
        const blacklistId = uuidv4();
        await query(
          `INSERT INTO token_blacklist (id, token_jti, user_id, token_type, expires_at, reason)
           VALUES (?, ?, ?, 'access', ?, ?)`,
          [blacklistId, session.session_token, userId, session.expires_at, reason || '账号被锁定']
        );
      }
    }

    res.json({
      success: true,
      message: `用户账号已锁定 ${lockHours} 小时`,
      data: {
        userId,
        lockedUntil,
        invalidatedSessions: userSessions.length,
      },
    });
  } catch (error) {
    console.error('锁定用户账号错误:', error);
    res.status(500).json({
      success: false,
      message: '锁定用户账号失败',
    });
  }
}

/**
 * 解锁用户账号
 */
export async function unlockUserAccount(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    // 检查权限
    if (!req.user?.roles.includes('admin')) {
      res.status(403).json({
        success: false,
        message: '权限不足',
      });
      return;
    }

    // 检查目标用户是否存在
    const targetUser: any = await queryOne(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 解锁账号
    await query(
      'UPDATE users SET locked_until = NULL, login_fail_count = 0 WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '用户账号已解锁',
      data: {
        userId,
        unlockedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('解锁用户账号错误:', error);
    res.status(500).json({
      success: false,
      message: '解锁用户账号失败',
    });
  }
}

/**
 * 强制用户重置密码
 */
export async function forcePasswordReset(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { newPassword, requireChangeOnLogin = true } = req.body;

    // 检查权限
    if (!req.user?.roles.includes('admin')) {
      res.status(403).json({
        success: false,
        message: '权限不足',
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: '新密码长度至少为6个字符',
      });
      return;
    }

    // 检查目标用户是否存在
    const targetUser: any = await queryOne(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await query(
      'UPDATE users SET password = ?, login_fail_count = 0 WHERE id = ?',
      [hashedPassword, userId]
    );

    // 使该用户所有会话失效（强制重新登录）
    const userSessions: any = await query(
      'SELECT * FROM user_sessions WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    for (const session of userSessions) {
      await query(
        'UPDATE user_sessions SET is_active = 0 WHERE id = ?',
        [session.id]
      );

      if (session.session_token) {
        const blacklistId = uuidv4();
        await query(
          `INSERT INTO token_blacklist (id, token_jti, user_id, token_type, expires_at, reason)
           VALUES (?, ?, ?, 'access', ?, '管理员强制重置密码')`,
          [blacklistId, session.session_token, userId, session.expires_at]
        );
      }
    }

    res.json({
      success: true,
      message: '用户密码已重置',
      data: {
        userId,
        resetAt: new Date(),
        invalidatedSessions: userSessions.length,
        requireChangeOnLogin,
      },
    });
  } catch (error) {
    console.error('强制重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '强制重置密码失败',
    });
  }
}

/**
 * 获取安全审计报告
 */
export async function getSecurityAuditReport(req: Request, res: Response): Promise<void> {
  try {
    // 检查权限
    if (!req.user?.roles.includes('admin')) {
      res.status(403).json({
        success: false,
        message: '权限不足',
      });
      return;
    }

    const { startDate, endDate, reportType = 'summary' } = req.query;

    let whereClause = '';
    let params: any[] = [];

    if (startDate) {
      whereClause += ' WHERE login_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += whereClause ? ' AND login_time <= ?' : ' WHERE login_time <= ?';
      params.push(endDate);
    }

    // 登录统计
    const loginStats: any = await queryOne(
      `SELECT 
         COUNT(*) as total_logins,
         SUM(CASE WHEN login_status = 1 THEN 1 ELSE 0 END) as successful_logins,
         SUM(CASE WHEN login_status = 0 THEN 1 ELSE 0 END) as failed_logins,
         COUNT(DISTINCT user_id) as unique_users
       FROM login_logs ${whereClause}`,
      params
    );

    // 失败登录原因统计
    const failureReasons: any = await query(
      `SELECT failure_reason, COUNT(*) as count
       FROM login_logs 
       WHERE login_status = 0 ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
       GROUP BY failure_reason
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    // 可疑IP统计（失败登录次数多的IP）
    const suspiciousIPs: any = await query(
      `SELECT ip_address, COUNT(*) as failed_count, COUNT(DISTINCT username) as affected_users
       FROM login_logs 
       WHERE login_status = 0 ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
       GROUP BY ip_address
       HAVING failed_count >= 5
       ORDER BY failed_count DESC
       LIMIT 20`,
      params
    );

    // 账号锁定统计
    const lockedAccounts: any = await query(
      `SELECT id, username, login_fail_count, locked_until
       FROM users 
       WHERE locked_until > NOW()`
    );

    // 活跃会话统计
    const activeSessions: any = await queryOne(
      'SELECT COUNT(*) as count FROM user_sessions WHERE is_active = 1'
    );

    // 最近安全事件
    const recentSecurityEvents: any = await query(
      `SELECT '登录失败' as event_type, login_time as event_time, username, ip_address, failure_reason as details
       FROM login_logs 
       WHERE login_status = 0 
       ORDER BY login_time DESC 
       LIMIT 20`
    );

    const report = {
      period: {
        startDate: startDate || '所有时间',
        endDate: endDate || '现在',
      },
      loginStatistics: {
        totalLogins: loginStats?.total_logins || 0,
        successfulLogins: loginStats?.successful_logins || 0,
        failedLogins: loginStats?.failed_logins || 0,
        uniqueUsers: loginStats?.unique_users || 0,
        successRate: loginStats?.total_logins > 0 ? 
          ((loginStats?.successful_logins / loginStats?.total_logins) * 100).toFixed(2) + '%' : '0%',
      },
      failureReasons,
      suspiciousIPs,
      lockedAccounts: {
        count: lockedAccounts.length,
        accounts: lockedAccounts,
      },
      activeSessions: activeSessions?.count || 0,
      recentSecurityEvents,
      generatedAt: new Date(),
    };

    if (reportType === 'csv') {
      // 生成CSV格式
      const csvData = [
        '安全审计报告',
        `生成时间,${report.generatedAt}`,
        `统计周期,${report.period.startDate} - ${report.period.endDate}`,
        '',
        '登录统计',
        `总登录次数,${report.loginStatistics.totalLogins}`,
        `成功登录,${report.loginStatistics.successfulLogins}`,
        `失败登录,${report.loginStatistics.failedLogins}`,
        `独立用户,${report.loginStatistics.uniqueUsers}`,
        `成功率,${report.loginStatistics.successRate}`,
        '',
        '账号锁定',
        `锁定账号数,${report.lockedAccounts.count}`,
        `活跃会话数,${report.activeSessions}`,
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="security_audit_report_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csvData);
    } else {
      res.json({
        success: true,
        data: report,
      });
    }
  } catch (error) {
    console.error('获取安全审计报告错误:', error);
    res.status(500).json({
      success: false,
      message: '获取安全审计报告失败',
    });
  }
}