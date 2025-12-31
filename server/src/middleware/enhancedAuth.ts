/**
 * 增强的认证中间件
 * 包含登录失败次数限制、账号锁定、Token黑名单验证等功能
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';
import { query, queryOne } from '../models/database';
import { recordLoginLog } from '../controllers/logController';

/**
 * 扩展Express Request接口
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

/**
 * 登录失败次数限制和账号锁定检查
 */
export async function checkLoginAttempts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username } = req.body;

    if (!username) {
      next();
      return;
    }

    // 查询用户登录失败次数和锁定状态
    const user: any = await queryOne(
      'SELECT id, login_fail_count, locked_until FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      next();
      return;
    }

    // 检查账号是否被锁定
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / (1000 * 60 * 60));
      
      await recordLoginLog(
        user.id,
        username,
        req.ip || req.connection.remoteAddress || '',
        req.get('User-Agent') || '',
        0,
        `账号已锁定，剩余时间: ${remainingTime} 小时`
      );

      res.status(423).json({
        success: false,
        message: `账号已被锁定，请在 ${remainingTime} 小时后重试`,
        lockedUntil: user.locked_until,
        remainingHours: remainingTime,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('检查登录状态错误:', error);
    next();
  }
}

/**
 * 处理登录失败
 */
export async function handleLoginFailure(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username } = req.body;

    if (!username) {
      next();
      return;
    }

    // 查询用户
    const user: any = await queryOne(
      'SELECT id, login_fail_count FROM users WHERE username = ?',
      [username]
    );

    if (user) {
      // 增加登录失败次数
      const newAttempts = (user.login_fail_count || 0) + 1;
      let lockedUntil = null;

      // 如果失败次数达到5次，锁定账号24小时
      if (newAttempts >= 5) {
        const lockDate = new Date();
        lockDate.setHours(lockDate.getHours() + 24);
        lockedUntil = lockDate;

        await query(
          'UPDATE users SET login_fail_count = ?, locked_until = ? WHERE id = ?',
          [newAttempts, lockedUntil, user.id]
        );

        await recordLoginLog(
          user.id,
          username,
          req.ip || req.connection.remoteAddress || '',
          req.get('User-Agent') || '',
          0,
          `登录失败次数过多，账号已锁定24小时`
        );

        res.status(423).json({
          success: false,
          message: '登录失败次数过多，账号已被锁定24小时',
          lockedUntil: lockedUntil,
          remainingHours: 24,
        });
        return;
      } else {
        await query(
          'UPDATE users SET login_fail_count = ? WHERE id = ?',
          [newAttempts, user.id]
        );

        await recordLoginLog(
          user.id,
          username,
          req.ip || req.connection.remoteAddress || '',
          req.get('User-Agent') || '',
          0,
          `登录失败，当前失败次数: ${newAttempts}/5`
        );
      }
    }

    next();
  } catch (error) {
    console.error('处理登录失败错误:', error);
    next();
  }
}

/**
 * 检查Token是否在黑名单中
 */
async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const result: any = await queryOne(
      'SELECT id FROM token_blacklist WHERE token_jti = ?',
      [jti]
    );
    return !!result;
  } catch (error) {
    console.error('检查Token黑名单错误:', error);
    return false;
  }
}

/**
 * 增强的认证中间件
 */
export async function enhancedAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 从header中提取token
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
      return;
    }

    // 验证token
    const verifyResult = verifyToken(token);

    if (!verifyResult.valid) {
      res.status(401).json({
        success: false,
        message: verifyResult.error || '认证失败',
      });
      return;
    }

    const payload = verifyResult.payload!;

    // 检查token是否在黑名单中
    if (payload.jti && await isTokenBlacklisted(payload.jti)) {
      res.status(401).json({
        success: false,
        message: '认证令牌已失效',
      });
      return;
    }

    // 查询用户信息和角色
    const userResult = await query(
      `SELECT u.id, u.username, u.status, u.locked_until,
              GROUP_CONCAT(DISTINCT r.role_code) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id AND r.status = 1
       WHERE u.id = ?
       GROUP BY u.id`,
      [payload.userId]
    ) as any[];

    if (!userResult || userResult.length === 0) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const user = userResult[0];

    // 检查用户状态
    if (user.status !== 1) {
      res.status(403).json({
        success: false,
        message: '账号已被禁用',
      });
      return;
    }

    // 检查账号是否被锁定
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / (1000 * 60 * 60));
      res.status(423).json({
        success: false,
        message: `账号已被锁定，请在 ${remainingTime} 小时后重试`,
        lockedUntil: user.locked_until,
        remainingHours: remainingTime,
      });
      return;
    }

    // 查询用户权限
    const permissionResult = await query(
      `SELECT DISTINCT p.permission_code
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id AND r.status = 1
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id AND p.status = 1
       WHERE u.id = ?`,
      [payload.userId]
    ) as any[];

    const permissions = permissionResult.map((row: any) => row.permission_code);
    const roles = user.roles ? user.roles.split(',') : [];

    // 将用户信息附加到request对象
    req.user = {
      userId: user.id,
      username: user.username,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    console.error('增强认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '认证过程发生错误',
    });
  }
}

/**
 * 重置登录失败次数（登录成功时调用）
 */
export async function resetLoginAttempts(userId: string): Promise<void> {
  try {
    await query(
      'UPDATE users SET login_fail_count = 0, locked_until = NULL WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('重置登录失败次数错误:', error);
  }
}

/**
 * 将Token加入黑名单
 */
export async function blacklistToken(
  jti: string,
  userId: string,
  tokenType: 'access' | 'refresh',
  expiresAt: Date,
  reason?: string
): Promise<void> {
  try {
    const { v4: uuidv4 } = await import('uuid');
    const blacklistId = uuidv4();

    await query(
      `INSERT INTO token_blacklist (id, token_jti, user_id, token_type, expires_at, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [blacklistId, jti, userId, tokenType, expiresAt, reason || '用户登出']
    );
  } catch (error) {
    console.error('将Token加入黑名单错误:', error);
  }
}

/**
 * 清理过期的Token黑名单记录
 */
export async function cleanupExpiredBlacklist(): Promise<number> {
  try {
    const result: any = await query(
      'DELETE FROM token_blacklist WHERE expires_at < NOW()'
    );
    return result.affectedRows || 0;
  } catch (error) {
    console.error('清理过期Token黑名单错误:', error);
    return 0;
  }
}