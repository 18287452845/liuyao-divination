/**
 * 用户管理控制器
 * 管理员管理用户的CRUD操作
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';
import { hashPassword } from '../utils/password';

/**
 * 获取用户列表
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, pageSize = 20, search = '', status = '' } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    let whereClauses: string[] = [];
    let params: any[] = [];

    // 搜索条件
    if (search) {
      whereClauses.push('(u.username LIKE ? OR u.email LIKE ? OR u.real_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 状态过滤
    if (status !== '') {
      whereClauses.push('u.status = ?');
      params.push(Number(status));
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询用户列表
    const users: any = await query(
      `SELECT u.id, u.username, u.email, u.real_name, u.avatar, u.status,
              u.last_login_at, u.last_login_ip, u.created_at, u.updated_at,
              GROUP_CONCAT(DISTINCT r.role_name) as roles,
              GROUP_CONCAT(DISTINCT r.role_code) as role_codes
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    // 处理角色数据
    const processedUsers = users.map((user: any) => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : [],
      roleCodes: user.role_codes ? user.role_codes.split(',') : [],
    }));

    res.json({
      success: true,
      data: {
        list: processedUsers,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
    });
  }
}

/**
 * 获取单个用户详情
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user: any = await queryOne(
      `SELECT id, username, email, real_name, avatar, status,
              last_login_at, last_login_ip, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 查询用户角色
    const roles: any = await query(
      `SELECT r.id, r.role_name, r.role_code, r.description
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...user,
        roles,
      },
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
    });
  }
}

/**
 * 创建用户
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, email, realName, roleIds = [] } = req.body;

    // 验证输入
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    // 验证用户名
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({
        success: false,
        message: '用户名长度必须在3-20个字符之间',
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

    // 检查邮箱
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

    // 分配角色
    if (roleIds.length > 0) {
      for (const roleId of roleIds) {
        const userRoleId = uuidv4();
        await query(
          'INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)',
          [userRoleId, userId, roleId]
        );
      }
    } else {
      // 默认分配普通用户角色
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
    }

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: { userId, username },
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
    });
  }
}

/**
 * 更新用户
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email, realName, avatar, roleIds } = req.body;

    // 检查用户是否存在
    const user: any = await queryOne('SELECT id FROM users WHERE id = ?', [id]);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 检查邮箱
    if (email) {
      const existingEmail: any = await queryOne(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existingEmail) {
        res.status(409).json({
          success: false,
          message: '邮箱已被其他用户使用',
        });
        return;
      }
    }

    // 更新用户信息
    await query(
      'UPDATE users SET email = ?, real_name = ?, avatar = ? WHERE id = ?',
      [email || null, realName || null, avatar || null, id]
    );

    // 更新角色（如果提供）
    if (roleIds && Array.isArray(roleIds)) {
      // 删除现有角色
      await query('DELETE FROM user_roles WHERE user_id = ?', [id]);

      // 添加新角色
      for (const roleId of roleIds) {
        const userRoleId = uuidv4();
        await query(
          'INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)',
          [userRoleId, id, roleId]
        );
      }
    }

    res.json({
      success: true,
      message: '用户更新成功',
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
    });
  }
}

/**
 * 删除用户
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const user: any = await queryOne('SELECT id, username FROM users WHERE id = ?', [id]);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 防止删除管理员账号
    if (user.username === 'admin') {
      res.status(403).json({
        success: false,
        message: '不能删除默认管理员账号',
      });
      return;
    }

    // 删除用户（级联删除关联数据）
    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
    });
  }
}

/**
 * 修改用户状态（启用/禁用）
 */
export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证状态值
    if (status !== 0 && status !== 1) {
      res.status(400).json({
        success: false,
        message: '状态值无效',
      });
      return;
    }

    // 检查用户是否存在
    const user: any = await queryOne('SELECT id, username FROM users WHERE id = ?', [id]);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 防止禁用管理员账号
    if (user.username === 'admin' && status === 0) {
      res.status(403).json({
        success: false,
        message: '不能禁用默认管理员账号',
      });
      return;
    }

    // 更新状态
    await query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: status === 1 ? '用户已启用' : '用户已禁用',
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败',
    });
  }
}

/**
 * 重置用户密码
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: '新密码长度至少为6个字符',
      });
      return;
    }

    // 检查用户是否存在
    const user: any = await queryOne('SELECT id FROM users WHERE id = ?', [id]);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({
      success: true,
      message: '密码重置成功',
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
    });
  }
}
