import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// MySQL连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'liuyao_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,  // 60秒连接超时
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
export const pool = mysql.createPool(dbConfig);

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL数据库连接成功');
    console.log(`  数据库: ${dbConfig.database}`);
    console.log(`  主机: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (err) {
    console.error('✗ MySQL数据库连接失败:', err);
    console.error('  请检查:');
    console.error('  1. MySQL服务是否启动');
    console.error('  2. 数据库配置是否正确 (.env文件)');
    console.error('  3. 数据库liuyao_db是否已创建');
    return false;
  }
}

// 数据库查询辅助函数
export async function query(sql: string, params?: any[]) {
  try {
    // 自动修复LIMIT/OFFSET参数类型问题
    if (params && params.length > 0 && sql.includes('LIMIT') && sql.includes('OFFSET')) {
      // 确保最后两个参数（通常是LIMIT和OFFSET）是数字类型
      const limitIndex = params.length - 2;
      const offsetIndex = params.length - 1;
      
      if (limitIndex >= 0 && params[limitIndex] !== null && params[limitIndex] !== undefined) {
        const originalLimit = params[limitIndex];
        params[limitIndex] = Number(params[limitIndex]);
        if (originalLimit !== params[limitIndex] && typeof originalLimit !== 'number') {
          console.warn(`自动修复: LIMIT参数从 ${typeof originalLimit} 类型转换为 number 类型`);
        }
      }
      
      if (offsetIndex >= 0 && params[offsetIndex] !== null && params[offsetIndex] !== undefined) {
        const originalOffset = params[offsetIndex];
        params[offsetIndex] = Number(params[offsetIndex]);
        if (originalOffset !== params[offsetIndex] && typeof originalOffset !== 'number') {
          console.warn(`自动修复: OFFSET参数从 ${typeof originalOffset} 类型转换为 number 类型`);
        }
      }
    }
    
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (err) {
    console.error('数据库查询错误:', err);
    
    // 尝试自动诊断和修复错误
    try {
      const { diagnosisAndRepair } = await import('../utils/dbAutoRepair');
      const repairResult = await diagnosisAndRepair(err as any, sql, params);
      
      console.log('\n=== 自动修复结果 ===');
      console.log('状态:', repairResult.success ? '成功' : '失败');
      console.log('信息:', repairResult.message);
      if (repairResult.action) {
        console.log('操作:', repairResult.action);
      }
      if (repairResult.sqlExecuted) {
        console.log('执行的SQL:\n', repairResult.sqlExecuted);
      }
      console.log('==================\n');
      
      // 如果修复成功且是表结构问题，可以尝试重新执行
      if (repairResult.success && repairResult.action === 'TABLE_CREATED') {
        console.log('>>> 表已创建，重新尝试执行查询...');
        const [results] = await pool.execute(sql, params);
        return results;
      }
      
      if (repairResult.success && repairResult.action === 'COLUMN_ADDED') {
        console.log('>>> 字段已添加，重新尝试执行查询...');
        const [results] = await pool.execute(sql, params);
        return results;
      }
    } catch (repairErr) {
      console.error('自动修复过程失败:', repairErr);
    }
    
    throw err;
  }
}

// 获取单条记录
export async function queryOne(sql: string, params?: any[]) {
  const results: any = await query(sql, params);
  return results[0] || null;
}

// 插入记录并返回ID
export async function insert(sql: string, params?: any[]) {
  const result: any = await query(sql, params);
  return result.insertId;
}

// 更新记录
export async function update(sql: string, params?: any[]) {
  const result: any = await query(sql, params);
  return result.affectedRows;
}

// 删除记录
export async function remove(sql: string, params?: any[]) {
  const result: any = await query(sql, params);
  return result.affectedRows;
}

// 数据库初始化检查
export async function initDatabase() {
  try {
    // 检查连接
    const connected = await testConnection();
    if (!connected) {
      throw new Error('无法连接到数据库');
    }

    // 检查表是否存在
    const tables = ['divination_records', 'trigrams', 'gua_data'];
    for (const table of tables) {
      const result: any = await query(
        `SELECT COUNT(*) as count FROM information_schema.tables
         WHERE table_schema = ? AND table_name = ?`,
        [dbConfig.database, table]
      );

      if (result[0].count === 0) {
        console.warn(`⚠ 警告: 表 ${table} 不存在`);
        console.warn('  请运行数据库初始化脚本:');
        console.warn('  mysql -u root -p123456 < sql/init_database.sql');
      }
    }

    // 检查基础数据是否存在
    await checkBasicData();

    console.log('✓ 数据库初始化检查完成');
  } catch (err) {
    console.error('✗ 数据库初始化失败:', err);
    throw err;
  }
}

// 检查基础数据
async function checkBasicData() {
  try {
    // 检查八卦数据
    const trigramsCount: any = await queryOne('SELECT COUNT(*) as count FROM trigrams');
    if (trigramsCount && trigramsCount.count === 0) {
      console.warn('⚠ 警告: 八卦基础数据为空');
      console.warn('  请运行: mysql -u root -p123456 < sql/insert_data.sql');
    } else if (trigramsCount) {
      console.log(`✓ 八卦基础数据: ${trigramsCount.count} 条`);
    }

    // 检查六十四卦数据
    const guaCount: any = await queryOne('SELECT COUNT(*) as count FROM gua_data');
    if (guaCount && guaCount.count === 0) {
      console.warn('⚠ 警告: 六十四卦数据为空');
      console.warn('  请运行: mysql -u root -p123456 < sql/insert_data.sql');
    } else if (guaCount) {
      console.log(`✓ 六十四卦数据: ${guaCount.count} 条`);
    }

    // 检查卦象记录
    const recordsCount: any = await queryOne('SELECT COUNT(*) as count FROM divination_records');
    if (recordsCount) {
      console.log(`✓ 卦象记录: ${recordsCount.count} 条`);
    }
  } catch (err) {
    console.error('检查基础数据失败:', err);
  }
}

// 数据库操作类
export class DivinationRecordModel {
  // 创建记录
  static async create(record: {
    id: string;
    timestamp: number;
    question: string;
    gender?: string;
    bazi?: string;
    method: string;
    ben_gua: string;
    bian_gua: string | null;
    decoration: string;
    ai_analysis?: string;
    user_id?: string;
  }) {
    const sql = `
      INSERT INTO divination_records
      (id, timestamp, question, gender, bazi, method, ben_gua, bian_gua, decoration, ai_analysis, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      record.id,
      record.timestamp,
      record.question,
      record.gender || null,
      record.bazi || null,
      record.method,
      record.ben_gua,
      record.bian_gua,
      record.decoration,
      record.ai_analysis || null,
      record.user_id || null
    ]);
    return record.id;
  }

  // 获取所有记录（按用户过滤）
  static async findAll(search?: string, limit: number = 100, offset: number = 0, userId?: string) {
    let sql = 'SELECT * FROM divination_records';
    const params: any[] = [];
    const conditions: string[] = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (search) {
      conditions.push('question LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    // 确保LIMIT和OFFSET是数字类型
    params.push(Number(limit), Number(offset));

    return await query(sql, params);
  }

  // 获取记录总数（按用户过滤）
  static async count(search?: string, userId?: string) {
    let sql = 'SELECT COUNT(*) as count FROM divination_records';
    const params: any[] = [];
    const conditions: string[] = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (search) {
      conditions.push('question LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result: any = await queryOne(sql, params);
    return result ? result.count : 0;
  }

  // 根据ID获取记录（支持用户过滤）
  static async findById(id: string, userId?: string) {
    let sql = 'SELECT * FROM divination_records WHERE id = ?';
    const params: any[] = [id];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await queryOne(sql, params);
  }

  // 更新AI解析（按用户）
  static async updateAnalysis(id: string, aiAnalysis: string, userId?: string) {
    let sql = 'UPDATE divination_records SET ai_analysis = ? WHERE id = ?';
    const params: any[] = [aiAnalysis, id];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await update(sql, params);
  }

  // 删除记录（按用户）
  static async deleteById(id: string, userId?: string) {
    let sql = 'DELETE FROM divination_records WHERE id = ?';
    const params: any[] = [id];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await remove(sql, params);
  }

  // ========== 验证反馈相关方法 ==========

  // 更新验证信息
  static async updateVerification(id: string, verificationData: {
    actual_result: string;
    accuracy_rating: number;
    user_notes?: string;
  }, userId?: string) {
    let sql = `
      UPDATE divination_records
      SET is_verified = TRUE,
          actual_result = ?,
          verify_time = ?,
          accuracy_rating = ?,
          user_notes = ?
      WHERE id = ?
    `;
    const params: any[] = [
      verificationData.actual_result,
      Date.now(),
      verificationData.accuracy_rating,
      verificationData.user_notes || null,
      id
    ];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await update(sql, params);
  }

  // 取消验证
  static async cancelVerification(id: string, userId?: string) {
    let sql = `
      UPDATE divination_records
      SET is_verified = FALSE,
          actual_result = NULL,
          verify_time = NULL,
          accuracy_rating = NULL,
          user_notes = NULL
      WHERE id = ?
    `;
    const params: any[] = [id];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await update(sql, params);
  }

  // 获取已验证的记录
  static async findVerified(limit: number = 100, offset: number = 0, userId?: string) {
    let sql = `
      SELECT * FROM divination_records
      WHERE is_verified = TRUE
    `;
    const params: any[] = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY verify_time DESC LIMIT ? OFFSET ?';
    // 确保LIMIT和OFFSET是数字类型
    params.push(Number(limit), Number(offset));

    return await query(sql, params);
  }

  // 获取待验证的记录（已起卦但未验证）
  static async findUnverified(limit: number = 100, offset: number = 0, userId?: string) {
    let sql = `
      SELECT * FROM divination_records
      WHERE is_verified = FALSE
    `;
    const params: any[] = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    // 确保LIMIT和OFFSET是数字类型
    params.push(Number(limit), Number(offset));

    return await query(sql, params);
  }

  // 获取统计信息
  static async getStatistics(userId?: string) {
    const params: any[] = [];
    const condition = userId ? ' WHERE user_id = ?' : '';

    if (userId) {
      params.push(userId);
    }

    // 总记录数
    const totalResult: any = await queryOne(
      `SELECT COUNT(*) as count FROM divination_records${condition}`,
      params
    );
    const total = totalResult ? totalResult.count : 0;

    // 已验证数
    const verifiedResult: any = await queryOne(
      `SELECT COUNT(*) as count FROM divination_records WHERE is_verified = TRUE${userId ? ' AND user_id = ?' : ''}`,
      userId ? [userId] : []
    );
    const verified = verifiedResult ? verifiedResult.count : 0;

    // 平均准确率
    const avgRatingResult: any = await queryOne(
      `SELECT AVG(accuracy_rating) as avg FROM divination_records WHERE is_verified = TRUE${userId ? ' AND user_id = ?' : ''}`,
      userId ? [userId] : []
    );
    const avgRating = avgRatingResult && avgRatingResult.avg ? parseFloat(avgRatingResult.avg) : 0;

    // 按准确度评分统计
    const ratingStatsResult: any = await query(
      `
      SELECT accuracy_rating, COUNT(*) as count
      FROM divination_records
      WHERE is_verified = TRUE AND accuracy_rating IS NOT NULL${userId ? ' AND user_id = ?' : ''}
      GROUP BY accuracy_rating
      ORDER BY accuracy_rating DESC
    `,
      userId ? [userId] : []
    );

    const ratingStats: { [key: number]: number } = {};
    if (ratingStatsResult) {
      for (const row of ratingStatsResult) {
        ratingStats[row.accuracy_rating] = row.count;
      }
    }

    // 按起卦方法统计
    const methodStatsResult: any = await query(
      `
      SELECT method, COUNT(*) as count
      FROM divination_records
      ${userId ? 'WHERE user_id = ?' : ''}
      GROUP BY method
      ORDER BY count DESC
    `,
      userId ? [userId] : []
    );

    const methodStats: { [key: string]: number } = {};
    if (methodStatsResult) {
      for (const row of methodStatsResult) {
        methodStats[row.method] = row.count;
      }
    }

    // 近30天占卜趋势
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const trendParams: any[] = [thirtyDaysAgo];
    if (userId) {
      trendParams.push(userId);
    }

    const trendResult: any = await query(
      `
      SELECT
        DATE(FROM_UNIXTIME(timestamp / 1000)) as date,
        COUNT(*) as count
      FROM divination_records
      WHERE timestamp >= ?${userId ? ' AND user_id = ?' : ''}
      GROUP BY date
      ORDER BY date ASC
    `,
      trendParams
    );

    const trend: Array<{ date: string; count: number }> = [];
    if (trendResult) {
      for (const row of trendResult) {
        trend.push({ date: row.date, count: row.count });
      }
    }

    return {
      total,
      verified,
      unverified: total - verified,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) : '0.00',
      avgRating: avgRating.toFixed(2),
      ratingStats,
      methodStats,
      trend
    };
  }
}

// 八卦数据模型
export class TrigramModel {
  static async findAll() {
    return await query('SELECT * FROM trigrams ORDER BY number');
  }

  static async findByName(name: string) {
    const sql = 'SELECT * FROM trigrams WHERE name = ?';
    return await queryOne(sql, [name]);
  }
}

// 六十四卦数据模型
export class GuaDataModel {
  static async findAll() {
    return await query('SELECT * FROM gua_data ORDER BY number');
  }

  static async findByNumber(number: number) {
    const sql = 'SELECT * FROM gua_data WHERE number = ?';
    return await queryOne(sql, [number]);
  }

  static async findByName(name: string) {
    const sql = 'SELECT * FROM gua_data WHERE name = ?';
    return await queryOne(sql, [name]);
  }

  static async findByTrigrams(upperTrigram: string, lowerTrigram: string) {
    const sql = 'SELECT * FROM gua_data WHERE upper_trigram = ? AND lower_trigram = ?';
    return await queryOne(sql, [upperTrigram, lowerTrigram]);
  }
}

// 优雅关闭连接池
export async function closePool() {
  await pool.end();
  console.log('数据库连接池已关闭');
}

// 默认导出
export default {
  pool,
  query,
  queryOne,
  insert,
  update,
  remove,
  testConnection,
  initDatabase,
  closePool,
  DivinationRecordModel,
  TrigramModel,
  GuaDataModel
};
