/**
 * 认证控制器
 * 处理用户登录、注册、登出等认证相关操作
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool, query, queryOne } from '../models/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { logSuccess, logFailure, AuditAction } from '../utils/audit';
import { addToBlacklist } from '../utils/tokenBlacklist';
import { recordLoginLog } from './logController';
import { validatePassword } from '../utils/passwordPolicy';
import { validateInviteCode } from '../utils/inviteCodes';
import { diagnosisAndRepair, DBError } from '../utils/dbAutoRepair';

/**
 * 用户登录
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    // 验证输入
    if (!username || !password) {
      await logFailure({
        username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: '用户名或密码为空' },
        ipAddress,
        userAgent,
        errorMessage: '用户名和密码不能为空'
      });

      await recordLoginLog(
        null,
        username || '',
        ipAddress,
        userAgent,
        0,
        '用户名或密码为空'
      );

      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    // 查询用户
    const user: any = await queryOne(
      'SELECT id, username, password, status, login_fail_count, locked_until FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      await logFailure({
        username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: '用户不存在' },
        ipAddress,
        userAgent,
        errorMessage: '用户名或密码错误'
      });

      await recordLoginLog(
        null,
        username,
        ipAddress,
        userAgent,
        0,
        '用户不存在'
      );

      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // 检查账号是否被锁定
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logFailure({
        userId: user.id,
        username: user.username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: '账号被锁定', lockedUntil: user.locked_until },
        ipAddress,
        userAgent,
        errorMessage: '账号已被锁定，请稍后再试'
      });

      await recordLoginLog(
        user.id,
        user.username,
        ipAddress,
        userAgent,
        0,
        '账号被锁定'
      );

      res.status(423).json({
        success: false,
        message: '账号已被锁定，请稍后再试',
      });
      return;
    }

    // 检查用户状态
    if (user.status !== 1) {
      await logFailure({
        userId: user.id,
        username: user.username,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { reason: '用户状态异常', status: user.status },
        ipAddress,
        userAgent,
        errorMessage: '账号已被禁用，请联系管理员'
      });

      await recordLoginLog(
        user.id,
        user.username,
        ipAddress,
        userAgent,
        0,
        '账号已被禁用'
      );

      res.status(403).json({
        success: false,
        message: '账号已被禁用，请联系管理员',
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      // 增加登录失败次数
      const newFailCount = (user.login_fail_count || 0) + 1;
      const maxFailCount = 5;
      
      if (newFailCount >= maxFailCount) {
        // 锁定账号30分钟
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await query(
          'UPDATE users SET login_fail_count = ?, locked_until = ? WHERE id = ?',
          [newFailCount, lockedUntil, user.id]
        );
        
        await logFailure({
          userId: user.id,
          username: user.username,
          action: AuditAction.LOGIN,
          resourceType: 'auth',
          details: { reason: '密码错误次数过多，账号被锁定', failCount: newFailCount },
          ipAddress,
          userAgent,
          errorMessage: '密码错误次数过多，账号已被锁定30分钟'
        });

        await recordLoginLog(
          user.id,
          user.username,
          ipAddress,
          userAgent,
          0,
          '密码错误次数过多，账号已被锁定30分钟'
        );
        
        res.status(423).json({
          success: false,
          message: '密码错误次数过多，账号已被锁定30分钟',
        });
      } else {
        await query(
          'UPDATE users SET login_fail_count = ? WHERE id = ?',
          [newFailCount, user.id]
        );
        
        await logFailure({
          userId: user.id,
          username: user.username,
          action: AuditAction.LOGIN,
          resourceType: 'auth',
          details: { reason: '密码错误', failCount: newFailCount, remaining: maxFailCount - newFailCount },
          ipAddress,
          userAgent,
          errorMessage: `用户名或密码错误，还剩${maxFailCount - newFailCount}次机会`
        });

        await recordLoginLog(
          user.id,
          user.username,
          ipAddress,
          userAgent,
          0,
          `用户名或密码错误，还剩${maxFailCount - newFailCount}次机会`
        );
        
        res.status(401).json({
          success: false,
          message: `用户名或密码错误，还剩${maxFailCount - newFailCount}次机会`,
        });
      }
      return;
    }

    // 登录成功，重置失败次数
    await query(
      'UPDATE users SET login_fail_count = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [ipAddress, user.id]
    );

    // 查询用户角色
    const roles: any = await query(
      `SELECT r.role_code, r.role_name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ? AND r.status = 1`,
      [user.id]
    );

    const roleCodes = roles.map((r: any) => r.role_code);

    // 生成token
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

    // 创建会话记录（用于会话管理/踢下线）
    const sessionId = uuidv4();
    try {
      const accessVerifyResult = verifyToken(accessToken);
      const jti = accessVerifyResult.valid ? accessVerifyResult.payload?.jti : undefined;
      const exp = accessVerifyResult.valid ? accessVerifyResult.payload?.exp : undefined;

      if (jti) {
        const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await query(
          `INSERT INTO user_sessions (id, user_id, session_token, device_info, ip_address, user_agent, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)` ,
          [
            sessionId,
            user.id,
            jti,
            JSON.stringify({}),
            ipAddress,
            userAgent,
            expiresAt
          ]
        );
      }
    } catch (sessionError) {
      console.error('创建用户会话记录失败:', sessionError);
    }

    await recordLoginLog(user.id, user.username, ipAddress, userAgent, 1, undefined, sessionId);

    // 记录登录成功审计日志
    await logSuccess({
      userId: user.id,
      username: user.username,
      action: AuditAction.LOGIN,
      resourceType: 'auth',
      details: { loginIp: ipAddress },
      ipAddress,
      userAgent
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        userId: user.id,
        username: user.username,
        roles: roles.map((r: any) => ({ code: r.role_code, name: r.role_name })),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    
    // 尝试自动修复数据库错误
    if ((error as any)?.code === 'ER_BAD_FIELD_ERROR') {
      const dbError = error as DBError;
      const repairResult = await diagnosisAndRepair(dbError, 'SELECT id, username, password, status, login_fail_count, locked_until FROM users WHERE username = ?', [req.body.username]);
      
      console.log('\n=== 自动修复结果 ===');
      console.log('状态:', repairResult.success ? '成功' : '失败');
      console.log('信息:', repairResult.message);
      if (repairResult.sqlExecuted) {
        console.log('执行的SQL:', repairResult.sqlExecuted);
      }
      console.log('==================\n');
      
      // 如果修复成功，延迟后返回，让客户端重新尝试
      if (repairResult.success) {
        console.log('>>> 数据库已修复，请重新尝试登录');
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

/**
 * 用户注册
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, email, realName, inviteCode } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    // 验证邀请码
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
        details: { reason: '邀请码无效', inviteCode, error: inviteValidation.error },
        ipAddress,
        userAgent,
        errorMessage: inviteValidation.error || '邀请码无效'
      });
      res.status(400).json({
        success: false,
        message: inviteValidation.error || '邀请码无效',
      });
      return;
    }

    // 验证输入
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    // 验证用户名长度和格式
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({
        success: false,
        message: '用户名长度必须在3-20个字符之间',
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

    // 验证密码复杂度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: '密码不符合安全要求',
        errors: passwordValidation.errors,
      });
      return;
    }

    // 验证邮箱格式（如果提供）
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
      return;
    }

    // 检查用户名是否已存在
    const existingUser: any = await queryOne(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      await logFailure({
        username,
        action: AuditAction.REGISTER,
        resourceType: 'auth',
        details: { reason: '用户名已存在' },
        ipAddress,
        userAgent,
        errorMessage: '用户名已存在'
      });
      res.status(409).json({
        success: false,
        message: '用户名已存在',
      });
      return;
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail: any = await queryOne(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingEmail) {
        await logFailure({
          username,
          action: AuditAction.REGISTER,
          resourceType: 'auth',
          details: { reason: '邮箱已被注册', email },
          ipAddress,
          userAgent,
          errorMessage: '邮箱已被注册'
        });
        res.status(409).json({
          success: false,
          message: '邮箱已被注册',
        });
        return;
      }
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户（与邀请码消耗放在同一个事务中，避免并发超发邀请码）
    const userId = uuidv4();

    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO users (id, username, password, email, real_name, status, last_password_change)
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [userId, username, hashedPassword, email || null, realName || null]
      );

      // 分配默认角色（普通用户）
      const [defaultRoleRows]: any = await connection.execute(
        "SELECT id FROM roles WHERE role_code = 'user' AND status = 1"
      );
      const defaultRole = defaultRoleRows?.[0];

      if (defaultRole) {
        const userRoleId = uuidv4();
        await connection.execute(
          'INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)',
          [userRoleId, userId, defaultRole.id]
        );
      }

      // 消耗邀请码（原子更新，避免并发超用）
      const normalizedInviteCode = inviteCode.trim().toUpperCase();
      const [inviteUpdateResult]: any = await connection.execute(
        `UPDATE invite_codes
         SET used_count = used_count + 1
         WHERE code = ?
           AND status = 1
           AND (expires_at IS NULL OR expires_at > NOW())
           AND used_count < max_uses`,
        [normalizedInviteCode]
      );

      if (!inviteUpdateResult || inviteUpdateResult.affectedRows === 0) {
        throw new Error('邀请码已失效或使用次数已达上限');
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // 记录注册成功日志
    await logSuccess({
      userId,
      username,
      action: AuditAction.REGISTER,
      resourceType: 'auth',
      details: { email, realName, inviteCode },
      ipAddress,
      userAgent
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

    const errMessage = error instanceof Error ? error.message : String(error);

    // 邀请码并发消耗失败等业务错误
    if (errMessage.includes('邀请码')) {
      await logFailure({
        username: req.body?.username,
        action: AuditAction.REGISTER,
        resourceType: 'auth',
        details: { reason: errMessage, inviteCode: req.body?.inviteCode },
        ipAddress: req.ip || req.connection.remoteAddress || '',
        userAgent: req.get('User-Agent') || '',
        errorMessage: errMessage
      });

      res.status(400).json({
        success: false,
        message: errMessage,
      });
      return;
    }

    const errorCode = (error as any)?.code;
    if (errorCode === 'ER_DUP_ENTRY' || errMessage.includes('Duplicate')) {
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

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    // 查询完整用户信息
    const user: any = await queryOne(
      `SELECT id, username, email, real_name, avatar, status,
              last_login_at, created_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 查询角色
    const roles: any = await query(
      `SELECT r.id, r.role_name, r.role_code
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ? AND r.status = 1`,
      [user.id]
    );

    // 格式化角色数据，保持与登录时的格式一致
    const formattedRoles = roles.map((r: any) => ({
      code: r.role_code,
      name: r.role_name,
    }));

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
        roles: formattedRoles,
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

/**
 * 修改密码
 */
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

    // 验证输入
    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: '新密码长度至少为6个字符',
      });
      return;
    }

    // 查询用户当前密码
    const user: any = await queryOne(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 验证旧密码
    const isOldPasswordValid = await verifyPassword(oldPassword, user.password);

    if (!isOldPasswordValid) {
      res.status(401).json({
        success: false,
        message: '旧密码错误',
      });
      return;
    }

    // 加密新密码
    const hashedNewPassword = await hashPassword(newPassword);

    // 更新密码
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
      ipAddress: req.ip || req.connection.remoteAddress || '',
      userAgent: req.get('User-Agent') || ''
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

/**
 * 更新用户资料
 */
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

    // 验证邮箱格式（如果提供）
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
      return;
    }

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const existingEmail: any = await queryOne(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.userId]
      );

      if (existingEmail) {
        res.status(409).json({
          success: false,
          message: '邮箱已被其他用户使用',
        });
        return;
      }
    }

    // 更新用户资料
    await query(
      'UPDATE users SET email = ?, real_name = ?, avatar = ? WHERE id = ?',
      [email || null, realName || null, avatar || null, req.user.userId]
    );

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

