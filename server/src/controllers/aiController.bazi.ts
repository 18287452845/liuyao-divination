/**
 * AI分析控制器 - 八字批注
 * 使用DeepSeek API进行流式AI分析
 */

import { Request, Response } from 'express';
import axios from 'axios';
import { queryOne, update } from '../models/database';
import { BaZiDecoration, DaYunStep } from '../types/bazi';

/**
 * 构建八字批注的专业Prompt
 */
function buildBaziAnalysisPrompt(
  baziData: BaZiDecoration,
  dayunData: DaYunStep[],
  name?: string,
  gender?: string,
  question?: string
): string {
  const { bazi, shiShen, wuXing, relations } = baziData;

  // 构建详细的八字信息
  const baziInfo = `
【命主信息】
${name ? `姓名：${name}` : ''}
${gender ? `性别：${gender}` : ''}

【四柱八字】
年柱：${bazi.year.ganZhi}（${bazi.year.ganWuXing}${bazi.year.gan} ${bazi.year.zhiWuXing}${bazi.year.zhi}）
月柱：${bazi.month.ganZhi}（${bazi.month.ganWuXing}${bazi.month.gan} ${bazi.month.zhiWuXing}${bazi.month.zhi}）
日柱：${bazi.day.ganZhi}（${bazi.day.ganWuXing}${bazi.day.gan} ${bazi.day.zhiWuXing}${bazi.day.zhi}）【日主】
时柱：${bazi.hour.ganZhi}（${bazi.hour.ganWuXing}${bazi.hour.gan} ${bazi.hour.zhiWuXing}${bazi.hour.zhi}）

【十神分析】
年柱：${shiShen.year.gan}（天干）${shiShen.year.zhi}（地支）
月柱：${shiShen.month.gan}（天干）${shiShen.month.zhi}（地支）
时柱：${shiShen.hour.gan}（天干）${shiShen.hour.zhi}（地支）

【五行统计】
木：${wuXing.count.木}个
火：${wuXing.count.火}个
土：${wuXing.count.土}个
金：${wuXing.count.金}个
水：${wuXing.count.水}个
最旺：${wuXing.strongest}
最弱：${wuXing.weakest}
用神：${wuXing.yongShen || '待定'}
忌神：${wuXing.jiShen || '待定'}
平衡度：${wuXing.balance}/100

【地支关系】
${relations.liuHe.length > 0 ? `六合：${relations.liuHe.map(r => r.description).join('、')}` : ''}
${relations.sanHe.length > 0 ? `三合：${relations.sanHe.map(r => r.description).join('、')}` : ''}
${relations.liuChong.length > 0 ? `六冲：${relations.liuChong.map(r => r.description).join('、')}` : ''}
${relations.sanXing.length > 0 ? `三刑：${relations.sanXing.map(r => r.description).join('、')}` : ''}
${relations.xiangHai.length > 0 ? `相害：${relations.xiangHai.map(r => r.description).join('、')}` : ''}

【大运排列】
${dayunData.slice(0, 5).map((step, index) =>
  `第${index + 1}步：${step.ganZhi}运（${step.startAge}-${step.endAge}岁）`
).join('\n')}
`;

  // 系统提示词
  const systemPrompt = `你是一位精通中国传统命理学的资深命理师，专长于四柱八字分析。你的分析需要：

1. **基础分析**：
   - 解读四柱组合的基本格局
   - 分析日主旺衰和五行平衡
   - 解释十神对命主的影响

2. **性格特质**：
   - 根据五行和十神推断性格特点
   - 分析优势与短板
   - 天赋才能与适合领域

3. **事业财运**：
   - 事业发展方向和适合行业
   - 财运特点和理财建议
   - 职场人际关系

4. **婚姻感情**：
   - 婚姻运势和感情模式
   - 配偶特征和相处之道
   - 适合的婚配年份

5. **健康提醒**：
   - 五行失衡可能导致的健康问题
   - 养生建议和注意事项

6. **大运流年**：
   - 分析当前和未来大运的影响
   - 关键转折年份提示
   - 趋吉避凶的建议

**注意事项**：
- 分析要专业、客观、有理有据
- 语言要通俗易懂，避免过度专业术语
- 既要指出问题，也要给出建设性建议
- 强调"命运可以改变"的积极态度
- 使用Markdown格式，结构清晰

**禁止事项**：
- 禁止在回答末尾添加任何免责声明或AI署名
- 禁止输出类似"以上内容由XX生成"、"仅供参考"等声明
- 直接给出专业分析内容，无需说明内容来源

请按以上要求对以下八字进行详细批注：`;

  const userPrompt = baziInfo + (question ? `\n\n【特别关注】：${question}` : '');

  return `${systemPrompt}\n\n${userPrompt}`;
}

