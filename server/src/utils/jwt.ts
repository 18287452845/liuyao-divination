import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'liuyao-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface TokenPayload {
  userId: string;
  username: string;
  roles?: string[];
  jti?: string;
  exp?: number;
}

export interface VerifyResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

function signToken(payload: TokenPayload, expiresIn: string): string {
  const { jti, exp, ...rest } = payload;

  return jwt.sign(rest, JWT_SECRET, {
    expiresIn,
    issuer: 'liuyao-system',
    audience: 'liuyao-client',
    jwtid: jti || randomUUID(),
  } as jwt.SignOptions);
}

export function generateAccessToken(payload: TokenPayload): string {
  return signToken(payload, JWT_EXPIRES_IN);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return signToken(payload, JWT_REFRESH_EXPIRES_IN);
}

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
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Token无效',
      };
    }

    return {
      valid: false,
      error: 'Token校验失败',
    };
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return authHeader;
}
