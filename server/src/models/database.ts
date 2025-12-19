import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

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
  connectTimeout: 2000,  // 缩短超时时间以便更快切换
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 数据库类型
type DBType = 'mysql' | 'sqlite';
let currentDbType: DBType = 'mysql';

// MySQL Pool
let mysqlPool: mysql.Pool;

// SQLite Database
let sqliteDb: Database;

// SQLite Connection Wrapper for transaction support
class SQLiteConnectionWrapper {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }

  async beginTransaction() {
    await this.db.run('BEGIN TRANSACTION');
  }

  async commit() {
    await this.db.run('COMMIT');
  }

  async rollback() {
    await this.db.run('ROLLBACK');
  }

  async execute(sql: string, params?: any[]) {
     const normalizedSql = normalizeSqlForSQLite(sql);
     
     if (normalizedSql.trim().toUpperCase().startsWith('SELECT')) {
         const rows = await this.db.all(normalizedSql, params);
         return [rows, null];
     } else {
         const result = await this.db.run(normalizedSql, params);
         return [{
             insertId: result.lastID,
             affectedRows: result.changes
         }, null];
     }
  }

  release() {
    // No-op for SQLite
  }
}

// 创建连接池 (Proxy，用于兼容 authController)
class PoolWrapper {
  async getConnection() {
    if (currentDbType === 'mysql') {
      if (!mysqlPool) mysqlPool = mysql.createPool(dbConfig);
      return await mysqlPool.getConnection();
    } else {
      return new SQLiteConnectionWrapper(sqliteDb);
    }
  }

  async execute(sql: string, params?: any[]) {
      return query(sql, params);
  }
}

export const pool = new PoolWrapper() as any; 

function normalizeSqlForSQLite(sql: string): string {
    let newSql = sql;
    // Remove ON DUPLICATE KEY UPDATE clause which is MySQL specific
    if (newSql.match(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i)) {
        newSql = newSql.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE.*/is, '');
    }
    // Replace NOW() with datetime('now', 'localtime')
    // using regex with word boundary to avoid replacing partial words
    newSql = newSql.replace(/\bNOW\(\)/gi, "datetime('now', 'localtime')");
    
    return newSql;
}

