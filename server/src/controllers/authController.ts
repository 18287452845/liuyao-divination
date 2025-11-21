/**
 * 认证控制器
 * 处理用户登录、注册、登出等认证相关操作
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

/**
 * 用户登录
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    // 查询用户
    const user: any = await queryOne(
      'SELECT id, username, password, status FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // 检查用户状态
    if (user.status !== 1) {
      res.status(403).json({
        success: false,
        message: '账号已被禁用，请联系管理员',
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

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

    // 更新最后登录时间和IP
    const loginIp = req.ip || req.connection.remoteAddress || '';
    await query(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [loginIp, user.id]
    );

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

    // 验证邀请码（必须）
    const VALID_INVITE_CODE = '1663929970';
    if (!inviteCode) {
      res.status(400).json({
        success: false,
        message: '请输入邀请码',
      });
      return;
    }

    if (inviteCode !== VALID_INVITE_CODE) {
      res.status(400).json({
        success: false,
        message: '邀请码无效',
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

    // 验证密码长度
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: '密码长度至少为6个字符',
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
        res.status(409).json({
          success: false,
          message: '邮箱已被注册',
        });
        return;
      }
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, username, password, email, real_name, status)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [userId, username, hashedPassword, email || null, realName || null]
    );

    // 分配默认角色（普通用户）
    const defaultRole: any = await queryOne(
      "SELECT id FROM roles WHERE role_code = 'user' AND status = 1"
    );

    if (defaultRole) {
      const userRoleId = uuidv4();
      await query(
        'INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)',
        [userRoleId, userId, defaultRole.id]
      );
    }

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
        roles: roles,
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
    await query('UPDATE users SET password = ? WHERE id = ?', [
      hashedNewPassword,
      req.user.userId,
    ]);

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
 * 登出（客户端处理，服务端可选实现token黑名单）
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // 当前简化实现，仅返回成功
    // 实际生产环境可以将token加入黑名单（Redis）
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
