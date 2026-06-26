import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: false });

type QueryParams = any[];

interface DbResult {
  affectedRows: number;
  rowCount: number;
  insertId?: number | string | null;
  rows?: any[];
}

function getConnectionString(): string {
  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      'Missing Supabase Postgres connection string. Set SUPABASE_DB_URL or DATABASE_URL.'
    );
  }

  return connectionString;
}

function shouldUseSsl(connectionString: string): boolean {
  if (process.env.SUPABASE_DB_SSL) {
    return process.env.SUPABASE_DB_SSL !== 'false';
  }

  return connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com');
}

const connectionString = getConnectionString();

const pgPool = new Pool({
  connectionString,
  max: Number(process.env.SUPABASE_DB_POOL_SIZE || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 60_000,
  ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
});

function convertPlaceholders(sql: string): string {
  let index = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inDollarQuote: string | null = null;
  let result = '';

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (!inSingleQuote && !inDoubleQuote && char === '$') {
      const rest = sql.slice(i);
      const match = rest.match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        const tag = match[0];
        if (inDollarQuote === tag) {
          inDollarQuote = null;
        } else if (!inDollarQuote) {
          inDollarQuote = tag;
        }
        result += tag;
        i += tag.length - 1;
        continue;
      }
    }

    if (!inDollarQuote && !inDoubleQuote && char === "'" && next === "'") {
      result += "''";
      i += 1;
      continue;
    }

    if (!inDollarQuote && !inDoubleQuote && char === "'") {
      inSingleQuote = !inSingleQuote;
      result += char;
      continue;
    }

    if (!inDollarQuote && !inSingleQuote && char === '"') {
      inDoubleQuote = !inDoubleQuote;
      result += char;
      continue;
    }

    if (!inDollarQuote && !inSingleQuote && !inDoubleQuote && char === '?') {
      index += 1;
      result += `$${index}`;
      continue;
    }

    result += char;
  }

  return result;
}

function legacySqlCompat(sql: string): string {
  let converted = sql;

  converted = converted.replace(
    /DATE_SUB\(NOW\(\),\s*INTERVAL\s*\?\s*DAY\)/gi,
    "(NOW() - (? * INTERVAL '1 day'))"
  );

  converted = converted.replace(
    /DATE_SUB\(NOW\(\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi,
    "(NOW() - ($1 * INTERVAL '1 day'))"
  );

  converted = converted.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');

  converted = converted.replace(
    /GROUP_CONCAT\(DISTINCT\s+([^)]+?)\)\s+as\s+([A-Za-z_][A-Za-z0-9_]*)/gi,
    "string_agg(DISTINCT ($1)::text, ',') as $2"
  );

  converted = converted.replace(
    /DATE\(FROM_UNIXTIME\(([^)]+)\)\)/gi,
    "to_char(to_timestamp($1), 'YYYY-MM-DD')"
  );

  return convertPlaceholders(converted);
}

function isReadQuery(sql: string): boolean {
  const normalized = sql.trim().toLowerCase();
  return (
    normalized.startsWith('select') ||
    normalized.startsWith('with') ||
    normalized.startsWith('show')
  );
}

function toMysqlLikeResult(result: QueryResult): DbResult {
  return {
    affectedRows: result.rowCount || 0,
    rowCount: result.rowCount || 0,
    insertId: result.rows?.[0]?.id ?? null,
    rows: result.rows,
  };
}

async function executePg(client: Pool | PoolClient, sql: string, params: QueryParams = []) {
  const convertedSql = legacySqlCompat(sql);
  const result = await client.query(convertedSql, params);
  return isReadQuery(sql) ? result.rows : toMysqlLikeResult(result);
}

class TransactionConnection {
  constructor(private readonly client: PoolClient) {}

  async beginTransaction() {
    await this.client.query('BEGIN');
  }

  async commit() {
    await this.client.query('COMMIT');
  }

  async rollback() {
    await this.client.query('ROLLBACK');
  }

  async execute(sql: string, params?: QueryParams) {
    const result = await executePg(this.client, sql, params);
    return [result, undefined];
  }

  release() {
    this.client.release();
  }
}

export const pool = {
  async execute(sql: string, params?: QueryParams) {
    const result = await executePg(pgPool, sql, params);
    return [result, undefined];
  },

  async getConnection() {
    const client = await pgPool.connect();
    return new TransactionConnection(client);
  },

  async end() {
    await pgPool.end();
  },
};

export async function testConnection() {
  try {
    const result = await pgPool.query('select current_database() as database, now() as now');
    console.log('Supabase Postgres connected');
    console.log(`  database: ${result.rows[0]?.database}`);
    return true;
  } catch (err) {
    console.error('Supabase Postgres connection failed:', err);
    console.error('  Check SUPABASE_DB_URL / DATABASE_URL and network access.');
    return false;
  }
}

export async function query(sql: string, params?: QueryParams) {
  try {
    return await executePg(pgPool, sql, params);
  } catch (err) {
    console.error('Database query failed:', err);
    throw err;
  }
}