/**
 * AI流式分析八字
 * POST /api/ai/analyze-bazi
 */
export async function analyzeBazi(req: Request, res: Response): Promise<void> {
  try {
    const { recordId, baziData, dayunData, name, gender, question } = req.body;
    const userId = (req as any).user?.userId;

    // 验证输入
    if (!baziData || !dayunData) {
      res.status(400).json({
        success: false,
        message: '八字数据不能为空'
      });
      return;
    }

    // 如果提供了recordId，验证记录所有权
    if (recordId) {
      const record: any = await queryOne(
        'SELECT id FROM bazi_records WHERE id = ? AND user_id = ?',
        [recordId, userId]
      );

      if (!record) {
        res.status(404).json({
          success: false,
          message: '记录不存在或无权访问'
        });
        return;
      }
    }

    // 获取API Key（用户自定义优先）
    let apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';

    if (userId) {
      const user: any = await queryOne(
        'SELECT deepseek_api_key FROM users WHERE id = ?',
        [userId]
      );
      if (user?.deepseek_api_key) {
        apiKey = user.deepseek_api_key;
      }
    }

    if (!apiKey) {
      res.status(500).json({
        success: false,
        message: 'DeepSeek API密钥未配置'
      });
      return;
    }

    // 构建Prompt
    const prompt = buildBaziAnalysisPrompt(
      baziData as BaZiDecoration,
      dayunData as DaYunStep[],
      name,
      gender,
      question
    );

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲

    // 调用DeepSeek API（流式）
    const response = await axios.post(
      `${apiUrl}/v1/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );

    let fullAnalysis = '';

    // 处理流式响应
    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            // 流结束，保存完整分析到数据库
            if (recordId && fullAnalysis) {
              update(
                `UPDATE bazi_records
                 SET ai_analysis = ?, ai_model = ?, ai_analyzed_at = ?
                 WHERE id = ? AND user_id = ?`,
                [fullAnalysis, 'deepseek-chat', Date.now(), recordId, userId]
              ).catch(err => console.error('保存AI分析失败:', err));
            }

            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullAnalysis += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });

    response.data.on('error', (error: Error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

    response.data.on('end', () => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error('AI分析失败:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'AI分析失败',
        error: error instanceof Error ? error.message : String(error)
      });
    } else {
      res.write(`data: ${JSON.stringify({
        error: error instanceof Error ? error.message : 'AI分析失败'
      })}\n\n`);
      res.end();
    }
  }
}

/**
 * 非流式AI分析（备用，用于不支持SSE的场景）
 * POST /api/ai/analyze-bazi-sync
 */
export async function analyzeBaziSync(req: Request, res: Response): Promise<void> {
  try {
    const { recordId, baziData, dayunData, name, gender, question } = req.body;
    const userId = (req as any).user?.userId;

    // 验证输入
    if (!baziData || !dayunData) {
      res.status(400).json({
        success: false,
        message: '八字数据不能为空'
      });
      return;
    }

    // 获取API Key
    let apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';

    if (userId) {
      const user: any = await queryOne(
        'SELECT deepseek_api_key FROM users WHERE id = ?',
        [userId]
      );
      if (user?.deepseek_api_key) {
        apiKey = user.deepseek_api_key;
      }
    }

    if (!apiKey) {
      res.status(500).json({
        success: false,
        message: 'DeepSeek API密钥未配置'
      });
      return;
    }

    // 构建Prompt
    const prompt = buildBaziAnalysisPrompt(
      baziData as BaZiDecoration,
      dayunData as DaYunStep[],
      name,
      gender,
      question
    );

    // 调用DeepSeek API（非流式）
    const response = await axios.post(
      `${apiUrl}/v1/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const analysis = response.data.choices?.[0]?.message?.content || '';

    // 保存到数据库
    if (recordId && analysis) {
      await update(
        `UPDATE bazi_records
         SET ai_analysis = ?, ai_model = ?, ai_analyzed_at = ?
         WHERE id = ? AND user_id = ?`,
        [analysis, 'deepseek-chat', Date.now(), recordId, userId]
      );
    }

    res.json({
      success: true,
      data: {
        analysis,
        model: 'deepseek-chat'
      }
    });

  } catch (error) {
    console.error('AI分析失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI分析失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
