/**
 * 审计日志工具类
 * 用于记录用户操作日志
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';

export enum AuditAction {
  // 认证相关
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
  
  // 用户管理
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  UPDATE_USER_STATUS = 'UPDATE_USER_STATUS',
  
  // 角色管理
  CREATE_ROLE = 'CREATE_ROLE',
  UPDATE_ROLE = 'UPDATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
  ASSIGN_PERMISSION = 'ASSIGN_PERMISSION',
  
  // 占卜相关
  CREATE_DIVINATION = 'CREATE_DIVINATION',
  UPDATE_DIVINATION = 'UPDATE_DIVINATION',
  DELETE_DIVINATION = 'DELETE_DIVINATION',
  AI_ANALYSIS = 'AI_ANALYSIS',
  
  // 系统管理
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  DATA_BACKUP = 'DATA_BACKUP',
  
  // 邀请码管理
  CREATE_INVITE = 'CREATE_INVITE',
  UPDATE_INVITE = 'UPDATE_INVITE',
  DELETE_INVITE = 'DELETE_INVITE',
}

export interface AuditLogData {
  userId?: string;
  username?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 0 | 1; // 0-失败 1-成功
  errorMessage?: string;
}

/**
 * 记录审计日志
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const logId = uuidv4();
    
    await query(
      `INSERT INTO audit_logs (
        id, user_id, username, action, resource_type, resource_id,
        details, ip_address, user_agent, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        data.userId || null,
        data.username || null,
        data.action,
        data.resourceType || null,
        data.resourceId || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress || null,
        data.userAgent || null,
        data.status,
        data.errorMessage || null
      ]
    );

    console.log(`审计日志已记录: ${data.action} - ${data.username} - ${data.status ? '成功' : '失败'}`);
  } catch (error) {
    console.error('记录审计日志失败:', error);
    // 审计日志记录失败不应该影响主业务流程
  }
}

/**
 * 记录成功操作
 */
export async function logSuccess(data: Omit<AuditLogData, 'status'>): Promise<void> {
  await logAudit({ ...data, status: 1 });
}

/**
 * 记录失败操作
 */
export async function logFailure(data: Omit<AuditLogData, 'status'>): Promise<void> {
  await logAudit({ ...data, status: 0 });
}

/**
 * 获取审计日志列表
 */
export async function getAuditLogs(filters: {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ logs: any[]; total: number }> {
  try {
    const {
      page = 1,
      pageSize = 20,
      userId,
      action,
      resourceType,
      status,
      startDate,
      endDate
    } = filters;

    const offset = (page - 1) * pageSize;
    let whereClauses: string[] = [];
    let params: any[] = [];

    // 构建查询条件
    if (userId) {
      whereClauses.push('user_id = ?');
      params.push(userId);
    }

    if (action) {
      whereClauses.push('action = ?');
      params.push(action);
    }

    if (resourceType) {
      whereClauses.push('resource_type = ?');
      params.push(resourceType);
    }

    if (status !== undefined) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询日志列表
    const logs: any = await query(
      `SELECT * FROM audit_logs ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return { logs, total };
  } catch (error) {
    console.error('获取审计日志失败:', error);
    throw error;
  }
}

/**
 * 清理过期的审计日志
 */
export async function cleanupAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const result: any = await query(
      `DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysToKeep]
    );
    
    return result.affectedRows || 0;
  } catch (error) {
    console.error('清理审计日志失败:', error);
    throw error;
  }
}

/**
 * 导出审计日志
 */
export async function exportAuditLogs(filters: {
  userId?: string;
  action?: string;
  resourceType?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}): Promise<any[]> {
  try {
    const {
      userId,
      action,
      resourceType,
      status,
      startDate,
      endDate
    } = filters;

    let whereClauses: string[] = [];
    let params: any[] = [];

    // 构建查询条件
    if (userId) {
      whereClauses.push('user_id = ?');
      params.push(userId);
    }

    if (action) {
      whereClauses.push('action = ?');
      params.push(action);
    }

    if (resourceType) {
      whereClauses.push('resource_type = ?');
      params.push(resourceType);
    }

    if (status !== undefined) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询所有匹配的日志
    const logs: any = await query(
      `SELECT 
        id, user_id, username, action, resource_type, resource_id,
        details, ip_address, user_agent, status, error_message, created_at
       FROM audit_logs ${whereClause}
       ORDER BY created_at DESC`,
      params
    );

    // 处理导出数据
    return logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      statusText: log.status === 1 ? '成功' : '失败',
      createdAt: log.created_at
    }));
  } catch (error) {
    console.error('导出审计日志失败:', error);
    throw error;
  }
}