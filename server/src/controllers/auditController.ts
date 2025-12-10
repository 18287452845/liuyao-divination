/**
 * 审计日志管理控制器
 * 管理员查看和管理审计日志
 */

import { Request, Response } from 'express';
import { getAuditLogs, exportAuditLogs, cleanupAuditLogs, logSuccess, logFailure, AuditAction } from '../utils/audit';

// 扩展Request接口以包含user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

/**
 * 获取审计日志列表
 */
export async function getAuditLogList(req: Request, res: Response): Promise<void> {
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
    } = req.query;

    const { logs, total } = await getAuditLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      userId: userId as string,
      action: action as string,
      resourceType: resourceType as string,
      status: status !== undefined ? Number(status) : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.json({
      success: true,
      data: {
        list: logs,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取审计日志列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志列表失败',
    });
  }
}

/**
 * 导出审计日志
 */
export async function exportAuditLogController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { 
      userId, 
      action, 
      resourceType, 
      status,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    const logs = await exportAuditLogs({
      userId: userId as string,
      action: action as string,
      resourceType: resourceType as string,
      status: status !== undefined ? Number(status) : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    });

    // 记录导出操作日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.DATA_EXPORT,
      resourceType: 'audit_log',
      details: { 
        format, 
        filters: { userId, action, resourceType, status, startDate, endDate },
        count: logs.length 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (format === 'csv') {
      // 导出为CSV格式
      const csvHeader = 'ID,用户ID,用户名,操作,资源类型,资源ID,详情,IP地址,用户代理,状态,错误信息,创建时间\n';
      const csvData = logs.map(log => [
        log.id,
        log.user_id || '',
        log.username || '',
        log.action,
        log.resource_type || '',
        log.resource_id || '',
        `"${log.details ? JSON.stringify(log.details).replace(/"/g, '""') : ''}"`,
        log.ip_address || '',
        `"${log.user_agent ? log.user_agent.replace(/"/g, '""') : ''}"`,
        log.statusText,
        `"${log.error_message || ''}"`,
        log.createdAt
      ].join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\ufeff' + csvHeader + csvData); // 添加BOM以支持中文
    } else {
      // 默认导出为JSON格式
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        exportTime: new Date().toISOString(),
        total: logs.length,
        data: logs
      });
    }
  } catch (error) {
    console.error('导出审计日志错误:', error);
    res.status(500).json({
      success: false,
      message: '导出审计日志失败',
    });
  }
}

/**
 * 清理过期的审计日志
 */
export async function cleanupAuditLogController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { days = 90 } = req.body;

    // 验证天数
    if (days < 30 || days > 365) {
      res.status(400).json({
        success: false,
        message: '清理天数应在30-365之间',
      });
      return;
    }

    const deletedCount = await cleanupAuditLogs(Number(days));

    // 记录清理操作日志
    await logSuccess({
      userId: req.user.userId,
      username: req.user.username,
      action: AuditAction.AUDIT_CLEANUP,
      resourceType: 'audit_log',
      details: { days, deletedCount },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `成功清理 ${deletedCount} 条过期日志`,
      data: { deletedCount, days }
    });
  } catch (error) {
    console.error('清理审计日志错误:', error);
    res.status(500).json({
      success: false,
      message: '清理审计日志失败',
    });
  }
}

/**
 * 获取审计日志统计信息
 */
export async function getAuditLogStatistics(req: Request, res: Response): Promise<void> {
  try {
    // 这里可以添加更多统计信息
    // 当前简化实现，只返回基本统计
    
    const { 
      startDate,
      endDate
    } = req.query;

    // 获取总日志数
    const { logs: allLogs } = await getAuditLogs({
      page: 1,
      pageSize: 1,
      startDate: startDate as string,
      endDate: endDate as string
    });

    // 获取成功和失败的数量
    const { logs: successLogs } = await getAuditLogs({
      page: 1,
      pageSize: 1,
      status: 1,
      startDate: startDate as string,
      endDate: endDate as string
    });

    const { logs: failureLogs } = await getAuditLogs({
      page: 1,
      pageSize: 1,
      status: 0,
      startDate: startDate as string,
      endDate: endDate as string
    });

    // 获取今日日志数
    const today = new Date().toISOString().split('T')[0];
    const { logs: todayLogs } = await getAuditLogs({
      page: 1,
      pageSize: 1,
      startDate: today,
      endDate: today
    });

    const statistics = {
      total: allLogs.length,
      success: successLogs.length,
      failure: failureLogs.length,
      today: todayLogs.length,
      successRate: allLogs.length > 0 ? Math.round((successLogs.length / allLogs.length) * 100) : 0
    };

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('获取审计日志统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志统计失败',
    });
  }
}