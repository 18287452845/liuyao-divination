import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'liuyao_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 2000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const MAX_DB_CONN_RETRIES = parseInt(process.env.DB_CONN_MAX_RETRIES || '10', 10);
const DB_CONN_RETRY_DELAY_MS = parseInt(process.env.DB_CONN_RETRY_DELAY_MS || '2000', 10);

let mysqlPool: mysql.Pool | null = null;

function getPoolInstance(): mysql.Pool {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool(dbConfig);
  }
  return mysqlPool;
}

export function getPool(): mysql.Pool {
  return getPoolInstance();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await getPoolInstance().getConnection();
    console.log('✓ MySQL数据库连接成功');
    console.log(`  数据库: ${dbConfig.database}`);
    console.log(`  主机: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (err) {
    console.error('✗ MySQL数据库连接失败:', err);
    return false;
  }
}

// 数据库查询辅助函数
export async function query(sql: string, params?: any[]) {
  try {
    if (params && params.length > 0 && sql.includes('LIMIT') && sql.includes('OFFSET')) {
      const limitIndex = params.length - 2;
      const offsetIndex = params.length - 1;

      if (limitIndex >= 0 && params[limitIndex] !== null && params[limitIndex] !== undefined) {
        params[limitIndex] = Number(params[limitIndex]);
      }

      if (offsetIndex >= 0 && params[offsetIndex] !== null && params[offsetIndex] !== undefined) {
        params[offsetIndex] = Number(params[offsetIndex]);
      }
    }

    const pool = getPoolInstance();
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (err) {
    console.error('数据库查询错误:', err);
    throw err;
  }
}

// 获取单条记录
export async function queryOne(sql: string, params?: any[]) {
  const results: any = await query(sql, params);
  if (Array.isArray(results)) {
    return results[0] || null;
  }
  return null;
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
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_DB_CONN_RETRIES; attempt++) {
    try {
      const connection = await getPoolInstance().getConnection();
      console.log('✓ MySQL 连接成功');
      console.log(`  数据库: ${dbConfig.database}`);
      console.log(`  主机: ${dbConfig.host}:${dbConfig.port}`);
      connection.release();

      await checkBasicData();
      console.log('✓ 数据库初始化检查完成');
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ 第${attempt}次连接 MySQL 失败: ${message}`);

      if (attempt < MAX_DB_CONN_RETRIES) {
        console.log(`⏳ ${DB_CONN_RETRY_DELAY_MS}ms 后重试...`);
        await delay(DB_CONN_RETRY_DELAY_MS);
      }
    }
  }

  console.error('✗ 无法连接到 MySQL 数据库，请检查容器和环境变量配置。');
  throw lastError;
}

async function checkBasicData() {
  try {
    const trigramsCount = await queryOne('SELECT COUNT(*) as count FROM trigrams');
    console.log(`✓ 八卦数据: ${trigramsCount?.count || 0}`);
  } catch (e) {
    console.error('检查数据失败:', e);
  }
}


// 数据库操作类
export class DivinationRecordModel {
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
    params.push(Number(limit), Number(offset));

    return await query(sql, params);
  }

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

  static async findById(id: string, userId?: string) {
    let sql = 'SELECT * FROM divination_records WHERE id = ?';
    const params: any[] = [id];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await queryOne(sql, params);
  }

  static async updateAnalysis(id: string, aiAnalysis: string, userId?: string) {
    let sql = 'UPDATE divination_records SET ai_analysis = ? WHERE id = ?';
    const params: any[] = [aiAnalysis, id];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await update(sql, params);
  }

  static async deleteById(id: string, userId?: string) {
    let sql = 'DELETE FROM divination_records WHERE id = ?';
    const params: any[] = [id];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    return await remove(sql, params);
  }

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
    params.push(Number(limit), Number(offset));

    return await query(sql, params);
  }

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
    params.push(Number(limit), Number(offset));

    return await query(sql, params);
  }

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

    return {
        total,
        verified,
        avgRating,
        ratingStats,
        methodStats,
        trend: [] // Simplified
    };
  }
}
