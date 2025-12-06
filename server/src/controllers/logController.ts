/**
 * 日志管理控制器
 * 处理登录日志和操作日志的查询、删除等操作
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../models/database';

/**
 * 获取登录日志列表
 */
export async function getLoginLogs(req: Request, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      search = '', 
      status = '', 
      startDate = '', 
      endDate = '',
      username = ''
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    let whereClauses: string[] = [];
    let params: any[] = [];

    // 搜索条件
    if (search) {
      whereClauses.push('(l.username LIKE ? OR l.ip_address LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // 状态过滤
    if (status !== '') {
      whereClauses.push('l.login_status = ?');
      params.push(Number(status));
    }

    // 时间范围过滤
    if (startDate) {
      whereClauses.push('l.login_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('l.login_time <= ?');
      params.push(endDate);
    }

    // 用户名过滤
    if (username) {
      whereClauses.push('l.username = ?');
      params.push(username);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total FROM login_logs l ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询登录日志列表
    const logs: any = await query(
      `SELECT l.*,
              u.real_name,
              CASE 
                WHEN l.login_status = 1 THEN '登录成功'
                WHEN l.login_status = 0 THEN '登录失败'
                ELSE '未知'
              END as status_text
       FROM login_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.login_time DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

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
    console.error('获取登录日志错误:', error);
    res.status(500).json({
      success: false,
      message: '获取登录日志失败',
    });
  }
}

/**
 * 获取操作日志列表
 */
export async function getOperationLogs(req: Request, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      search = '', 
      module = '', 
      operation = '', 
      startDate = '', 
      endDate = '',
      username = ''
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    let whereClauses: string[] = [];
    let params: any[] = [];

    // 搜索条件
    if (search) {
      whereClauses.push('(l.username LIKE ? OR l.operation_description LIKE ? OR l.request_url LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 模块过滤
    if (module) {
      whereClauses.push('l.operation_module = ?');
      params.push(module);
    }

    // 操作类型过滤
    if (operation) {
      whereClauses.push('l.operation_type = ?');
      params.push(operation);
    }

    // 时间范围过滤
    if (startDate) {
      whereClauses.push('l.operation_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('l.operation_time <= ?');
      params.push(endDate);
    }

    // 用户名过滤
    if (username) {
      whereClauses.push('l.username = ?');
      params.push(username);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 查询总数
    const countResult: any = await queryOne(
      `SELECT COUNT(*) as total FROM operation_logs l ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询操作日志列表
    const logs: any = await query(
      `SELECT l.*,
              u.real_name
       FROM operation_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.operation_time DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

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
    console.error('获取操作日志错误:', error);
    res.status(500).json({
      success: false,
      message: '获取操作日志失败',
    });
  }
}

/**
 * 记录登录日志
 */
export async function recordLoginLog(
  userId: string | null,
  username: string,
  ipAddress: string,
  userAgent: string,
  status: number,
  failureReason?: string,
  sessionId?: string
): Promise<void> {
  try {
    const logId = uuidv4();
    await query(
      `INSERT INTO login_logs (id, user_id, username, ip_address, user_agent, login_status, failure_reason, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, userId, username, ipAddress, userAgent, status, failureReason || null, sessionId || null]
    );
  } catch (error) {
    console.error('记录登录日志错误:', error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 记录操作日志
 */
export async function recordOperationLog(
  userId: string | null,
  username: string,
  operationType: string,
  operationModule: string,
  operationDescription: string,
  req: Request,
  res: any,
  executionTime?: number
): Promise<void> {
  try {
    const logId = uuidv4();
    const requestParams = JSON.stringify({
      query: req.query,
      params: req.params,
      body: req.body
    });

    await query(
      `INSERT INTO operation_logs (id, user_id, username, operation_type, operation_module, operation_description, request_method, request_url, request_params, response_status, ip_address, user_agent, execution_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        userId,
        username,
        operationType,
        operationModule,
        operationDescription,
        req.method,
        req.originalUrl,
        requestParams,
        res?.statusCode || null,
        req.ip || req.connection.remoteAddress || '',
        req.get('User-Agent') || '',
        executionTime || null
      ]
    );
  } catch (error) {
    console.error('记录操作日志错误:', error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 删除登录日志
 */
export async function deleteLoginLogs(req: Request, res: Response): Promise<void> {
  try {
    const { beforeDate } = req.body;

    if (!beforeDate) {
      res.status(400).json({
        success: false,
        message: '请提供删除截止日期',
      });
      return;
    }

    const result: any = await query(
      'DELETE FROM login_logs WHERE login_time < ?',
      [beforeDate]
    );

    res.json({
      success: true,
      message: `已删除 ${result.affectedRows} 条登录日志`,
      data: {
        deletedCount: result.affectedRows,
      },
    });
  } catch (error) {
    console.error('删除登录日志错误:', error);
    res.status(500).json({
      success: false,
      message: '删除登录日志失败',
    });
  }
}

/**
 * 删除操作日志
 */
export async function deleteOperationLogs(req: Request, res: Response): Promise<void> {
  try {
    const { beforeDate } = req.body;

    if (!beforeDate) {
      res.status(400).json({
        success: false,
        message: '请提供删除截止日期',
      });
      return;
    }

    const result: any = await query(
      'DELETE FROM operation_logs WHERE operation_time < ?',
      [beforeDate]
    );

    res.json({
      success: true,
      message: `已删除 ${result.affectedRows} 条操作日志`,
      data: {
        deletedCount: result.affectedRows,
      },
    });
  } catch (error) {
    console.error('删除操作日志错误:', error);
    res.status(500).json({
      success: false,
      message: '删除操作日志失败',
    });
  }
}

/**
 * 导出登录日志
 */
export async function exportLoginLogs(req: Request, res: Response): Promise<void> {
  try {
    const { format = 'csv', startDate, endDate, username } = req.query;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (startDate) {
      whereClauses.push('login_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('login_time <= ?');
      params.push(endDate);
    }
    if (username) {
      whereClauses.push('username = ?');
      params.push(username);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const logs: any = await query(
      `SELECT l.*, u.real_name
       FROM login_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.login_time DESC`,
      params
    );

    if (format === 'csv') {
      // 生成CSV格式
      const csvHeader = '登录时间,用户名,真实姓名,IP地址,登录状态,失败原因,用户代理\n';
      const csvData = logs.map((log: any) => 
        `${log.login_time},${log.username},${log.real_name || ''},${log.ip_address},${log.login_status === 1 ? '成功' : '失败'},${log.failure_reason || ''},"${log.user_agent || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="login_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csvHeader + csvData); // 添加BOM以支持中文
    } else {
      // JSON格式
      res.json({
        success: true,
        data: logs,
        exportTime: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('导出登录日志错误:', error);
    res.status(500).json({
      success: false,
      message: '导出登录日志失败',
    });
  }
}

/**
 * 导出操作日志
 */
export async function exportOperationLogs(req: Request, res: Response): Promise<void> {
  try {
    const { format = 'csv', startDate, endDate, username, module } = req.query;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (startDate) {
      whereClauses.push('operation_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('operation_time <= ?');
      params.push(endDate);
    }
    if (username) {
      whereClauses.push('username = ?');
      params.push(username);
    }
    if (module) {
      whereClauses.push('operation_module = ?');
      params.push(module);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const logs: any = await query(
      `SELECT l.*, u.real_name
       FROM operation_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.operation_time DESC`,
      params
    );

    if (format === 'csv') {
      // 生成CSV格式
      const csvHeader = '操作时间,用户名,真实姓名,操作模块,操作类型,操作描述,请求方法,请求URL,响应状态,执行时间(ms)\n';
      const csvData = logs.map((log: any) => 
        `${log.operation_time},${log.username},${log.real_name || ''},${log.operation_module},${log.operation_type},"${log.operation_description || ''}",${log.request_method},${log.request_url},${log.response_status},${log.execution_time || ''}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="operation_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csvHeader + csvData);
    } else {
      // JSON格式
      res.json({
        success: true,
        data: logs,
        exportTime: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('导出操作日志错误:', error);
    res.status(500).json({
      success: false,
      message: '导出操作日志失败',
    });
  }
}