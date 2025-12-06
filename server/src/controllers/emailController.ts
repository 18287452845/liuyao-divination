/**
 * 邮箱验证控制器
 * 处理邮箱验证、密码重置、邮箱变更等
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';

/**
 * 发送邮箱验证码
 */
export async function sendEmailVerification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    // 查询用户邮箱
    const user: any = await queryOne(
      'SELECT id, username, email, email_verified FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    if (!user.email) {
      res.status(400).json({
        success: false,
        message: '请先设置邮箱地址',
      });
      return;
    }

    if (user.email_verified) {
      res.status(400).json({
        success: false,
        message: '邮箱已验证',
      });
      return;
    }

    // 生成验证令牌
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24小时过期

    // 删除旧的验证记录
    await query(
      'DELETE FROM email_verifications WHERE user_id = ? AND verification_type = ?',
      [userId, 'register']
    );

    // 创建新的验证记录
    const verificationId = uuidv4();
    await query(
      `INSERT INTO email_verifications (id, user_id, email, verification_type, token, expires_at)
       VALUES (?, ?, ?, 'register', ?, ?)`,
      [verificationId, userId, user.email, token, expiresAt]
    );

    // 这里应该发送邮件，简化处理只返回验证码
    // 实际应用中应该使用邮件服务如Nodemailer + SMTP
    console.log(`邮箱验证码: ${token} (用户: ${user.username}, 邮箱: ${user.email})`);

    res.json({
      success: true,
      message: '验证码已发送到您的邮箱',
      data: {
        email: user.email,
        expiresIn: 24 * 60 * 60, // 秒
        // 开发环境下返回验证码，生产环境不应该返回
        token: process.env.NODE_ENV === 'development' ? token : undefined,
      },
    });
  } catch (error) {
    console.error('发送邮箱验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '发送验证码失败',
    });
  }
}

/**
 * 验证邮箱
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    if (!token) {
      res.status(400).json({
        success: false,
        message: '请提供验证令牌',
      });
      return;
    }

    // 查询验证记录
    const verification: any = await queryOne(
      `SELECT * FROM email_verifications 
       WHERE user_id = ? AND token = ? AND verification_type = 'register' AND is_used = 0 AND expires_at > NOW()`,
      [userId, token]
    );

    if (!verification) {
      res.status(400).json({
        success: false,
        message: '验证令牌无效或已过期',
      });
      return;
    }

    // 标记验证记录为已使用
    await query(
      'UPDATE email_verifications SET is_used = 1, used_at = NOW() WHERE id = ?',
      [verification.id]
    );

    // 更新用户邮箱验证状态
    await query(
      'UPDATE users SET email_verified = 1 WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '邮箱验证成功',
    });
  } catch (error) {
    console.error('验证邮箱错误:', error);
    res.status(500).json({
      success: false,
      message: '验证邮箱失败',
    });
  }
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordReset(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: '请提供邮箱地址',
      });
      return;
    }

    // 查询用户
    const user: any = await queryOne(
      'SELECT id, username FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      res.json({
        success: true,
        message: '如果该邮箱已注册，重置链接已发送',
      });
      return;
    }

    // 生成重置令牌
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1小时过期

    // 删除旧的重置记录
    await query(
      'DELETE FROM email_verifications WHERE user_id = ? AND verification_type = ?',
      [user.id, 'reset_password']
    );

    // 创建新的重置记录
    const resetId = uuidv4();
    await query(
      `INSERT INTO email_verifications (id, user_id, email, verification_type, token, expires_at)
       VALUES (?, ?, ?, 'reset_password', ?, ?)`,
      [resetId, user.id, email, token, expiresAt]
    );

    // 这里应该发送重置邮件
    console.log(`密码重置令牌: ${token} (用户: ${user.username}, 邮箱: ${email})`);

    res.json({
      success: true,
      message: '密码重置链接已发送到您的邮箱',
      data: {
        email,
        expiresIn: 60 * 60, // 秒
        // 开发环境下返回重置令牌
        token: process.env.NODE_ENV === 'development' ? token : undefined,
      },
    });
  } catch (error) {
    console.error('发送密码重置邮件错误:', error);
    res.status(500).json({
      success: false,
      message: '发送重置邮件失败',
    });
  }
}

/**
 * 重置密码
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: '请提供重置令牌和新密码',
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

    // 查询重置记录
    const verification: any = await queryOne(
      `SELECT * FROM email_verifications 
       WHERE token = ? AND verification_type = 'reset_password' AND is_used = 0 AND expires_at > NOW()`,
      [token]
    );

    if (!verification) {
      res.status(400).json({
        success: false,
        message: '重置令牌无效或已过期',
      });
      return;
    }

    // 标记重置记录为已使用
    await query(
      'UPDATE email_verifications SET is_used = 1, used_at = NOW() WHERE id = ?',
      [verification.id]
    );

    // 加密新密码
    const { hashPassword } = await import('../utils/password');
    const hashedPassword = await hashPassword(newPassword);

    // 更新用户密码
    await query(
      'UPDATE users SET password = ?, login_attempts = 0 WHERE id = ?',
      [hashedPassword, verification.user_id]
    );

    // 使用户所有会话失效（强制重新登录）
    const userSessions: any = await query(
      'SELECT * FROM user_sessions WHERE user_id = ? AND is_active = 1',
      [verification.user_id]
    );

    for (const session of userSessions) {
      await query(
        'UPDATE user_sessions SET is_active = 0 WHERE id = ?',
        [session.id]
      );
    }

    res.json({
      success: true,
      message: '密码重置成功，请重新登录',
      data: {
        invalidatedSessions: userSessions.length,
      },
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
    });
  }
}

/**
 * 发送邮箱变更验证
 */
