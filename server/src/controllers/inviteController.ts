/**
 * 邀请码管理控制器
 * 管理员管理邀请码的CRUD操作
 */

import { Request, Response } from 'express';
import { 
  createInviteCode, 
  getInviteCodes, 
  getInviteCodeById, 
  updateInviteCode, 
  deleteInviteCode, 
  updateInviteCodeStatus,
  getInviteCodeStats,
  batchCreateInviteCodes,
  generateRandomInviteCode
} from '../utils/inviteCodes';
import { logSuccess, logFailure, AuditAction } from '../utils/audit';

/**
 * 获取邀请码列表
 */
export async function getInviteCodeList(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, pageSize = 20, search = '', status = '' } = req.query;

    const { codes, total } = await getInviteCodes({
      page: Number(page),
      pageSize: Number(pageSize),
      search: search as string,
      status: status !== '' ? Number(status) : undefined
    });

    res.json({
      success: true,
      data: {
        list: codes,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取邀请码列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邀请码列表失败',
    });
  }
}

/**
 * 获取邀请码统计
 */
export async function getInviteCodeStatistics(req: Request, res: Response): Promise<void> {
  try {
    const stats = await getInviteCodeStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('获取邀请码统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邀请码统计失败',
    });
  }
}

/**
 * 获取单个邀请码详情
 */
export async function getInviteCodeDetail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const inviteCode = await getInviteCodeById(id);

    if (!inviteCode) {
      res.status(404).json({
        success: false,
        message: '邀请码不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: inviteCode,
    });
  } catch (error) {
    console.error('获取邀请码详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邀请码详情失败',
    });
  }
}

/**
 * 创建邀请码
 */
export async function createInviteCodeController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { code, name, description, maxUses, expiresAt } = req.body;

    // 验证输入
    if (!code) {
      res.status(400).json({
        success: false,
        message: '邀请码不能为空',
      });
      return;
    }

    // 验证邀请码格式
    if (!/^[A-Z0-9]{6,20}$/.test(code)) {
      res.status(400).json({
        success: false,
        message: '邀请码格式不正确，应为6-20位大写字母和数字',
      });
      return;
    }

    // 验证最大使用次数
    if (maxUses && (maxUses < 1 || maxUses > 10000)) {
      res.status(400).json({
        success: false,
        message: '最大使用次数应在1-10000之间',
      });
      return;
    }

    const inviteId = await createInviteCode({
      code: code.toUpperCase(),
      name,
      description,
      maxUses: maxUses || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user.userId
    });

    // 记录操作日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.CREATE_INVITE,
      resourceType: 'invite',
      resourceId: inviteId,
      details: { code, name, maxUses, expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: '邀请码创建成功',
      data: { inviteId, code },
    });
  } catch (error) {
    console.error('创建邀请码错误:', error);
    res.status(500).json({
      success: false,
      message: '创建邀请码失败',
    });
  }
}

/**
 * 批量创建邀请码
 */
export async function batchCreateInviteCodesController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { count, name, description, maxUses, expiresAt } = req.body;

    // 验证输入
    if (!count || count < 1 || count > 100) {
      res.status(400).json({
        success: false,
        message: '批量创建数量应在1-100之间',
      });
      return;
    }

    const inviteIds = await batchCreateInviteCodes(count, {
      name,
      description,
      maxUses: maxUses || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user.userId
    });

    // 记录操作日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.CREATE_INVITE,
      resourceType: 'invite',
      details: { batch: true, count, name, maxUses, expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: `成功创建 ${count} 个邀请码`,
      data: { count, inviteIds },
    });
  } catch (error) {
    console.error('批量创建邀请码错误:', error);
    res.status(500).json({
      success: false,
      message: '批量创建邀请码失败',
    });
  }
}

/**
 * 生成随机邀请码
 */
export async function generateRandomInviteCodeController(req: Request, res: Response): Promise<void> {
  try {
    const { length = 12 } = req.query;
    
    const code = generateRandomInviteCode(Number(length));

    res.json({
      success: true,
      data: { code },
    });
  } catch (error) {
    console.error('生成随机邀请码错误:', error);
    res.status(500).json({
      success: false,
      message: '生成随机邀请码失败',
    });
  }
}

/**
 * 更新邀请码
 */
export async function updateInviteCodeController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { id } = req.params;
    const { name, description, maxUses, expiresAt } = req.body;

    // 检查邀请码是否存在
    const existingCode = await getInviteCodeById(id);
    if (!existingCode) {
      res.status(404).json({
        success: false,
        message: '邀请码不存在',
      });
      return;
    }

    const success = await updateInviteCode(id, {
      name,
      description,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    if (!success) {
      res.status(500).json({
        success: false,
        message: '更新邀请码失败',
      });
      return;
    }

    // 记录操作日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.UPDATE_INVITE,
      resourceType: 'invite',
      resourceId: id,
      details: { name, description, maxUses, expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '邀请码更新成功',
    });
  } catch (error) {
    console.error('更新邀请码错误:', error);
    res.status(500).json({
      success: false,
      message: '更新邀请码失败',
    });
  }
}

/**
 * 修改邀请码状态
 */
export async function updateInviteCodeStatusController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

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

    // 检查邀请码是否存在
    const existingCode = await getInviteCodeById(id);
    if (!existingCode) {
      res.status(404).json({
        success: false,
        message: '邀请码不存在',
      });
      return;
    }

    const success = await updateInviteCodeStatus(id, status);

    if (!success) {
      res.status(500).json({
        success: false,
        message: '修改邀请码状态失败',
      });
      return;
    }

    // 记录操作日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.UPDATE_INVITE,
      resourceType: 'invite',
      resourceId: id,
      details: { status, statusText: status === 1 ? '启用' : '禁用' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: status === 1 ? '邀请码已启用' : '邀请码已禁用',
    });
  } catch (error) {
    console.error('修改邀请码状态错误:', error);
    res.status(500).json({
      success: false,
      message: '修改邀请码状态失败',
    });
  }
}

/**
 * 删除邀请码
 */
export async function deleteInviteCodeController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { id } = req.params;

    // 检查邀请码是否存在
    const existingCode = await getInviteCodeById(id);
    if (!existingCode) {
      res.status(404).json({
        success: false,
        message: '邀请码不存在',
      });
      return;
    }

    // 防止删除已使用的邀请码
    if (existingCode.usedCount > 0) {
      res.status(409).json({
        success: false,
        message: '不能删除已使用的邀请码',
      });
      return;
    }

    const success = await deleteInviteCode(id);

    if (!success) {
      res.status(500).json({
        success: false,
        message: '删除邀请码失败',
      });
      return;
    }

    // 记录操作日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.DELETE_INVITE,
      resourceType: 'invite',
      resourceId: id,
      details: { code: existingCode.code },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '邀请码删除成功',
    });
  } catch (error) {
    console.error('删除邀请码错误:', error);
    res.status(500).json({
      success: false,
      message: '删除邀请码失败',
    });
  }
}