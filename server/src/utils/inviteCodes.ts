/**
 * 邀请码管理工具
 * 用于管理用户注册邀请码
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';

export interface InviteCode {
  id: string;
  code: string;
  name?: string;
  description?: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  status: 0 | 1; // 0-禁用 1-启用
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInviteCodeData {
  code: string;
  name?: string;
  description?: string;
  maxUses?: number;
  expiresAt?: Date;
  createdBy?: string;
}

/**
 * 创建邀请码
 */
export async function createInviteCode(data: CreateInviteCodeData): Promise<string> {
  try {
    const inviteId = uuidv4();
    
    await query(
      `INSERT INTO invite_codes (
        id, code, name, description, max_uses, expires_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        inviteId,
        data.code,
        data.name || null,
        data.description || null,
        data.maxUses || 1,
        data.expiresAt || null,
        data.createdBy || null
      ]
    );

    console.log(`邀请码创建成功: ${data.code}`);
    return inviteId;
  } catch (error) {
    console.error('创建邀请码失败:', error);
    throw error;
  }
}

/**
 * 验证邀请码
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  inviteCode?: InviteCode;
  error?: string;
}> {
  try {
    // 统一转换为大写并去除空格
    const normalizedCode = code.trim().toUpperCase();
    
    const inviteCode: any = await queryOne(
      `SELECT * FROM invite_codes 
       WHERE code = ? AND status = 1`,
      [normalizedCode]
    );

    if (!inviteCode) {
      return { valid: false, error: '邀请码不存在或已禁用' };
    }

    // 检查是否过期
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return { valid: false, error: '邀请码已过期' };
    }

    // 检查使用次数
    if (inviteCode.used_count >= inviteCode.max_uses) {
      return { valid: false, error: '邀请码使用次数已达上限' };
    }

    return { valid: true, inviteCode };
  } catch (error) {
    console.error('验证邀请码失败:', error);
    return { valid: false, error: '验证邀请码时发生错误' };
  }
}

/**
 * 使用邀请码
 */
export async function useInviteCode(code: string): Promise<boolean> {
  try {
    const normalizedCode = code.trim().toUpperCase();
    const result: any = await query(
      `UPDATE invite_codes 
       SET used_count = used_count + 1
       WHERE code = ? AND status = 1 AND used_count < max_uses`,
      [normalizedCode]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('使用邀请码失败:', error);
    return false;
  }
}

/**
 * 获取邀请码列表
 */
export async function getInviteCodes(filters: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: number;
  createdBy?: string;
}): Promise<{ codes: InviteCode[]; total: number }> {
  try {
    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      createdBy
    } = filters;

    const offset = (page - 1) * pageSize;
    let whereClauses: string[] = [];
    let params: any[] = [];

    // 构建查询条件
    if (search) {
      whereClauses.push('(code LIKE ? OR name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status !== undefined) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (createdBy) {
      whereClauses.push('created_by = ?');
      params.push(createdBy);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total FROM invite_codes ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询邀请码列表
    const codes: any = await query(
      `SELECT * FROM invite_codes ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)]
    );

    return { codes, total };
  } catch (error) {
    console.error('获取邀请码列表失败:', error);
    throw error;
  }
}

/**
 * 获取单个邀请码详情
 */
export async function getInviteCodeById(id: string): Promise<InviteCode | null> {
  try {
    const inviteCode: any = await queryOne(
      'SELECT * FROM invite_codes WHERE id = ?',
      [id]
    );

    return inviteCode || null;
  } catch (error) {
    console.error('获取邀请码详情失败:', error);
    throw error;
  }
}

/**
 * 更新邀请码
 */
export async function updateInviteCode(
  id: string,
  data: Partial<Omit<CreateInviteCodeData, 'code' | 'createdBy'>>
): Promise<boolean> {
  try {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }

    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }

    if (data.maxUses !== undefined) {
      updateFields.push('max_uses = ?');
      updateValues.push(data.maxUses);
    }

    if (data.expiresAt !== undefined) {
      updateFields.push('expires_at = ?');
      updateValues.push(data.expiresAt);
    }

    if (updateFields.length === 0) {
      return true; // 没有需要更新的字段
    }

    updateValues.push(id);

    const result: any = await query(
      `UPDATE invite_codes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('更新邀请码失败:', error);
    throw error;
  }
}

/**
 * 删除邀请码
 */
export async function deleteInviteCode(id: string): Promise<boolean> {
  try {
    const result: any = await query(
      'DELETE FROM invite_codes WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('删除邀请码失败:', error);
    throw error;
  }
}

/**
 * 修改邀请码状态
 */
export async function updateInviteCodeStatus(id: string, status: 0 | 1): Promise<boolean> {
  try {
    const result: any = await query(
      'UPDATE invite_codes SET status = ? WHERE id = ?',
      [status, id]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('修改邀请码状态失败:', error);
    throw error;
  }
}

/**
 * 获取邀请码使用统计
 */
export async function getInviteCodeStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  expired: number;
  totalUsed: number;
  totalRemaining: number;
}> {
  try {
    const [totalResult, activeResult, expiredResult, usedResult]: any[] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM invite_codes'),
      queryOne('SELECT COUNT(*) as count FROM invite_codes WHERE status = 1'),
      queryOne('SELECT COUNT(*) as count FROM invite_codes WHERE expires_at IS NOT NULL AND expires_at < NOW()'),
      queryOne('SELECT SUM(used_count) as used, SUM(max_uses) as max FROM invite_codes WHERE status = 1')
    ]);

    const total = totalResult?.count || 0;
    const active = activeResult?.count || 0;
    const expired = expiredResult?.count || 0;
    const totalUsed = usedResult?.used || 0;
    const totalMax = usedResult?.max || 0;

    return {
      total,
      active,
      inactive: total - active,
      expired,
      totalUsed,
      totalRemaining: Math.max(0, totalMax - totalUsed)
    };
  } catch (error) {
    console.error('获取邀请码统计失败:', error);
    throw error;
  }
}

/**
 * 生成随机邀请码
 */
export function generateRandomInviteCode(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 批量创建邀请码
 */
export async function batchCreateInviteCodes(
  count: number,
  options: {
    name?: string;
    description?: string;
    maxUses?: number;
    expiresAt?: Date;
    createdBy?: string;
  }
): Promise<string[]> {
  try {
    const inviteIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = generateRandomInviteCode();
      const inviteId = await createInviteCode({
        code,
        name: options.name ? `${options.name} (${i + 1})` : undefined,
        description: options.description,
        maxUses: options.maxUses,
        expiresAt: options.expiresAt,
        createdBy: options.createdBy
      });
      inviteIds.push(inviteId);
    }

    console.log(`批量创建 ${count} 个邀请码成功`);
    return inviteIds;
  } catch (error) {
    console.error('批量创建邀请码失败:', error);
    throw error;
  }
}