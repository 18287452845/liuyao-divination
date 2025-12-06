/**
 * 认证中间件
 * 用于验证JWT token和用户权限
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';
import { query } from '../models/database';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';

/**
 * 扩展Express Request接口，添加用户信息
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
 * 认证中间件 - 验证用户登录状态
 */
export async function authenticate(
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
        message: 'Token已失效，请重新登录',
      });
      return;
    }

    // 查询用户信息和角色
    const userResult = await query(
      `SELECT u.id, u.username, u.status,
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
    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '认证过程发生错误',
    });
  }
}

/**
 * 权限检查中间件工厂函数
 * @param requiredPermissions - 需要的权限列表
 * @returns Express中间件
 */
export function requirePermissions(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    // 管理员拥有所有权限
    if (req.user.roles.includes('admin')) {
      next();
      return;
    }

    // 检查是否拥有所需权限
    const hasPermission = requiredPermissions.every((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: '权限不足',
        requiredPermissions,
      });
      return;
    }

    next();
  };
}

/**
 * 角色检查中间件工厂函数
 * @param requiredRoles - 需要的角色列表
 * @returns Express中间件
 */
export function requireRoles(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    // 检查是否拥有所需角色
    const hasRole = requiredRoles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: '角色权限不足',
        requiredRoles,
      });
      return;
    }

    next();
  };
}

/**
 * 可选认证中间件 - 如果有token则验证，没有token则跳过
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      // 没有token，直接跳过
      next();
      return;
    }

    // 有token，尝试验证
    const verifyResult = verifyToken(token);

    if (verifyResult.valid) {
      const payload = verifyResult.payload!;

      // 查询用户信息
      const userResult = await query(
        `SELECT u.id, u.username, u.status,
                GROUP_CONCAT(DISTINCT r.role_code) as roles
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id AND r.status = 1
         WHERE u.id = ? AND u.status = 1
         GROUP BY u.id`,
        [payload.userId]
      ) as any[];

      if (userResult && userResult.length > 0) {
        const user = userResult[0];

        // 查询权限
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

        req.user = {
          userId: user.id,
          username: user.username,
          roles,
          permissions,
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证出错也继续
    next();
  }
}
