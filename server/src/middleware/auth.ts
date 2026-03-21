import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { query } from '../models/database';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';

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

async function loadUserContext(userId: string) {
  const userResult = (await query(
    `SELECT u.id, u.username, u.status, GROUP_CONCAT(DISTINCT r.role_code) as roles
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id AND r.status = 1
     WHERE u.id = ?
     GROUP BY u.id`,
    [userId]
  )) as Array<{
    id: string;
    username: string;
    status: number;
    roles: string | null;
  }>;

  if (!userResult || userResult.length === 0) {
    return null;
  }

  const permissionResult = (await query(
    `SELECT DISTINCT p.permission_code
     FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     JOIN roles r ON ur.role_id = r.id AND r.status = 1
     JOIN role_permissions rp ON r.id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.id AND p.status = 1
     WHERE u.id = ?`,
    [userId]
  )) as Array<{ permission_code: string }>;

  const user = userResult[0];

  return {
    userId: user.id,
    username: user.username,
    status: user.status,
    roles: user.roles ? user.roles.split(',') : [],
    permissions: permissionResult.map((row) => row.permission_code),
  };
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
      return;
    }

    const verifyResult = verifyToken(token);

    if (!verifyResult.valid || !verifyResult.payload) {
      res.status(401).json({
        success: false,
        message: verifyResult.error || '认证失败',
      });
      return;
    }

    if (verifyResult.payload.jti && (await isTokenBlacklisted(verifyResult.payload.jti))) {
      res.status(401).json({
        success: false,
        message: '认证令牌已失效',
      });
      return;
    }

    const userContext = await loadUserContext(verifyResult.payload.userId);

    if (!userContext) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    if (userContext.status !== 1) {
      res.status(403).json({
        success: false,
        message: '账号已被禁用',
      });
      return;
    }

    req.user = {
      userId: userContext.userId,
      username: userContext.username,
      roles: userContext.roles,
      permissions: userContext.permissions,
    };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
    });
  }
}

export function requirePermissions(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    if (req.user.roles.includes('admin')) {
      next();
      return;
    }

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

export function requireRoles(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

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

export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    const verifyResult = verifyToken(token);

    if (!verifyResult.valid || !verifyResult.payload) {
      next();
      return;
    }

    if (verifyResult.payload.jti && (await isTokenBlacklisted(verifyResult.payload.jti))) {
      next();
      return;
    }

    const userContext = await loadUserContext(verifyResult.payload.userId);

    if (userContext && userContext.status === 1) {
      req.user = {
        userId: userContext.userId,
        username: userContext.username,
        roles: userContext.roles,
        permissions: userContext.permissions,
      };
    }

    next();
  } catch (error) {
    next();
  }
}
