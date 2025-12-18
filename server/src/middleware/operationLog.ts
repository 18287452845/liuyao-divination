/**
 * 操作日志中间件
 * 自动记录用户的关键操作
 */

import { Request, Response, NextFunction } from 'express';
import { recordOperationLog } from '../controllers/logController';

/**
 * 操作日志记录中间件
 * @param operationType 操作类型
 * @param operationModule 操作模块
 * @param operationDescription 操作描述
 */
export function logOperation(
  operationType: string,
  operationModule: string,
  operationDescription?: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 记录开始时间
    const startTime = Date.now();

    // 重写res.end以记录响应
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): any {
      // 计算执行时间
      const executionTime = Date.now() - startTime;

      // 异步记录日志，不阻塞响应
      setImmediate(() => {
        try {
          const description = operationDescription || 
            `${operationType} ${operationModule}${req.params.id ? ' (ID: ' + req.params.id + ')' : ''}`;
          
          recordOperationLog(
            req.user?.userId || null,
            req.user?.username || 'anonymous',
            operationType,
            operationModule,
            description,
            req,
            res,
            executionTime
          );
        } catch (error) {
          console.error('记录操作日志失败:', error);
        }
      });

      // 调用原始的end方法
      originalEnd.call(this, chunk, encoding);
      return res;
    };

    next();
  };
}

/**
 * 敏感操作日志记录中间件
 * 用于记录登录、权限变更等敏感操作
 */
export function logSensitiveOperation(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // 重写res.end以记录响应
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const executionTime = Date.now() - startTime;

    // 异步记录日志
    setImmediate(() => {
      try {
        let operationType = 'UNKNOWN';
        let operationModule = 'SYSTEM';
        let description = '未知操作';

        // 根据路径和方法推断操作类型
        const path = req.path;
        const method = req.method;

        if (path.includes('/auth/login')) {
          operationType = 'LOGIN';
          operationModule = 'AUTH';
          description = '用户登录';
        } else if (path.includes('/auth/logout')) {
          operationType = 'LOGOUT';
          operationModule = 'AUTH';
          description = '用户登出';
        } else if (path.includes('/auth/register')) {
          operationType = 'REGISTER';
          operationModule = 'AUTH';
          description = '用户注册';
        } else if (path.includes('/users') && method === 'POST') {
          operationType = 'CREATE_USER';
          operationModule = 'USER_MANAGEMENT';
          description = '创建用户';
        } else if (path.includes('/users') && method === 'PUT') {
          operationType = 'UPDATE_USER';
          operationModule = 'USER_MANAGEMENT';
          description = '更新用户信息';
        } else if (path.includes('/users') && method === 'DELETE') {
          operationType = 'DELETE_USER';
          operationModule = 'USER_MANAGEMENT';
          description = '删除用户';
        } else if (path.includes('/roles') && method === 'POST') {
          operationType = 'CREATE_ROLE';
          operationModule = 'ROLE_MANAGEMENT';
          description = '创建角色';
        } else if (path.includes('/roles') && method === 'PUT') {
          operationType = 'UPDATE_ROLE';
          operationModule = 'ROLE_MANAGEMENT';
          description = '更新角色';
        } else if (path.includes('/roles') && method === 'DELETE') {
          operationType = 'DELETE_ROLE';
          operationModule = 'ROLE_MANAGEMENT';
          description = '删除角色';
        } else if (path.includes('/security/lock')) {
          operationType = 'LOCK_USER';
          operationModule = 'SECURITY';
          description = `锁定用户 (ID: ${req.params.userId})`;
        } else if (path.includes('/security/unlock')) {
          operationType = 'UNLOCK_USER';
          operationModule = 'SECURITY';
          description = `解锁用户 (ID: ${req.params.userId})`;
        } else if (path.includes('/security/force-reset-password')) {
          operationType = 'FORCE_RESET_PASSWORD';
          operationModule = 'SECURITY';
          description = `强制重置用户密码 (ID: ${req.params.userId})`;
        } else if (path.includes('/divination') && method === 'POST') {
          operationType = 'CREATE_DIVINATION';
          operationModule = 'DIVINATION';
          description = '创建占卜记录';
        } else if (path.includes('/divination') && method === 'DELETE') {
          operationType = 'DELETE_DIVINATION';
          operationModule = 'DIVINATION';
          description = `删除占卜记录 (ID: ${req.params.id})`;
        } else if (path.includes('/ai/analyze')) {
          operationType = 'AI_ANALYSIS';
          operationModule = 'AI';
          description = 'AI解卦分析';
        }

        recordOperationLog(
          req.user?.userId || null,
          req.user?.username || 'anonymous',
          operationType,
          operationModule,
          description,
          req,
          res,
          executionTime
        );
      } catch (error) {
        console.error('记录敏感操作日志失败:', error);
      }
    });

    originalEnd.call(this, chunk, encoding);
    return res;
  };

  next();
}

/**
 * 错误操作日志记录
 */
export function logErrorOperation(error: Error, req: Request, res: Response) {
  setImmediate(() => {
    try {
      recordOperationLog(
        req.user?.userId || null,
        req.user?.username || 'anonymous',
        'ERROR',
        'SYSTEM',
        `操作错误: ${error.message}`,
        req,
        res,
        0
      );
    } catch (logError) {
      console.error('记录错误操作日志失败:', logError);
    }
  });
}