// 测试数据库连接
export async function testConnection() {
  try {
    if (currentDbType === 'mysql') {
        mysqlPool = mysql.createPool(dbConfig);
        const connection = await mysqlPool.getConnection();
        console.log('✓ MySQL数据库连接成功');
        console.log(`  数据库: ${dbConfig.database}`);
        console.log(`  主机: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        return true;
    } else {
        return !!sqliteDb;
    }
  } catch (err) {
    console.error(`✗ ${currentDbType}数据库连接失败:`, err);
    return false;
  }
}

// 数据库查询辅助函数
export async function query(sql: string, params?: any[]) {
  try {
    // 自动修复LIMIT/OFFSET参数类型问题
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

    if (currentDbType === 'mysql') {
        if (!mysqlPool) mysqlPool = mysql.createPool(dbConfig);
        const [results] = await mysqlPool.execute(sql, params);
        return results;
    } else {
        // Convert Date objects to SQLite compatible format (YYYY-MM-DD HH:MM:SS)
        if (params) {
            params = params.map(p => {
                if (p instanceof Date) {
                   return p.toISOString().replace('T', ' ').substring(0, 19);
                }
                return p;
            });
        }

        const normalizedSql = normalizeSqlForSQLite(sql);
        if (normalizedSql.trim().toUpperCase().startsWith('SELECT') || normalizedSql.trim().toUpperCase().startsWith('SHOW')) {
             if (normalizedSql.includes('SHOW OPEN TABLES')) return []; 
             if (normalizedSql.includes('information_schema.tables')) {
                 // Mock check for tables
                 // Extract table name
                 const match = params ? params[0] : null; // Assuming simple query
                 if (match) {
                     const exists = await sqliteDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [match]);
                     return [{ count: exists ? 1 : 0 }];
                 }
                 return [{ count: 1 }]; // Fallback
             }
             
             return await sqliteDb.all(normalizedSql, params);
        } else {
            const result = await sqliteDb.run(normalizedSql, params);
             return {
                 affectedRows: result.changes,
                 insertId: result.lastID,
                 warningStatus: 0,
                 // For compatibility
                 length: 0,
                 [Symbol.iterator]: function* () {} 
             };
        }
    }
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
  try {
    // 尝试连接 MySQL
    console.log('尝试连接 MySQL...');
    try {
        mysqlPool = mysql.createPool(dbConfig);
        await mysqlPool.getConnection();
        console.log('✓ MySQL 连接成功');
        currentDbType = 'mysql';
    } catch (mysqlErr) {
        console.warn('⚠ MySQL 连接失败，尝试切换到 SQLite...');
        currentDbType = 'sqlite';
        
        // 初始化 SQLite
        const dbPath = path.join(__dirname, '../../liuyao.sqlite');
        console.log(`正在打开 SQLite 数据库: ${dbPath}`);
        
        sqliteDb = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        console.log('✓ SQLite 数据库已打开');
        
        // 检查并初始化表
        await initSqliteTables();
    }

    await checkBasicData();
    console.log('✓ 数据库初始化检查完成');
  } catch (err) {
    console.error('✗ 数据库初始化失败:', err);
    throw err;
  }
}

async function initSqliteTables() {
    const tableExists = await sqliteDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    
    if (!tableExists) {
        console.log('正在初始化 SQLite 表结构和数据...');
        
        await sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT,
                real_name TEXT,
                avatar TEXT,
                status INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                login_fail_count INTEGER DEFAULT 0,
                locked_until DATETIME,
                last_login_at DATETIME,
                last_login_ip TEXT,
                last_password_change DATETIME
            );
            
            CREATE TABLE IF NOT EXISTS roles (
                id TEXT PRIMARY KEY,
                role_name TEXT NOT NULL,
                role_code TEXT NOT NULL,
                description TEXT,
                status INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS permissions (
                id TEXT PRIMARY KEY,
                permission_name TEXT,
                permission_code TEXT,
                description TEXT,
                module TEXT,
                status INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS user_roles (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                role_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
             CREATE TABLE IF NOT EXISTS role_permissions (
                id TEXT PRIMARY KEY,
                role_id TEXT NOT NULL,
                permission_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS divination_records (
                id TEXT PRIMARY KEY,
                timestamp INTEGER NOT NULL,
                question TEXT,
                gender TEXT,
                bazi TEXT,
                method TEXT,
                ben_gua TEXT,
                bian_gua TEXT,
                decoration TEXT,
                ai_analysis TEXT,
                user_id TEXT,
                is_verified INTEGER DEFAULT 0,
                actual_result TEXT,
                verify_time INTEGER,
                accuracy_rating INTEGER,
                user_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                session_token TEXT,
                device_info TEXT,
                ip_address TEXT,
                user_agent TEXT,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS invite_codes (
                 id TEXT PRIMARY KEY,
                 code TEXT UNIQUE,
                 used_count INTEGER DEFAULT 0,
                 max_uses INTEGER DEFAULT 1,
                 status INTEGER DEFAULT 1,
                 expires_at DATETIME,
                 created_by TEXT,
                 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                username TEXT,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                status TEXT DEFAULT 'success',
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS token_blacklist (
                id TEXT PRIMARY KEY,
                token TEXT UNIQUE NOT NULL,
                user_id TEXT,
                reason TEXT,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS trigrams (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              symbol TEXT NOT NULL,
              nature TEXT NOT NULL,
              element TEXT NOT NULL,
              number INTEGER NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS gua_data (
              number INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              upper_trigram TEXT NOT NULL,
              lower_trigram TEXT NOT NULL,
              gua_ci TEXT,
              yao_ci TEXT
            );
        `);
        
        // 插入角色
        await sqliteDb.run("INSERT INTO roles (id, role_name, role_code, status) VALUES ('role-admin-001', '管理员', 'admin', 1)");
        await sqliteDb.run("INSERT INTO roles (id, role_name, role_code, status) VALUES ('role-user-001', '普通用户', 'user', 1)");
        
        // 插入默认管理员 (password: admin123)
        await sqliteDb.run(`
            INSERT INTO users (id, username, password, status, email) 
            VALUES ('user-admin-001', 'admin', '$2a$10$V22LB4ExPdxHWa.8SVSwBuJUwC0iEjSYRxsWC076yHUY9cgVrQDXS', 1, 'admin@liuyao.com')
        `);
        
        await sqliteDb.run("INSERT INTO user_roles (id, user_id, role_id) VALUES ('ur-admin-001', 'user-admin-001', 'role-admin-001')");
        
        // 插入测试用户 (password: test123)
        await sqliteDb.run(`
             INSERT INTO users (id, username, password, status, email)
             VALUES ('user-test-001', 'testuser', '$2a$10$vhfaBKD2zUtCqaGbRnMYT.xPTpVYiXxD.CkURjPO87WVi9bJFF1Fa', 1, 'test@liuyao.com')
        `);
         await sqliteDb.run("INSERT INTO user_roles (id, user_id, role_id) VALUES ('ur-test-001', 'user-test-001', 'role-user-001')");

         // 插入邀请码 (for registration)
         await sqliteDb.run("INSERT INTO invite_codes (id, code, max_uses, status) VALUES ('inv-001', 'LIUYAO888', 9999, 1)");

        console.log('✓ SQLite 表结构和基础数据初始化完成');
        await loadGuaData();
    }
}

async function loadGuaData() {
    await sqliteDb.run(`
        INSERT INTO trigrams (name, symbol, nature, element, number) VALUES
        ('乾', '☰', '天', '金', 1),
        ('坤', '☷', '地', '土', 2),
        ('震', '☳', '雷', '木', 3),
        ('巽', '☴', '风', '木', 4),
        ('坎', '☵', '水', '水', 5),
        ('离', '☲', '火', '火', 6),
        ('艮', '☶', '山', '土', 7),
        ('兑', '☱', '泽', '金', 8)
    `);
    
    try {
        const sqlContent = fs.readFileSync(path.join(__dirname, '../../sql/insert_64_gua_complete.sql'), 'utf8');
        
        // Remove comments
        const cleanContent = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join(' '); // Join with space to avoid breaking SQL
            
        const statements = cleanContent.split(';');
        
        for (const stmt of statements) {
            const cleanStmt = stmt.trim();
            if (cleanStmt.toUpperCase().startsWith('INSERT INTO GUA_DATA')) {
                await sqliteDb.run(cleanStmt);
            }
        }
        console.log('✓ 64卦数据加载完成');
    } catch (e) {
        console.error('加载64卦数据失败:', e);
    }
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