export async function queryOne(sql: string, params?: QueryParams) {
  const results: any = await query(sql, params);
  return Array.isArray(results) ? results[0] || null : null;
}

export async function insert(sql: string, params?: QueryParams) {
  const result: any = await query(sql, params);
  return result.insertId || result.rows?.[0]?.id || null;
}

export async function update(sql: string, params?: QueryParams) {
  const result: any = await query(sql, params);
  return result.affectedRows || result.rowCount || 0;
}

export async function remove(sql: string, params?: QueryParams) {
  const result: any = await query(sql, params);
  return result.affectedRows || result.rowCount || 0;
}

export async function initDatabase() {
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Unable to connect to Supabase Postgres');
  }

  const tables = ['divination_records', 'trigrams', 'gua_data'];
  for (const table of tables) {
    const result: any = await query(
      `SELECT COUNT(*)::int as count
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ?`,
      [table]
    );

    if (result[0]?.count === 0) {
      console.warn(`Warning: table ${table} does not exist.`);
      console.warn('  Run server/supabase/migrations/0001_init_schema.sql in Supabase SQL Editor.');
    }
  }

  await checkBasicData();
  console.log('Database initialization check completed');
}

async function checkBasicData() {
  try {
    const trigramsCount: any = await queryOne('SELECT COUNT(*)::int as count FROM trigrams');
    if (trigramsCount) {
      console.log(`  trigrams: ${trigramsCount.count}`);
    }

    const guaCount: any = await queryOne('SELECT COUNT(*)::int as count FROM gua_data');
    if (guaCount) {
      console.log(`  gua_data: ${guaCount.count}`);
    }

    const recordsCount: any = await queryOne('SELECT COUNT(*)::int as count FROM divination_records');
    if (recordsCount) {
      console.log(`  divination_records: ${recordsCount.count}`);
    }
  } catch (err) {
    console.error('Basic data check failed:', err);
  }
}

export class DivinationRecordModel {
  private static appendUserScope(conditions: string[], params: any[], userId?: string) {
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
  }

