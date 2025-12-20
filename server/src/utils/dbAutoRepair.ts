/**
 * 数据库自动修复工具
 * 自动诊断和修复常见的数据库错误
 */

import { query } from '../models/database';

export interface DBError extends Error {
  code?: string;
  errno?: number;
  sql?: string;
  sqlState?: string;
  sqlMessage?: string;
}

export interface RepairResult {
  success: boolean;
  message: string;
  action?: string;
  sqlExecuted?: string;
}

/**
 * 诊断和修复数据库错误
 */
export async function diagnosisAndRepair(error: DBError, originalSql: string, params?: any[]): Promise<RepairResult> {
  console.log('\n=== 数据库错误自动诊断 ===');
  console.log('错误代码:', error.code);
  console.log('错误信息:', error.sqlMessage || error.message);
  console.log('SQL语句:', originalSql);
  console.log('参数:', params);

  try {
    // 1. ER_WRONG_ARGUMENTS - 参数类型错误
    if (error.code === 'ER_WRONG_ARGUMENTS' && error.errno === 1210) {
      return await repairWrongArguments(originalSql, params);
    }

    // 2. ER_NO_SUCH_TABLE - 表不存在
    if (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146) {
      return await repairMissingTable(error);
    }

    // 3. ER_BAD_FIELD_ERROR - 字段不存在
    if (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054) {
      return await repairMissingColumn(error);
    }

    // 4. ER_DUP_FIELDNAME - 重复字段
    if (error.code === 'ER_DUP_FIELDNAME' || error.errno === 1060) {
      return await repairDuplicateColumn(error);
    }

    // 5. ER_PARSE_ERROR - SQL语法错误
    if (error.code === 'ER_PARSE_ERROR' || error.errno === 1064) {
      return await repairSyntaxError(error, originalSql);
    }

    return {
      success: false,
      message: `未知错误类型: ${error.code || error.errno}，无法自动修复`
    };
  } catch (repairError) {
    console.error('自动修复失败:', repairError);
    return {
      success: false,
      message: `自动修复失败: ${repairError instanceof Error ? repairError.message : String(repairError)}`
    };
  }
}

/**
 * 修复参数类型错误 (ER_WRONG_ARGUMENTS)
 */
async function repairWrongArguments(sql: string, params?: any[]): Promise<RepairResult> {
  console.log('\n>>> 检测到参数类型错误 (ER_WRONG_ARGUMENTS)');
  
  if (!params || params.length === 0) {
    return {
      success: false,
      message: '参数为空，无法修复'
    };
  }

  // 检查是否包含 LIMIT 和 OFFSET
  if (sql.includes('LIMIT') && sql.includes('OFFSET')) {
    console.log('>>> 检测到 LIMIT/OFFSET 语句');
    
    // 找出非数字类型的参数
    const issues: string[] = [];
    params.forEach((param, index) => {
      const paramType = typeof param;
      if (param !== null && param !== undefined) {
        if (paramType === 'string' && !isNaN(Number(param))) {
          issues.push(`参数[${index}] = "${param}" (字符串) 应该是数字类型`);
        } else if (paramType !== 'number' && paramType !== 'string' && paramType !== 'object') {
          issues.push(`参数[${index}] = ${param} (${paramType}) 类型异常`);
        }
      }
    });

    if (issues.length > 0) {
      console.log('>>> 发现问题:');
      issues.forEach(issue => console.log('   ', issue));
      
      return {
        success: true,
        message: 'LIMIT/OFFSET 参数必须是数字类型，请确保在传递参数前使用 Number() 进行类型转换',
        action: 'TYPE_CONVERSION_NEEDED',
        sqlExecuted: '建议修复代码:\n' +
                     '// 修复前:\n' +
                     'params.push(limit, offset)\n\n' +
                     '// 修复后:\n' +
                     'params.push(Number(limit), Number(offset))'
      };
    }
  }

  // 检查其他可能导致参数错误的情况
  const paramTypes = params.map((p, i) => `[${i}]: ${typeof p} = ${p}`).join(', ');
  console.log('>>> 参数类型:', paramTypes);

  return {
    success: true,
    message: '参数类型可能不匹配，请检查所有参数是否为正确的类型（数字、字符串、日期等）',
    action: 'CHECK_PARAM_TYPES'
  };
}

/**
 * 修复表不存在错误 (ER_NO_SUCH_TABLE)
 */