export async function sendEmailChangeVerification(req: Request, res: Response): Promise<void> {
  try {
    const { newEmail } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    if (!newEmail) {
      res.status(400).json({
        success: false,
        message: '请提供新邮箱地址',
      });
      return;
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
      return;
    }

    // 检查新邮箱是否已被使用
    const existingUser: any = await queryOne(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [newEmail, userId]
    );

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: '该邮箱已被其他用户使用',
      });
      return;
    }

    // 生成验证令牌
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24小时过期

    // 删除旧的变更记录
    await query(
      'DELETE FROM email_verifications WHERE user_id = ? AND verification_type = ?',
      [userId, 'change_email']
    );

    // 创建新的变更记录
    const changeId = uuidv4();
    await query(
      `INSERT INTO email_verifications (id, user_id, email, verification_type, token, expires_at)
       VALUES (?, ?, ?, 'change_email', ?, ?)`,
      [changeId, userId, newEmail, token, expiresAt]
    );

    // 这里应该发送验证邮件
    console.log(`邮箱变更验证码: ${token} (用户ID: ${userId}, 新邮箱: ${newEmail})`);

    res.json({
      success: true,
      message: '验证码已发送到新邮箱',
      data: {
        newEmail,
        expiresIn: 24 * 60 * 60, // 秒
        // 开发环境下返回验证码
        token: process.env.NODE_ENV === 'development' ? token : undefined,
      },
    });
  } catch (error) {
    console.error('发送邮箱变更验证错误:', error);
    res.status(500).json({
      success: false,
      message: '发送验证码失败',
    });
  }
}

/**
 * 确认邮箱变更
 */
export async function confirmEmailChange(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    if (!token) {
      res.status(400).json({
        success: false,
        message: '请提供验证令牌',
      });
      return;
    }

    // 查询验证记录
    const verification: any = await queryOne(
      `SELECT * FROM email_verifications 
       WHERE user_id = ? AND token = ? AND verification_type = 'change_email' AND is_used = 0 AND expires_at > NOW()`,
      [userId, token]
    );

    if (!verification) {
      res.status(400).json({
        success: false,
        message: '验证令牌无效或已过期',
      });
      return;
    }

    // 再次检查新邮箱是否已被使用（防止并发问题）
    const existingUser: any = await queryOne(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [verification.email, userId]
    );

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: '该邮箱已被其他用户使用',
      });
      return;
    }

    // 标记验证记录为已使用
    await query(
      'UPDATE email_verifications SET is_used = 1, used_at = NOW() WHERE id = ?',
      [verification.id]
    );

    // 更新用户邮箱并重置验证状态
    await query(
      'UPDATE users SET email = ?, email_verified = 0 WHERE id = ?',
      [verification.email, userId]
    );

    res.json({
      success: true,
      message: '邮箱变更成功，请重新验证新邮箱',
      data: {
        newEmail: verification.email,
      },
    });
  } catch (error) {
    console.error('确认邮箱变更错误:', error);
    res.status(500).json({
      success: false,
      message: '确认邮箱变更失败',
    });
  }
}

/**
 * 批量发送邮箱验证（管理员功能）
 */
export async function batchSendEmailVerification(req: Request, res: Response): Promise<void> {
  try {
    const { userIds } = req.body;

    // 检查权限
    if (!req.user?.roles.includes('admin')) {
      res.status(403).json({
        success: false,
        message: '权限不足',
      });
      return;
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供用户ID列表',
      });
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    const results: any[] = [];

    for (const userId of userIds) {
      try {
        // 查询用户邮箱
        const user: any = await queryOne(
          'SELECT id, username, email, email_verified FROM users WHERE id = ?',
          [userId]
        );

        if (!user || !user.email || user.email_verified) {
          results.push({
            userId,
            success: false,
            reason: !user ? '用户不存在' : !user.email ? '用户无邮箱' : '邮箱已验证',
          });
          failureCount++;
          continue;
        }

        // 生成验证令牌
        const token = generateVerificationToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 删除旧的验证记录
        await query(
          'DELETE FROM email_verifications WHERE user_id = ? AND verification_type = ?',
          [userId, 'register']
        );

        // 创建新的验证记录
        const verificationId = uuidv4();
        await query(
          `INSERT INTO email_verifications (id, user_id, email, verification_type, token, expires_at)
           VALUES (?, ?, ?, 'register', ?, ?)`,
          [verificationId, userId, user.email, token, expiresAt]
        );

        console.log(`批量邮箱验证码: ${token} (用户: ${user.username}, 邮箱: ${user.email})`);

        results.push({
          userId,
          username: user.username,
          email: user.email,
          success: true,
        });
        successCount++;
      } catch (error) {
        console.error(`批量发送验证失败 (用户ID: ${userId}):`, error);
        results.push({
          userId,
          success: false,
          reason: '发送失败',
        });
        failureCount++;
      }
    }

    res.json({
      success: true,
      message: `批量发送完成，成功: ${successCount}，失败: ${failureCount}`,
      data: {
        totalCount: userIds.length,
        successCount,
        failureCount,
        results,
      },
    });
  } catch (error) {
    console.error('批量发送邮箱验证错误:', error);
    res.status(500).json({
      success: false,
      message: '批量发送失败',
    });
  }
}

/**
 * 生成验证令牌
 */
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}