  private static buildWhereClause(conditions: string[]) {
    return conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  }

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
      record.user_id || null,
    ]);
    return record.id;
  }

  static async findAll(search?: string, limit: number = 100, offset: number = 0, userId?: string) {
    let sql = 'SELECT * FROM divination_records';
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('question LIKE ?');
      params.push(`%${search}%`);
    }

    this.appendUserScope(conditions, params, userId);
    sql += this.buildWhereClause(conditions);
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await query(sql, params);
  }

  static async count(search?: string, userId?: string) {
    let sql = 'SELECT COUNT(*)::int as count FROM divination_records';
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('question LIKE ?');
      params.push(`%${search}%`);
    }

    this.appendUserScope(conditions, params, userId);
    sql += this.buildWhereClause(conditions);

    const result: any = await queryOne(sql, params);
    return result ? result.count : 0;
  }

  static async findById(id: string, userId?: string) {
    const conditions = ['id = ?'];
    const params: any[] = [id];
    this.appendUserScope(conditions, params, userId);
    const sql = `SELECT * FROM divination_records${this.buildWhereClause(conditions)}`;
    return await queryOne(sql, params);
  }

  static async updateAnalysis(id: string, aiAnalysis: string, userId?: string) {
    const conditions = ['id = ?'];
    const params: any[] = [aiAnalysis, id];
    this.appendUserScope(conditions, params, userId);
    const sql = `UPDATE divination_records SET ai_analysis = ?${this.buildWhereClause(conditions)}`;
    return await update(sql, params);
  }

  static async deleteById(id: string, userId?: string) {
    const conditions = ['id = ?'];
    const params: any[] = [id];
    this.appendUserScope(conditions, params, userId);
    const sql = `DELETE FROM divination_records${this.buildWhereClause(conditions)}`;
    return await remove(sql, params);
  }

  static async updateVerification(id: string, verificationData: {
    actual_result: string;
    accuracy_rating: number;
    user_notes?: string;
  }, userId?: string) {
    const conditions = ['id = ?'];
    const params: any[] = [
      verificationData.actual_result,
      Date.now(),
      verificationData.accuracy_rating,
      verificationData.user_notes || null,
      id,
    ];
    this.appendUserScope(conditions, params, userId);

    const sql = `
      UPDATE divination_records
      SET is_verified = TRUE,
          actual_result = ?,
          verify_time = ?,
          accuracy_rating = ?,
          user_notes = ?
      ${this.buildWhereClause(conditions)}
    `;
    return await update(sql, params);
  }

  static async cancelVerification(id: string, userId?: string) {
    const conditions = ['id = ?'];
    const params: any[] = [id];
    this.appendUserScope(conditions, params, userId);

    const sql = `
      UPDATE divination_records
      SET is_verified = FALSE,
          actual_result = NULL,
          verify_time = NULL,
          accuracy_rating = NULL,
          user_notes = NULL
      ${this.buildWhereClause(conditions)}
    `;
    return await update(sql, params);
  }

  static async findVerified(limit: number = 100, offset: number = 0, userId?: string) {
    const conditions = ['is_verified = TRUE'];
    const params: any[] = [];
    this.appendUserScope(conditions, params, userId);

    const sql = `
      SELECT * FROM divination_records
      ${this.buildWhereClause(conditions)}
      ORDER BY verify_time DESC
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [...params, limit, offset]);
  }

  static async findUnverified(limit: number = 100, offset: number = 0, userId?: string) {
    const conditions = ['is_verified = FALSE'];
    const params: any[] = [];
    this.appendUserScope(conditions, params, userId);

    const sql = `
      SELECT * FROM divination_records
      ${this.buildWhereClause(conditions)}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [...params, limit, offset]);
  }

  static async getStatistics(userId?: string) {
    const userCondition = userId ? ' WHERE user_id = ?' : '';
    const andUserCondition = userId ? ' AND user_id = ?' : '';
    const userParams = userId ? [userId] : [];

    const totalResult: any = await queryOne(
      `SELECT COUNT(*)::int as count FROM divination_records${userCondition}`,
      userParams
    );
    const total = totalResult ? totalResult.count : 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const todayResult: any = await queryOne(
      `SELECT COUNT(*)::int as count FROM divination_records WHERE timestamp >= ? AND timestamp < ?${andUserCondition}`,
      [startOfToday.getTime(), startOfTomorrow.getTime(), ...userParams]
    );
    const todayTotal = todayResult ? todayResult.count : 0;

    const verifiedResult: any = await queryOne(
      `SELECT COUNT(*)::int as count FROM divination_records WHERE is_verified = TRUE${andUserCondition}`,
      userParams
    );
    const verified = verifiedResult ? verifiedResult.count : 0;

    const avgRatingResult: any = await queryOne(
      `SELECT AVG(accuracy_rating) as avg FROM divination_records WHERE is_verified = TRUE${andUserCondition}`,
      userParams
    );
    const avgRating = avgRatingResult && avgRatingResult.avg ? parseFloat(avgRatingResult.avg) : 0;

    const ratingStatsResult: any = await query(`
      SELECT accuracy_rating, COUNT(*)::int as count
      FROM divination_records
      WHERE is_verified = TRUE AND accuracy_rating IS NOT NULL${andUserCondition}
      GROUP BY accuracy_rating
      ORDER BY accuracy_rating DESC
    `, userParams);

    const ratingStats: { [key: number]: number } = {};
    if (ratingStatsResult) {
      for (const row of ratingStatsResult) {
        ratingStats[row.accuracy_rating] = row.count;
      }
    }

    const methodStatsResult: any = await query(`
      SELECT method, COUNT(*)::int as count
      FROM divination_records
      ${userCondition}
      GROUP BY method
      ORDER BY count DESC
    `, userParams);

    const methodStats: { [key: string]: number } = {};
    if (methodStatsResult) {
      for (const row of methodStatsResult) {
        methodStats[row.method] = row.count;
      }
    }

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const trendResult: any = await query(`
      SELECT
        to_char(to_timestamp(timestamp / 1000), 'YYYY-MM-DD') as date,
        COUNT(*)::int as count
      FROM divination_records
      WHERE timestamp >= ?${andUserCondition}
      GROUP BY date
      ORDER BY date ASC
    `, [thirtyDaysAgo, ...userParams]);

    const trend: Array<{ date: string; count: number }> = [];
    if (trendResult) {
      for (const row of trendResult) {
        trend.push({ date: row.date, count: row.count });
      }
    }

    return {
      total,
      todayTotal,
      verified,
      unverified: total - verified,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) : '0.00',
      avgRating: avgRating.toFixed(2),
      ratingStats,
      methodStats,
      trend,
    };
  }
}

export class TrigramModel {
  static async findAll() {
    return await query('SELECT * FROM trigrams ORDER BY number');
  }

  static async findByName(name: string) {
    return await queryOne('SELECT * FROM trigrams WHERE name = ?', [name]);
  }
}

export class GuaDataModel {
  static async findAll() {
    return await query('SELECT * FROM gua_data ORDER BY number');
  }

  static async findByNumber(number: number) {
    return await queryOne('SELECT * FROM gua_data WHERE number = ?', [number]);
  }

  static async findByName(name: string) {
    return await queryOne('SELECT * FROM gua_data WHERE name = ?', [name]);
  }

  static async findByTrigrams(upperTrigram: string, lowerTrigram: string) {
    return await queryOne(
      'SELECT * FROM gua_data WHERE upper_trigram = ? AND lower_trigram = ?',
      [upperTrigram, lowerTrigram]
    );
  }
}

export async function closePool() {
  await pgPool.end();
  console.log('Database pool closed');
}

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
  GuaDataModel,
};
