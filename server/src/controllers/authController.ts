import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool, query, queryOne } from '../models/database';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
} from '../utils/jwt';
import { logSuccess, logFailure, AuditAction } from '../utils/audit';
import { addToBlacklist, isTokenBlacklisted } from '../utils/tokenBlacklist';
import { recordLoginLog } from './logController';
import { validatePassword } from '../utils/passwordPolicy';
import { validateInviteCode } from '../utils/inviteCodes';
import { diagnosisAndRepair, DBError } from '../utils/dbAutoRepair';

const MAX_LOGIN_FAIL_COUNT = 5;
const LOGIN_LOCK_MINUTES = 30;

interface RoleRow {
  role_code: string;
  role_name: string;
}

interface UserAuthRow {
  id: string;
  username: string;
  password: string;
  status: number;
  login_fail_count?: number | null;
  locked_until?: string | Date | null;
}

function getRequestIp(req: Request): string {
  return req.ip || req.connection.remoteAddress || '';
}

function getUserAgent(req: Request): string {
  return req.get('User-Agent') || '';
}

function getTokenExpiryDate(exp?: number, fallbackMs = 60 * 60 * 1000): Date {
  return exp ? new Date(exp * 1000) : new Date(Date.now() + fallbackMs);
}

function normalizeHeaderToken(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0];
  }

  return null;
}

async function getUserRoles(userId: string): Promise<RoleRow[]> {
  return (await query(
    `SELECT r.role_code, r.role_name
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ? AND r.status = 1`,
    [userId]
  )) as RoleRow[];
}

async function createSessionRecord(
  userId: string,
  accessToken: string,
  ipAddress: string,
  userAgent: string
): Promise<string | undefined> {
  try {
    const verifyResult = verifyToken(accessToken);
    const sessionToken = verifyResult.valid ? verifyResult.payload?.jti : undefined;

    if (!sessionToken) {
      return undefined;
    }

    const sessionId = uuidv4();
    const expiresAt = getTokenExpiryDate(verifyResult.payload?.exp, 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO user_sessions (id, user_id, session_token, device_info, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, userId, sessionToken, JSON.stringify({}), ipAddress, userAgent, expiresAt]
    );

    return sessionId;
  } catch (error) {
    console.error('Failed to create user session record:', error);
    return undefined;
  }
}