async function repairMissingTable(error: DBError): Promise<RepairResult> {
  console.log('\n>>> 检测到表不存在错误');
  
  // 从错误信息中提取表名
  const tableNameMatch = error.sqlMessage?.match(/Table '.*?\.(\w+)' doesn't exist/);
  if (!tableNameMatch) {
    return {
      success: false,
      message: '无法从错误信息中提取表名'
    };
  }

  const tableName = tableNameMatch[1];
  console.log(`>>> 缺失的表: ${tableName}`);

  // 表结构映射
  const tableSchemas: { [key: string]: string } = {
    'invite_codes': `
      CREATE TABLE IF NOT EXISTS invite_codes (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100),
        description TEXT,
        max_uses INT DEFAULT 1,
        used_count INT DEFAULT 0,
        expires_at DATETIME,
        status TINYINT DEFAULT 1,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_status (status),
        INDEX idx_created_by (created_by),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    'users': `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        status TINYINT DEFAULT 1,
        invite_code VARCHAR(50),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    'audit_logs': `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        username VARCHAR(50),
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(36),
        status VARCHAR(20) DEFAULT 'success',
        details JSON,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_resource (resource_type, resource_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    'sessions': `
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        refresh_token VARCHAR(255) UNIQUE,
        ip_address VARCHAR(50),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_token (token),
        INDEX idx_refresh_token (refresh_token),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    'token_blacklist': `
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id VARCHAR(36) PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(36),
        reason VARCHAR(100),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    'operation_logs': `
      CREATE TABLE IF NOT EXISTS operation_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        username VARCHAR(50),
        operation VARCHAR(100) NOT NULL,
        module VARCHAR(50),
        details JSON,
        ip_address VARCHAR(50),
        user_agent TEXT,
        status TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_operation (operation),
        INDEX idx_module (module),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  };

  const schema = tableSchemas[tableName];
  if (!schema) {
    return {
      success: false,
      message: `表 ${tableName} 不存在，且没有可用的自动修复方案。请手动运行数据库初始化脚本。`
    };
  }

  try {
    console.log(`>>> 正在创建表 ${tableName}...`);
    await query(schema);
    console.log(`>>> 表 ${tableName} 创建成功！`);

    return {
      success: true,
      message: `表 ${tableName} 已自动创建`,
      action: 'TABLE_CREATED',
      sqlExecuted: schema.trim()
    };
  } catch (createError) {
    console.error(`>>> 创建表失败:`, createError);
    return {
      success: false,
      message: `创建表 ${tableName} 失败: ${createError instanceof Error ? createError.message : String(createError)}`
    };
  }
}

/**
 * 修复字段不存在错误 (ER_BAD_FIELD_ERROR)
 */
async function repairMissingColumn(error: DBError): Promise<RepairResult> {
  console.log('\n>>> 检测到字段不存在错误');
  
  // 从错误信息中提取字段名和表名
  const columnMatch = error.sqlMessage?.match(/Unknown column '(\w+)'/);
  if (!columnMatch) {
    return {
      success: false,
      message: '无法从错误信息中提取字段名'
    };
  }

  const columnName = columnMatch[1];
  console.log(`>>> 缺失的字段: ${columnName}`);

  // 常见字段修复方案
  const columnSchemas: { [key: string]: { table: string; sql: string } } = {
    'invite_code': {
      table: 'users',
      sql: 'ALTER TABLE users ADD COLUMN invite_code VARCHAR(50) AFTER status;'
    },
    'last_login': {
      table: 'users',
      sql: 'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER status;'
    },
    'login_fail_count': {
      table: 'users',
      sql: 'ALTER TABLE users ADD COLUMN login_fail_count INT DEFAULT 0 COMMENT "登录失败次数" AFTER status;'
    },
    'locked_until': {
      table: 'users',
      sql: 'ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL COMMENT "账号锁定截止时间" AFTER login_fail_count;'
    },
    'last_password_change': {
      table: 'users',
      sql: 'ALTER TABLE users ADD COLUMN last_password_change TIMESTAMP NULL COMMENT "最后密码修改时间" AFTER locked_until;'
    },
    'refresh_token': {
      table: 'sessions',
      sql: 'ALTER TABLE sessions ADD COLUMN refresh_token VARCHAR(255) UNIQUE AFTER token;'
    },
    'user_agent': {
      table: 'audit_logs',
      sql: 'ALTER TABLE audit_logs ADD COLUMN user_agent TEXT AFTER ip_address;'
    }
  };

  const schema = columnSchemas[columnName];
  if (!schema) {
    return {
      success: false,
      message: `字段 ${columnName} 不存在，且没有可用的自动修复方案。请检查数据库表结构。`
    };
  }

  try {
    console.log(`>>> 正在添加字段 ${columnName} 到表 ${schema.table}...`);
    await query(schema.sql);
    console.log(`>>> 字段 ${columnName} 添加成功！`);

    return {
      success: true,
      message: `字段 ${columnName} 已自动添加到表 ${schema.table}`,
      action: 'COLUMN_ADDED',
      sqlExecuted: schema.sql
    };
  } catch (addError) {
    console.error(`>>> 添加字段失败:`, addError);
    return {
      success: false,
      message: `添加字段 ${columnName} 失败: ${addError instanceof Error ? addError.message : String(addError)}`
    };
  }
}

/**
 * 修复重复字段错误 (ER_DUP_FIELDNAME)
 */
async function repairDuplicateColumn(error: DBError): Promise<RepairResult> {
  console.log('\n>>> 检测到重复字段错误');
  
  return {
    success: false,
    message: '检测到重复字段定义，这通常是SQL语句错误导致的，无法自动修复。请检查SQL语句。'
  };
}

/**
 * 修复SQL语法错误 (ER_PARSE_ERROR)
 */
async function repairSyntaxError(error: DBError, sql: string): Promise<RepairResult> {
  console.log('\n>>> 检测到SQL语法错误');
  console.log('>>> SQL:', sql);
  
  // 提供一些常见的语法错误建议
  const suggestions: string[] = [];

  if (sql.includes('LIMIT') && !sql.includes('?')) {
    suggestions.push('- LIMIT 子句可能缺少参数占位符 ?');
  }
  
  if (sql.includes('WHERE') && sql.includes('=') && !sql.includes('?')) {
    suggestions.push('- WHERE 条件可能缺少参数占位符 ?');
  }

  if (sql.match(/,\s*FROM/)) {
    suggestions.push('- SELECT 子句可能有多余的逗号');
  }

  if (sql.match(/WHERE\s+AND/)) {
    suggestions.push('- WHERE 后直接跟 AND 是错误的');
  }

  return {
    success: false,
    message: 'SQL语法错误，无法自动修复。' + 
             (suggestions.length > 0 ? '\n\n可能的问题:\n' + suggestions.join('\n') : '')
  };
}

/**
 * 清理过期的token黑名单
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const result: any = await query(
      'DELETE FROM token_blacklist WHERE expires_at < NOW()'
    );
    if (result.affectedRows > 0) {
      console.log(`清理了 ${result.affectedRows} 条过期的token黑名单记录`);
    }
  } catch (error) {
    console.error('清理过期token失败:', error);
  }
}

/**
 * 清理过期的会话
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const result: any = await query(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    if (result.affectedRows > 0) {
      console.log(`清理了 ${result.affectedRows} 条过期的会话记录`);
    }
  } catch (error) {
    console.error('清理过期会话失败:', error);
  }
}

/**
 * 检查数据库健康状态
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  try {
    // 1. 检查必需的表是否存在
    const requiredTables = [
      'divination_records', 'trigrams', 'gua_data',
      'users', 'invite_codes', 'sessions', 
      'token_blacklist', 'audit_logs'
    ];

    for (const table of requiredTables) {
      const result: any = await query(
        `SELECT COUNT(*) as count FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [table]
      );
      
      if (result[0].count === 0) {
        issues.push(`表 ${table} 不存在`);
        suggestions.push(`运行 SQL: CREATE TABLE ${table} ...`);
      }
    }

    // 2. 检查数据库连接池状态
    // MySQL2 连接池的统计信息
    // 注意: pool 对象可能没有直接暴露这些属性，这里仅作示例
    // console.log('连接池状态:', pool);

    // 3. 检查是否有锁表情况
    const locks: any = await query('SHOW OPEN TABLES WHERE In_use > 0');
    if (locks.length > 0) {
      issues.push(`检测到 ${locks.length} 个表被锁定`);
      suggestions.push('考虑优化查询或检查长事务');
    }

    return {
      healthy: issues.length === 0,
      issues,
      suggestions
    };
  } catch (error) {
    return {
      healthy: false,
      issues: [`数据库健康检查失败: ${error instanceof Error ? error.message : String(error)}`],
      suggestions: ['检查数据库连接配置', '确认MySQL服务正在运行']
    };
  }
}
