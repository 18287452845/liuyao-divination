/**
 * JWT工具类
 * 用于生成和验证JSON Web Token
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// JWT配置
const JWT_SECRET: string = process.env.JWT_SECRET || 'liuyao-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'; // 默认7天
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // 刷新token 30天

/**
 * Token载荷接口
 */
export interface TokenPayload {
  userId: string;
  username: string;
  roles?: string[];
  jti?: string; // JWT ID，用于黑名单
  iat?: number; // 签发时间
  exp?: number; // 过期时间
}

/**
 * 验证结果接口
 */
export interface VerifyResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

/**
 * 生成访问令牌
 * @param payload - Token载荷数据
 * @returns JWT token字符串
 */
export function generateAccessToken(payload: TokenPayload): string {
  // jti应该放在payload中，而不是options中
  const payloadWithJti = {
    ...payload,
    jti: uuidv4(),
  };
  
  return jwt.sign(payloadWithJti, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'liuyao-system',
    audience: 'liuyao-client',
  } as jwt.SignOptions);
}

/**
 * 生成刷新令牌
 * @param payload - Token载荷数据
 * @returns JWT refresh token字符串
 */
export function generateRefreshToken(payload: TokenPayload): string {
  // jti应该放在payload中，而不是options中
  const payloadWithJti = {
    ...payload,
    jti: uuidv4(),
  };
  
  return jwt.sign(payloadWithJti, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'liuyao-system',
    audience: 'liuyao-client',
  } as jwt.SignOptions);
}

/**
 * 验证Token
 * @param token - JWT token字符串
 * @returns 验证结果
 */
export function verifyToken(token: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'liuyao-system',
      audience: 'liuyao-client',
    }) as TokenPayload;

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token已过期',
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Token无效',
      };
    } else {
      return {
        valid: false,
        error: '验证失败',
      };
    }
  }
}

/**
 * 解码Token（不验证签名，仅解析）
 * @param token - JWT token字符串
 * @returns Token载荷或null
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 从Authorization header中提取token
 * @param authHeader - Authorization header值
 * @returns token字符串或null
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // 支持 "Bearer <token>" 格式
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  // 直接返回token
  return authHeader;
}