async function blacklistTokenIfNeeded(token: string, userId: string, tokenType: 'access' | 'refresh', reason: string) {
  const verifyResult = verifyToken(token);

  if (!verifyResult.valid || !verifyResult.payload?.jti) {
    return;
  }

  await addToBlacklist({
    tokenJti: verifyResult.payload.jti,
    userId,
    tokenType,
    expiresAt: getTokenExpiryDate(verifyResult.payload.exp),
    reason,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const ipAddress = getRequestIp(req);
  const userAgent = getUserAgent(req);

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      await logFailure({
        username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: 'missing_credentials' },
        ipAddress,
        userAgent,
        errorMessage: '用户名和密码不能为空',
      });

      await recordLoginLog(null, username || '', ipAddress, userAgent, 0, '用户名和密码不能为空');

      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    const user = (await queryOne(
      'SELECT id, username, password, status, login_fail_count, locked_until FROM users WHERE username = ?',
      [username]
    )) as UserAuthRow | null;

    if (!user) {
      await logFailure({
        username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: 'user_not_found' },
        ipAddress,
        userAgent,
        errorMessage: '用户名或密码错误',
      });

      await recordLoginLog(null, username, ipAddress, userAgent, 0, '用户不存在');

      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logFailure({
        userId: user.id,
        username: user.username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: 'account_locked', lockedUntil: user.locked_until },
        ipAddress,
        userAgent,
        errorMessage: '账号已被锁定，请稍后再试',
      });

      await recordLoginLog(user.id, user.username, ipAddress, userAgent, 0, '账号已被锁定');

      res.status(423).json({
        success: false,
        message: '账号已被锁定，请稍后再试',
        lockedUntil: user.locked_until,
      });
      return;
    }

    if (user.status !== 1) {
      await logFailure({
        userId: user.id,
        username: user.username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: 'user_disabled', status: user.status },
        ipAddress,
        userAgent,
        errorMessage: '账号已被禁用，请联系管理员',
      });

      await recordLoginLog(user.id, user.username, ipAddress, userAgent, 0, '账号已被禁用');

      res.status(403).json({
        success: false,
        message: '账号已被禁用，请联系管理员',
      });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      const newFailCount = Number(user.login_fail_count || 0) + 1;

      if (newFailCount >= MAX_LOGIN_FAIL_COUNT) {
        const lockedUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);

        await query('UPDATE users SET login_fail_count = ?, locked_until = ? WHERE id = ?', [
          newFailCount,
          lockedUntil,
          user.id,
        ]);

        await logFailure({
          userId: user.id,
          username: user.username,
          action: AuditAction.LOGIN,
          resourceType: 'auth',
          details: { reason: 'password_incorrect_locked', failCount: newFailCount },
          ipAddress,
          userAgent,
          errorMessage: `密码错误次数过多，账号已锁定 ${LOGIN_LOCK_MINUTES} 分钟`,
        });

        await recordLoginLog(
          user.id,
          user.username,
          ipAddress,
          userAgent,
          0,
          `密码错误次数过多，账号已锁定 ${LOGIN_LOCK_MINUTES} 分钟`
        );

        res.status(423).json({
          success: false,
          message: `密码错误次数过多，账号已锁定 ${LOGIN_LOCK_MINUTES} 分钟`,
        });
        return;
      }

      await query('UPDATE users SET login_fail_count = ? WHERE id = ?', [newFailCount, user.id]);

      const remainingAttempts = MAX_LOGIN_FAIL_COUNT - newFailCount;

      await logFailure({
        userId: user.id,
        username: user.username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: 'password_incorrect', failCount: newFailCount, remainingAttempts },
        ipAddress,
        userAgent,
        errorMessage: `用户名或密码错误，还剩 ${remainingAttempts} 次机会`,
      });

      await recordLoginLog(
        user.id,
        user.username,
        ipAddress,
        userAgent,
        0,
        `用户名或密码错误，还剩 ${remainingAttempts} 次机会`
      );

      res.status(401).json({
        success: false,
        message: `用户名或密码错误，还剩 ${remainingAttempts} 次机会`,
      });
      return;
    }

    await query(
      'UPDATE users SET login_fail_count = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [ipAddress, user.id]
    );

    const roles = await getUserRoles(user.id);
    const roleCodes = roles.map((role) => role.role_code);

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      roles: roleCodes,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      roles: roleCodes,
    });

    const sessionId = await createSessionRecord(user.id, accessToken, ipAddress, userAgent);

    await recordLoginLog(user.id, user.username, ipAddress, userAgent, 1, undefined, sessionId);

    await logSuccess({
      userId: user.id,
      username: user.username,
      action: AuditAction.LOGIN,
      resourceType: 'auth',
      details: { loginIp: ipAddress },
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        userId: user.id,
        username: user.username,
        roles: roles.map((role) => ({ code: role.role_code, name: role.role_name })),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);

    if ((error as DBError)?.code === 'ER_BAD_FIELD_ERROR') {
      const repairResult = await diagnosisAndRepair(
        error as DBError,
        'SELECT id, username, password, status, login_fail_count, locked_until FROM users WHERE username = ?',
        [req.body?.username]
      );

      console.log('\n=== 数据库自动修复结果 ===');
      console.log('状态:', repairResult.success ? '成功' : '失败');
      console.log('信息:', repairResult.message);
      if (repairResult.sqlExecuted) {
        console.log('执行 SQL:', repairResult.sqlExecuted);
      }
      console.log('========================\n');

      if (repairResult.success) {
        res.status(503).json({
          success: false,
          message: '数据库已自动升级，请重新登录',
          retryable: true,
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
    });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const ipAddress = getRequestIp(req);
  const userAgent = getUserAgent(req);

  try {
    const { username, password, email, realName, inviteCode } = req.body;

    if (!inviteCode) {
      res.status(400).json({
        success: false,
        message: '请输入邀请码',
      });
      return;
    }

    const inviteValidation = await validateInviteCode(inviteCode);
    if (!inviteValidation.valid) {
      await logFailure({
        username,
        action: AuditAction.REGISTER,
        resourceType: 'auth',
        details: { reason: 'invalid_invite_code', inviteCode, error: inviteValidation.error },
        ipAddress,
        userAgent,
        errorMessage: inviteValidation.error || '邀请码无效',
      });

      res.status(400).json({
        success: false,
        message: inviteValidation.error || '邀请码无效',
      });
      return;
    }

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({
        success: false,
        message: '用户名长度必须在 3-20 个字符之间',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({
        success: false,
        message: '用户名只能包含字母、数字和下划线',
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: '密码不符合安全要求',
        errors: passwordValidation.errors,
      });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
      return;
    }

    const existingUser = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      await logFailure({
        username,
        action: AuditAction.REGISTER,
        resourceType: 'auth',
        details: { reason: 'username_exists' },
        ipAddress,
        userAgent,
        errorMessage: '用户名已存在',
      });

      res.status(409).json({
        success: false,
        message: '用户名已存在',
      });
      return;
    }

    if (email) {
      const existingEmail = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail) {
        await logFailure({
          username,
          action: AuditAction.REGISTER,
          resourceType: 'auth',
          details: { reason: 'email_exists', email },
          ipAddress,
          userAgent,
          errorMessage: '邮箱已被注册',
        });

        res.status(409).json({
          success: false,
          message: '邮箱已被注册',
        });
        return;
      }
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    const normalizedInviteCode = String(inviteCode).trim().toUpperCase();

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO users (id, username, password, email, real_name, status, last_password_change)
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [userId, username, hashedPassword, email || null, realName || null]
      );

      const [defaultRoleRows] = (await connection.execute(
        "SELECT id FROM roles WHERE role_code = 'user' AND status = 1"
      )) as any[];
      const defaultRole = defaultRoleRows?.[0];

      if (defaultRole) {
        await connection.execute('INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)', [
          uuidv4(),
          userId,
          defaultRole.id,
        ]);
      }

      const [inviteUpdateResult] = (await connection.execute(
        `UPDATE invite_codes
         SET used_count = used_count + 1
         WHERE code = ?
           AND status = 1
           AND (expires_at IS NULL OR expires_at > NOW())
           AND used_count < max_uses`,
        [normalizedInviteCode]
      )) as any[];

      if (!inviteUpdateResult || inviteUpdateResult.affectedRows === 0) {
        throw new Error('邀请码已失效或使用次数已达上限');
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    await logSuccess({
      userId,
      username,
      action: AuditAction.REGISTER,
      resourceType: 'auth',
      details: { email, realName, inviteCode: normalizedInviteCode },
      ipAddress,
      userAgent,
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        userId,
        username,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('邀请码')) {
      await logFailure({
        username: req.body?.username,
        action: AuditAction.REGISTER,
        resourceType: 'auth',
        details: { reason: errorMessage, inviteCode: req.body?.inviteCode },
        ipAddress,
        userAgent,
        errorMessage,
      });

      res.status(400).json({
        success: false,
        message: errorMessage,
      });
      return;
    }

    if ((error as any)?.code === 'ER_DUP_ENTRY' || errorMessage.includes('Duplicate')) {
      res.status(409).json({
        success: false,
        message: '用户名或邮箱已存在',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
    });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const user = (await queryOne(
      `SELECT id, username, email, real_name, avatar, status, last_login_at, created_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    )) as {
      id: string;
      username: string;
      email?: string | null;
      real_name?: string | null;
      avatar?: string | null;
      status: number;
      last_login_at?: string | Date | null;
      created_at?: string | Date | null;
    } | null;

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const roles = await getUserRoles(user.id);

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        realName: user.real_name,
        avatar: user.avatar,
        status: user.status,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        roles: roles.map((role) => ({ code: role.role_code, name: role.role_name })),
        permissions: req.user.permissions,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空',
      });
      return;
    }

    if (oldPassword === newPassword) {
      res.status(400).json({
        success: false,
        message: '新密码不能与旧密码相同',
      });
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: '密码不符合安全要求',
        errors: passwordValidation.errors,
      });
      return;
    }

    const user = (await queryOne('SELECT password FROM users WHERE id = ?', [req.user.userId])) as {
      password: string;
    } | null;

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const isOldPasswordValid = await verifyPassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      res.status(401).json({
        success: false,
        message: '旧密码错误',
      });
      return;
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await query('UPDATE users SET password = ?, last_password_change = NOW() WHERE id = ?', [
      hashedNewPassword,
      req.user.userId,
    ]);

    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.CHANGE_PASSWORD,
      resourceType: 'auth',
      details: {},
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
    });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { email, realName, avatar } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
      return;
    }

    if (email) {
      const existingEmail = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [
        email,
        req.user.userId,
      ]);

      if (existingEmail) {
        res.status(409).json({
          success: false,
          message: '邮箱已被其他用户使用',
        });
        return;
      }
    }

    await query('UPDATE users SET email = ?, real_name = ?, avatar = ? WHERE id = ?', [
      email || null,
      realName || null,
      avatar || null,
      req.user.userId,
    ]);

    res.json({
      success: true,
      message: '资料更新成功',
    });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({
      success: false,
      message: '更新资料失败',
    });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const providedRefreshToken =
      normalizeHeaderToken(req.body?.refreshToken) ||
      normalizeHeaderToken(req.headers['x-refresh-token']) ||
      extractTokenFromHeader(normalizeHeaderToken(req.headers.authorization) || undefined);

    if (!providedRefreshToken) {
      res.status(401).json({
        success: false,
        message: '未提供刷新令牌',
      });
      return;
    }

    const verifyResult = verifyToken(providedRefreshToken);

    if (!verifyResult.valid || !verifyResult.payload) {
      res.status(401).json({
        success: false,
        message: verifyResult.error || '刷新令牌无效',
      });
      return;
    }

    if (verifyResult.payload.jti && (await isTokenBlacklisted(verifyResult.payload.jti))) {
      res.status(401).json({
        success: false,
        message: '刷新令牌已失效',
      });
      return;
    }

    const user = (await queryOne('SELECT id, username, status FROM users WHERE id = ?', [
      verifyResult.payload.userId,
    ])) as { id: string; username: string; status: number } | null;

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    if (user.status !== 1) {
      res.status(403).json({
        success: false,
        message: '账号已被禁用',
      });
      return;
    }

    const roles = await getUserRoles(user.id);
    const roleCodes = roles.map((role) => role.role_code);

    try {
      await blacklistTokenIfNeeded(providedRefreshToken, user.id, 'refresh', '刷新令牌轮换');
    } catch (error) {
      console.error('Failed to blacklist old refresh token:', error);
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      roles: roleCodes,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      roles: roleCodes,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('刷新 Token 错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新 Token 失败',
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const accessToken = extractTokenFromHeader(req.headers.authorization);
    const refreshToken =
      normalizeHeaderToken(req.body?.refreshToken) ||
      normalizeHeaderToken(req.headers['x-refresh-token']) ||
      null;
    const ipAddress = getRequestIp(req);
    const userAgent = getUserAgent(req);

    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.LOGOUT,
      resourceType: 'auth',
      details: {
        accessToken: accessToken ? 'provided' : 'missing',
        refreshToken: refreshToken ? 'provided' : 'missing',
      },
      ipAddress,
      userAgent,
    });

    if (accessToken) {
      await blacklistTokenIfNeeded(accessToken, req.user.userId, 'access', '用户主动登出');

      const accessVerifyResult = verifyToken(accessToken);
      if (accessVerifyResult.valid && accessVerifyResult.payload?.jti) {
        try {
          await query('UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND session_token = ?', [
            req.user.userId,
            accessVerifyResult.payload.jti,
          ]);
        } catch (error) {
          console.error('Failed to deactivate current session:', error);
        }
      }
    }

    if (refreshToken) {
      try {
        await blacklistTokenIfNeeded(refreshToken, req.user.userId, 'refresh', '用户主动登出');
      } catch (error) {
        console.error('Failed to blacklist refresh token on logout:', error);
      }
    }

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
    });
  }
}
