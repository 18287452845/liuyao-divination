/**
 * 角色管理控制器
 * 管理员管理角色和权限的CRUD操作
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';

/**
 * 获取角色列表
 */
export async function getRoles(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, pageSize = 20, search = '', status = '' } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    let whereClauses: string[] = [];
    let params: any[] = [];

    // 搜索条件
    if (search) {
      whereClauses.push('(role_name LIKE ? OR role_code LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 状态过滤
    if (status !== '') {
      whereClauses.push('status = ?');
      params.push(Number(status));
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total FROM roles ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询角色列表
    const roles: any = await query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as user_count,
              (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permission_count
       FROM roles r
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        list: roles,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取角色列表失败',
    });
  }
}

/**
 * 获取所有角色（不分页，用于下拉选择）
 */
export async function getAllRoles(req: Request, res: Response): Promise<void> {
  try {
    const roles: any = await query(
      'SELECT id, role_name, role_code, description FROM roles WHERE status = 1 ORDER BY role_name'
    );

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('获取所有角色错误:', error);
    res.status(500).json({
      success: false,
      message: '获取角色列表失败',
    });
  }
}

/**
 * 获取单个角色详情
 */
export async function getRoleById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const role: any = await queryOne('SELECT * FROM roles WHERE id = ?', [id]);

    if (!role) {
      res.status(404).json({
        success: false,
        message: '角色不存在',
      });
      return;
    }

    // 查询角色的权限
    const permissions: any = await query(
      `SELECT p.id, p.permission_name, p.permission_code, p.module, p.description
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.status = 1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...role,
        permissions,
      },
    });
  } catch (error) {
    console.error('获取角色详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取角色详情失败',
    });
  }
}

/**
 * 创建角色
 */
export async function createRole(req: Request, res: Response): Promise<void> {
  try {
    const { roleName, roleCode, description, permissionIds = [] } = req.body;

    // 验证输入
    if (!roleName || !roleCode) {
      res.status(400).json({
        success: false,
        message: '角色名称和角色代码不能为空',
      });
      return;
    }

    // 验证角色代码格式
    if (!/^[a-z_]+$/.test(roleCode)) {
      res.status(400).json({
        success: false,
        message: '角色代码只能包含小写字母和下划线',
      });
      return;
    }

    // 检查角色名称是否已存在
    const existingName: any = await queryOne(
      'SELECT id FROM roles WHERE role_name = ?',
      [roleName]
    );

    if (existingName) {
      res.status(409).json({
        success: false,
        message: '角色名称已存在',
      });
      return;
    }

    // 检查角色代码是否已存在
    const existingCode: any = await queryOne(
      'SELECT id FROM roles WHERE role_code = ?',
      [roleCode]
    );

    if (existingCode) {
      res.status(409).json({
        success: false,
        message: '角色代码已存在',
      });
      return;
    }

    // 创建角色
    const roleId = uuidv4();
    await query(
      `INSERT INTO roles (id, role_name, role_code, description, status)
       VALUES (?, ?, ?, ?, 1)`,
      [roleId, roleName, roleCode, description || null]
    );

    // 分配权限
    if (permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        const rolePermissionId = uuidv4();
        await query(
          'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)',
          [rolePermissionId, roleId, permissionId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: '角色创建成功',
      data: { roleId, roleName, roleCode },
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({
      success: false,
      message: '创建角色失败',
    });
  }
}

/**
 * 更新角色
 */
export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { roleName, description, permissionIds } = req.body;

    // 检查角色是否存在
    const role: any = await queryOne('SELECT id, role_code FROM roles WHERE id = ?', [id]);

    if (!role) {
      res.status(404).json({
        success: false,
        message: '角色不存在',
      });
      return;
    }

    // 防止修改系统内置角色的核心属性
    if (role.role_code === 'admin' && roleName) {
      res.status(403).json({
        success: false,
        message: '不能修改管理员角色名称',
      });
      return;
    }

    // 检查角色名称是否已存在
    if (roleName) {
      const existingName: any = await queryOne(
        'SELECT id FROM roles WHERE role_name = ? AND id != ?',
        [roleName, id]
      );

      if (existingName) {
        res.status(409).json({
          success: false,
          message: '角色名称已存在',
        });
        return;
      }
    }

    // 更新角色信息
    await query(
      'UPDATE roles SET role_name = ?, description = ? WHERE id = ?',
      [roleName, description || null, id]
    );

    // 更新权限（如果提供）
    if (permissionIds && Array.isArray(permissionIds)) {
      // 删除现有权限
      await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

      // 添加新权限
      for (const permissionId of permissionIds) {
        const rolePermissionId = uuidv4();
        await query(
          'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)',
          [rolePermissionId, id, permissionId]
        );
      }
    }

    res.json({
      success: true,
      message: '角色更新成功',
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    res.status(500).json({
      success: false,
      message: '更新角色失败',
    });
  }
}

/**
 * 删除角色
 */
export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // 检查角色是否存在
    const role: any = await queryOne('SELECT id, role_code FROM roles WHERE id = ?', [id]);

    if (!role) {
      res.status(404).json({
        success: false,
        message: '角色不存在',
      });
      return;
    }

    // 防止删除系统内置角色
    if (['admin', 'user'].includes(role.role_code)) {
      res.status(403).json({
        success: false,
        message: '不能删除系统内置角色',
      });
      return;
    }

    // 检查是否有用户使用此角色
    const userCount: any = await queryOne(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?',
      [id]
    );

    if (userCount && userCount.count > 0) {
      res.status(409).json({
        success: false,
        message: `该角色正在被 ${userCount.count} 个用户使用，无法删除`,
      });
      return;
    }

    // 删除角色（级联删除关联数据）
    await query('DELETE FROM roles WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '角色删除成功',
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.status(500).json({
      success: false,
      message: '删除角色失败',
    });
  }
}

/**
 * 修改角色状态（启用/禁用）
 */
export async function updateRoleStatus(req: Request, res: Response): Promise<void> {
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

    // 检查角色是否存在
    const role: any = await queryOne('SELECT id, role_code FROM roles WHERE id = ?', [id]);

    if (!role) {
      res.status(404).json({
        success: false,
        message: '角色不存在',
      });
      return;
    }

    // 防止禁用系统内置角色
    if (['admin', 'user'].includes(role.role_code) && status === 0) {
      res.status(403).json({
        success: false,
        message: '不能禁用系统内置角色',
      });
      return;
    }

    // 更新状态
    await query('UPDATE roles SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: status === 1 ? '角色已启用' : '角色已禁用',
    });
  } catch (error) {
    console.error('更新角色状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新角色状态失败',
    });
  }
}

/**
 * 获取所有权限列表（用于分配权限）
 */
export async function getPermissions(req: Request, res: Response): Promise<void> {
  try {
    const permissions: any = await query(
      `SELECT id, permission_name, permission_code, module, description
       FROM permissions
       WHERE status = 1
       ORDER BY module, permission_code`
    );

    // 按模块分组
    const grouped: { [key: string]: any[] } = {};
    permissions.forEach((perm: any) => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });

    res.json({
      success: true,
      data: {
        list: permissions,
        grouped,
      },
    });
  } catch (error) {
    console.error('获取权限列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取权限列表失败',
    });
  }
}

/**
 * 为角色分配权限
 */
export async function assignPermissions(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    // 验证输入
    if (!Array.isArray(permissionIds)) {
      res.status(400).json({
        success: false,
        message: '权限ID列表格式错误',
      });
      return;
    }

    // 检查角色是否存在
    const role: any = await queryOne('SELECT id FROM roles WHERE id = ?', [id]);

    if (!role) {
      res.status(404).json({
        success: false,
        message: '角色不存在',
      });
      return;
    }

    // 删除现有权限
    await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // 添加新权限
    for (const permissionId of permissionIds) {
      const rolePermissionId = uuidv4();
      await query(
        'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)',
        [rolePermissionId, id, permissionId]
      );
    }

    res.json({
      success: true,
      message: '权限分配成功',
    });
  } catch (error) {
    console.error('分配权限错误:', error);
    res.status(500).json({
      success: false,
      message: '分配权限失败',
    });
  }
}
