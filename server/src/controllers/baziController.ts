/**
 * 八字批命控制器
 * 处理八字创建、查询、更新、删除等业务逻辑
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, insert, update, remove } from '../models/database';
import {
  calculateBaziFromDateTime,
  calculateDaYun,
  decorateBazi
} from '../utils/bazi';
import {
  BaziRecord,
  CreateBaziRequest,
  UpdateAiAnalysisRequest,
  UpdateVerificationRequest,
  Gender
} from '../types/bazi';

/**
 * 创建八字记录
 * POST /api/bazi
 */
export async function createBazi(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      gender,
      birthDatetime,
      birthLocation,
      useTrueSolarTime = false
    }: CreateBaziRequest = req.body;

    const userId = (req as any).user?.userId;

    // 1. 验证输入
    if (!gender || !birthDatetime) {
      res.status(400).json({
        success: false,
        message: '性别和出生时间不能为空'
      });
      return;
    }

    if (!['男', '女'].includes(gender)) {
      res.status(400).json({
        success: false,
        message: '性别必须为"男"或"女"'
      });
      return;
    }

    // 转换birthDatetime为时间戳（如果是字符串）
    let timestamp: number;
    if (typeof birthDatetime === 'string') {
      timestamp = new Date(birthDatetime).getTime();
      if (isNaN(timestamp)) {
        res.status(400).json({
          success: false,
          message: '出生时间格式不正确'
        });
        return;
      }
    } else {
      timestamp = birthDatetime;
    }

    // 2. 计算八字
    const bazi = await calculateBaziFromDateTime(
      timestamp,
      gender as Gender,
      useTrueSolarTime,
      birthLocation
    );

    // 3. 装饰八字（添加十神、五行、关系分析）
    const decorated = decorateBazi(bazi);

    // 4. 计算大运
    const dayun = calculateDaYun(
      bazi.month.gan,
      bazi.month.zhi,
      bazi.year.gan,
      gender as Gender,
      timestamp,
      bazi.riGan
    );

    // 5. 组装数据库记录
    const recordId = uuidv4();
    const recordTimestamp = Date.now();

    // 创建可序列化的版本（移除循环引用）
    const serializableDecorated = {
      bazi: {
        year: {
          gan: decorated.bazi.year.gan,
          zhi: decorated.bazi.year.zhi,
          ganZhi: decorated.bazi.year.ganZhi,
          ganWuXing: decorated.bazi.year.ganWuXing,
          zhiWuXing: decorated.bazi.year.zhiWuXing,
          naYin: decorated.bazi.year.naYin
        },
        month: {
          gan: decorated.bazi.month.gan,
          zhi: decorated.bazi.month.zhi,
          ganZhi: decorated.bazi.month.ganZhi,
          ganWuXing: decorated.bazi.month.ganWuXing,
          zhiWuXing: decorated.bazi.month.zhiWuXing,
          naYin: decorated.bazi.month.naYin
        },
        day: {
          gan: decorated.bazi.day.gan,
          zhi: decorated.bazi.day.zhi,
          ganZhi: decorated.bazi.day.ganZhi,
          ganWuXing: decorated.bazi.day.ganWuXing,
          zhiWuXing: decorated.bazi.day.zhiWuXing,
          naYin: decorated.bazi.day.naYin
        },
        hour: {
          gan: decorated.bazi.hour.gan,
          zhi: decorated.bazi.hour.zhi,
          ganZhi: decorated.bazi.hour.ganZhi,
          ganWuXing: decorated.bazi.hour.ganWuXing,
          zhiWuXing: decorated.bazi.hour.zhiWuXing,
          naYin: decorated.bazi.hour.naYin
        },
        riGan: decorated.bazi.riGan
      },
      shiShen: decorated.shiShen,
      wuXing: decorated.wuXing,
      relations: decorated.relations,
      shenSha: decorated.shenSha,
      kongWang: decorated.kongWang
    };

    const sql = `
      INSERT INTO bazi_records (
        id, user_id, timestamp,
        name, gender, birth_datetime, birth_location, use_true_solar_time,
        year_pillar, month_pillar, day_pillar, hour_pillar,
        bazi_data, dayun_data, qiyun_age, shun_pai,
        is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      recordId,
      userId,
      recordTimestamp,
      name || null,
      gender,
      timestamp,
      birthLocation || null,
      useTrueSolarTime,
      bazi.year.ganZhi,
      bazi.month.ganZhi,
      bazi.day.ganZhi,
      bazi.hour.ganZhi,
      JSON.stringify(serializableDecorated),
      JSON.stringify(dayun.steps),
      dayun.qiyunAge,
      dayun.shunPai,
      false
    ]);

    // 6. 返回结果
    res.status(201).json({
      success: true,
      data: {
        id: recordId,
        bazi: {
          year: decorated.bazi.year,
          month: decorated.bazi.month,
          day: decorated.bazi.day,
          hour: decorated.bazi.hour,
          riGan: decorated.bazi.riGan
        },
        shiShen: decorated.shiShen,
        wuXing: decorated.wuXing,
        relations: decorated.relations,
        shenSha: decorated.shenSha,
        kongWang: decorated.kongWang,
        dayun: dayun.steps,
        qiyunAge: dayun.qiyunAge
      }
    });

  } catch (error) {
    console.error('创建八字失败:', error);
    res.status(500).json({
      success: false,
      message: '创建八字失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 获取八字记录列表
 * GET /api/bazi/records?search=xxx&limit=20&offset=0
 */
export async function getRecords(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const { search = '', limit = 20, offset = 0 } = req.query;

    // 构建查询
    let sql = `
      SELECT
        id, user_id, timestamp,
        name, gender, birth_datetime, birth_location, use_true_solar_time,
        year_pillar, month_pillar, day_pillar, hour_pillar,
        bazi_data, dayun_data, qiyun_age, shun_pai,
        ai_analysis, ai_model, ai_analyzed_at,
        is_verified, actual_feedback, accuracy_rating,
        created_at
      FROM bazi_records
      WHERE user_id = ?
    `;

    const params: any[] = [userId];

    // 添加搜索条件
    if (search) {
      sql += ` AND (name LIKE ? OR year_pillar LIKE ? OR day_pillar LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // 排序和分页
    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    sql += ` ORDER BY timestamp DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const records: any = await query(sql, params);

    // 解析JSON字段并转换为camelCase
    const parsedRecords = records.map((record: any) => ({
      id: record.id,
      userId: record.user_id,
      timestamp: record.timestamp,
      name: record.name,
      gender: record.gender,
      birthDatetime: record.birth_datetime,
      birthLocation: record.birth_location,
      useTrueSolarTime: Boolean(record.use_true_solar_time),
      yearPillar: record.year_pillar,
      monthPillar: record.month_pillar,
      dayPillar: record.day_pillar,
      hourPillar: record.hour_pillar,
      baziData: JSON.parse(record.bazi_data),
      dayunData: {
        steps: record.dayun_data ? JSON.parse(record.dayun_data) : [],
        qiyunAge: record.qiyun_age,
        shunPai: Boolean(record.shun_pai)
      },
      qiyunAge: record.qiyun_age,
      aiAnalysis: record.ai_analysis,
      aiModel: record.ai_model,
      aiAnalyzedAt: record.ai_analyzed_at,
      isVerified: Boolean(record.is_verified),
      actualFeedback: record.actual_feedback,
      accuracyRating: record.accuracy_rating,
      createdAt: record.created_at
    }));

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM bazi_records WHERE user_id = ?`;
    const countParams: any[] = [userId];

    if (search) {
      countSql += ` AND (name LIKE ? OR year_pillar LIKE ? OR day_pillar LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const countResult: any = await queryOne(countSql, countParams);
    const total = countResult?.total || 0;

    res.json({
      success: true,
      data: {
        records: parsedRecords,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error) {
    console.error('查询八字记录失败:', error);
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 获取单条八字记录
 * GET /api/bazi/records/:id
 */
export async function getRecordById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const sql = `
      SELECT * FROM bazi_records
      WHERE id = ? AND user_id = ?
    `;

    const record: any = await queryOne(sql, [id, userId]);

    if (!record) {
      res.status(404).json({
        success: false,
        message: '记录不存在'
      });
      return;
    }

    // 解析JSON字段并转换为camelCase
    const parsedRecord = {
      id: record.id,
      userId: record.user_id,
      timestamp: record.timestamp,
      name: record.name,
      gender: record.gender,
      birthDatetime: record.birth_datetime,
      birthLocation: record.birth_location,
      useTrueSolarTime: Boolean(record.use_true_solar_time),
      yearPillar: record.year_pillar,
      monthPillar: record.month_pillar,
      dayPillar: record.day_pillar,
      hourPillar: record.hour_pillar,
      baziData: JSON.parse(record.bazi_data),
      dayunData: {
        steps: record.dayun_data ? JSON.parse(record.dayun_data) : [],
        qiyunAge: record.qiyun_age,
        shunPai: Boolean(record.shun_pai)
      },
      qiyunAge: record.qiyun_age,
      aiAnalysis: record.ai_analysis,
      aiModel: record.ai_model,
      aiAnalyzedAt: record.ai_analyzed_at,
      isVerified: Boolean(record.is_verified),
      actualFeedback: record.actual_feedback,
      accuracyRating: record.accuracy_rating
    };

    res.json({
      success: true,
      data: parsedRecord
    });

  } catch (error) {
    console.error('查询八字记录失败:', error);
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 删除八字记录
 * DELETE /api/bazi/records/:id
 */
export async function deleteRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    // 检查记录是否存在且属于当前用户
    const checkSql = `SELECT id FROM bazi_records WHERE id = ? AND user_id = ?`;
    const existing: any = await queryOne(checkSql, [id, userId]);

    if (!existing) {
      res.status(404).json({
        success: false,
        message: '记录不存在或无权删除'
      });
      return;
    }

    // 删除记录
    const deleteSql = `DELETE FROM bazi_records WHERE id = ? AND user_id = ?`;
    const affectedRows = await remove(deleteSql, [id, userId]);

    res.json({
      success: true,
      message: '删除成功',
      data: { affectedRows }
    });

  } catch (error) {
    console.error('删除八字记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 更新AI分析结果
 * PUT /api/bazi/records/:id/analysis
 */
export async function updateAiAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { aiAnalysis, aiModel }: UpdateAiAnalysisRequest = req.body;
    const userId = (req as any).user?.userId;

    if (!aiAnalysis) {
      res.status(400).json({
        success: false,
        message: 'AI分析内容不能为空'
      });
      return;
    }

    // 检查记录是否存在且属于当前用户
    const checkSql = `SELECT id FROM bazi_records WHERE id = ? AND user_id = ?`;
    const existing: any = await queryOne(checkSql, [id, userId]);

    if (!existing) {
      res.status(404).json({
        success: false,
        message: '记录不存在或无权修改'
      });
      return;
    }

    // 更新AI分析
    const updateSql = `
      UPDATE bazi_records
      SET ai_analysis = ?, ai_model = ?, ai_analyzed_at = ?
      WHERE id = ? AND user_id = ?
    `;

    const affectedRows = await update(updateSql, [
      aiAnalysis,
      aiModel || 'deepseek-chat',
      Date.now(),
      id,
      userId
    ]);

    res.json({
      success: true,
      message: '更新成功',
      data: { affectedRows }
    });

  } catch (error) {
    console.error('更新AI分析失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 更新验证反馈
 * PUT /api/bazi/records/:id/verification
 */
export async function updateVerification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      actualFeedback,
      accuracyRating,
      userNotes
    }: UpdateVerificationRequest = req.body;
    const userId = (req as any).user?.userId;

    if (!actualFeedback || !accuracyRating) {
      res.status(400).json({
        success: false,
        message: '反馈内容和评分不能为空'
      });
      return;
    }

    if (accuracyRating < 1 || accuracyRating > 5) {
      res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
      return;
    }

    // 检查记录是否存在且属于当前用户
    const checkSql = `SELECT id FROM bazi_records WHERE id = ? AND user_id = ?`;
    const existing: any = await queryOne(checkSql, [id, userId]);

    if (!existing) {
      res.status(404).json({
        success: false,
        message: '记录不存在或无权修改'
      });
      return;
    }

    // 更新验证信息
    const updateSql = `
      UPDATE bazi_records
      SET is_verified = ?, actual_feedback = ?, verify_time = ?,
          accuracy_rating = ?, user_notes = ?
      WHERE id = ? AND user_id = ?
    `;

    const affectedRows = await update(updateSql, [
      true,
      actualFeedback,
      Date.now(),
      accuracyRating,
      userNotes || null,
      id,
      userId
    ]);

    res.json({
      success: true,
      message: '验证信息更新成功',
      data: { affectedRows }
    });

  } catch (error) {
    console.error('更新验证信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 工具：仅计算四柱八字（不保存）
 * POST /api/bazi/tools/calculate-pillars
 */
export async function calculatePillars(req: Request, res: Response): Promise<void> {
  try {
    const {
      birthDatetime,
      gender,
      useTrueSolarTime = false,
      birthLocation
    } = req.body;

    // 验证输入
    if (!gender || !birthDatetime) {
      res.status(400).json({
        success: false,
        message: '性别和出生时间不能为空'
      });
      return;
    }

    // 计算八字
    const bazi = await calculateBaziFromDateTime(
      birthDatetime,
      gender as Gender,
      useTrueSolarTime,
      birthLocation
    );

    // 装饰八字
    const decorated = decorateBazi(bazi);

    // 计算大运
    const dayun = calculateDaYun(
      bazi.month.gan,
      bazi.month.zhi,
      bazi.year.gan,
      gender as Gender,
      birthDatetime,
      bazi.riGan
    );

    res.json({
      success: true,
      data: {
        bazi: {
          year: decorated.bazi.year,
          month: decorated.bazi.month,
          day: decorated.bazi.day,
          hour: decorated.bazi.hour,
          riGan: decorated.bazi.riGan
        },
        shiShen: decorated.shiShen,
        wuXing: decorated.wuXing,
        relations: decorated.relations,
        shenSha: decorated.shenSha,
        kongWang: decorated.kongWang,
        dayun: dayun.steps,
        qiyunAge: dayun.qiyunAge
      }
    });

  } catch (error) {
    console.error('计算八字失败:', error);
    res.status(500).json({
      success: false,
      message: '计算失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