/**
 * 刷新Token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // 这里可以实现refresh token逻辑
    // 当前简化实现，直接基于当前用户重新生成token
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const accessToken = generateAccessToken({
      userId: req.user.userId,
      username: req.user.username,
      roles: req.user.roles,
    });

    const newRefreshToken = generateRefreshToken({
      userId: req.user.userId,
      username: req.user.username,
      roles: req.user.roles,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('刷新Token错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新Token失败',
    });
  }
}

/**
 * 登出（将Token加入黑名单）
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const token = extractTokenFromHeader(req.headers.authorization);
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    // 记录登出日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.LOGOUT,
      resourceType: 'auth',
      details: { token: token ? 'provided' : 'not_provided' },
      ipAddress,
      userAgent
    });

    // 将token加入黑名单
    if (token) {
      const payload = verifyToken(token);
      if (payload.valid && payload.payload) {
        // 设置token过期时间为当前时间加1小时（确保立即失效）
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        const tokenJti = payload.payload.jti || token.substring(0, 20);

        await addToBlacklist({
          tokenJti,
          userId: req.user.userId,
          tokenType: 'access',
          expiresAt: expiresAt,
          reason: '用户主动登出'
        });

        // 同步使当前会话失效（如果存在会话记录）
        if (payload.payload.jti) {
          try {
            await query(
              'UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND session_token = ?',
              [req.user.userId, payload.payload.jti]
            );
          } catch (sessionError) {
            console.error('更新会话状态失败:', sessionError);
          }
        }
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
