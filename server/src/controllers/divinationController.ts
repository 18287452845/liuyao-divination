import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DivinationRecordModel, GuaDataModel } from '../models/database';
import {
  divinationByTime,
  divinationByNumbers,
  divinationByManual,
  divinationByInput,
  generateBianGua,
  decorateGua,
  simulateYaoGua
} from '../utils/liuyao';

// 创建卦象
export const createDivination = async (req: Request, res: Response) => {
  try {
    const { method, question, gender, bazi, data } = req.body;
    const timestamp = Date.now();
    const date = new Date(timestamp);

    let benGua;

    // 根据不同方法起卦
    if (method === 'time') {
      benGua = divinationByTime(date);
    } else if (method === 'number') {
      const { num1, num2, num3 } = data;
      benGua = divinationByNumbers(num1, num2, num3);
    } else if (method === 'manual') {
      const { yaoResults } = data;
      benGua = divinationByManual(yaoResults);
    } else if (method === 'input') {
      const { lines, changes } = data;
      benGua = divinationByInput(lines, changes);
    } else {
      return res.status(400).json({ error: '不支持的起卦方法' });
    }

    // 生成变卦
    const bianGua = generateBianGua(benGua);

    // 装卦
    const decoration = decorateGua(benGua, date);

    // 保存到数据库
    const id = uuidv4();
    const record = {
      id,
      timestamp,
      question,
      gender: gender || undefined,
      bazi: bazi ? JSON.stringify(bazi) : undefined,
      method,
      ben_gua: JSON.stringify(benGua),
      bian_gua: bianGua ? JSON.stringify(bianGua) : null,
      decoration: JSON.stringify(decoration)
    };

    await DivinationRecordModel.create(record);

    res.json({
      id,
      timestamp,
      question,
      method,
      benGua,
      bianGua,
      decoration
    });
  } catch (error) {
    console.error('创建卦象错误:', error);
    res.status(500).json({ error: '创建卦象失败' });
  }
};

// 模拟摇卦
export const simulateShake = async (req: Request, res: Response) => {
  try {
    const result = simulateYaoGua();
    res.json({ result });
  } catch (error) {
    console.error('模拟摇卦错误:', error);
    res.status(500).json({ error: '模拟摇卦失败' });
  }
};

// 获取历史记录列表
export const getRecords = async (req: Request, res: Response) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;

    const records: any = await DivinationRecordModel.findAll(
      search as string,
      Number(limit),
      Number(offset)
    );

    const formattedRecords = records.map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      question: row.question,
      method: row.method,
      benGua: JSON.parse(row.ben_gua),
      bianGua: row.bian_gua ? JSON.parse(row.bian_gua) : null,
      decoration: JSON.parse(row.decoration),
      aiAnalysis: row.ai_analysis,
      createdAt: row.created_at
    }));

    res.json(formattedRecords);
  } catch (error) {
    console.error('获取记录错误:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
};

// 获取单条记录
export const getRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const row: any = await DivinationRecordModel.findById(id);

    if (!row) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const benGua = JSON.parse(row.ben_gua);
    const decoration = JSON.parse(row.decoration);

    // 查询卦辞和爻辞
    const guaData: any = await GuaDataModel.findByName(benGua.name);

    // 解析爻辞JSON
    let yaoCi: string[] = [];
    if (guaData && guaData.yao_ci) {
      try {
        yaoCi = JSON.parse(guaData.yao_ci);
      } catch (e) {
        console.error('解析爻辞JSON失败:', e);
      }
    }

    // 将卦辞和爻辞添加到decoration对象
    if (guaData) {
      decoration.guaCi = guaData.gua_ci || '';
      decoration.yaoCi = yaoCi;
    }

    const record = {
      id: row.id,
      timestamp: row.timestamp,
      question: row.question,
      method: row.method,
      benGua,
      bianGua: row.bian_gua ? JSON.parse(row.bian_gua) : null,
      decoration,
      aiAnalysis: row.ai_analysis,
      createdAt: row.created_at
    };

    res.json(record);
  } catch (error) {
    console.error('获取记录错误:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
};

// 更新AI解析结果
export const updateAiAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { aiAnalysis } = req.body;

    await DivinationRecordModel.updateAnalysis(id, aiAnalysis);

    res.json({ success: true });
  } catch (error) {
    console.error('更新AI解析错误:', error);
    res.status(500).json({ error: '更新AI解析失败' });
  }
};

// 删除记录
export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await DivinationRecordModel.deleteById(id);

    res.json({ success: true });
  } catch (error) {
    console.error('删除记录错误:', error);
    res.status(500).json({ error: '删除记录失败' });
  }
};

// ========== 验证反馈相关接口 ==========

// 更新验证信息
export const updateVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actual_result, accuracy_rating, user_notes } = req.body;

    // 验证参数
    if (!actual_result || !accuracy_rating) {
      return res.status(400).json({ error: '请提供实际结果和准确度评分' });
    }

    if (accuracy_rating < 1 || accuracy_rating > 5) {
      return res.status(400).json({ error: '准确度评分必须在1-5之间' });
    }

    await DivinationRecordModel.updateVerification(id, {
      actual_result,
      accuracy_rating,
      user_notes
    });

    res.json({ success: true, message: '验证信息已保存' });
  } catch (error) {
    console.error('更新验证信息错误:', error);
    res.status(500).json({ error: '保存验证信息失败' });
  }
};

// 取消验证
export const cancelVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await DivinationRecordModel.cancelVerification(id);

    res.json({ success: true, message: '验证已取消' });
  } catch (error) {
    console.error('取消验证错误:', error);
    res.status(500).json({ error: '取消验证失败' });
  }
};

// 获取已验证的记录
export const getVerifiedRecords = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const records = await DivinationRecordModel.findVerified(limit, offset);

    // 解析JSON字段
    const parsedRecords = (records as any[]).map((r: any) => ({
      ...r,
      ben_gua: JSON.parse(r.ben_gua),
      bian_gua: r.bian_gua ? JSON.parse(r.bian_gua) : null,
      decoration: JSON.parse(r.decoration),
      bazi: r.bazi ? JSON.parse(r.bazi) : undefined
    }));

    res.json(parsedRecords);
  } catch (error) {
    console.error('获取已验证记录错误:', error);
    res.status(500).json({ error: '获取已验证记录失败' });
  }
};

// 获取待验证的记录
export const getUnverifiedRecords = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const records = await DivinationRecordModel.findUnverified(limit, offset);

    // 解析JSON字段
    const parsedRecords = (records as any[]).map((r: any) => ({
      ...r,
      ben_gua: JSON.parse(r.ben_gua),
      bian_gua: r.bian_gua ? JSON.parse(r.bian_gua) : null,
      decoration: JSON.parse(r.decoration),
      bazi: r.bazi ? JSON.parse(r.bazi) : undefined
    }));

    res.json(parsedRecords);
  } catch (error) {
    console.error('获取待验证记录错误:', error);
    res.status(500).json({ error: '获取待验证记录失败' });
  }
};

// 获取统计信息
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await DivinationRecordModel.getStatistics();

    res.json(stats);
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
};
