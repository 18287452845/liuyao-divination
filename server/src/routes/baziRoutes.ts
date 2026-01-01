/**
 * 八字批命 API 路由配置
 *
 * 使用说明：
 * 将此路由添加到主服务器的路由配置中
 */

import { Router } from 'express';
import * as baziController from '../controllers/baziController';
import * as aiController from '../controllers/aiController.bazi';
import { authenticate, requirePermissions } from '../middleware/auth';

const router = Router();

// ==================== 八字批命路由 ====================

/**
 * 创建八字记录
 * POST /api/bazi
 * 权限：bazi:create
 */
router.post(
  '/',
  authenticate,
  requirePermissions('bazi:create'),
  baziController.createBazi
);

/**
 * 获取八字记录列表
 * GET /api/bazi/records?search=xxx&limit=20&offset=0
 * 权限：bazi:view
 */
router.get(
  '/records',
  authenticate,
  requirePermissions('bazi:view'),
  baziController.getRecords
);

/**
 * 获取单条八字记录
 * GET /api/bazi/records/:id
 * 权限：bazi:view
 */
router.get(
  '/records/:id',
  authenticate,
  requirePermissions('bazi:view'),
  baziController.getRecordById
);

/**
 * 删除八字记录
 * DELETE /api/bazi/records/:id
 * 权限：bazi:delete
 */
router.delete(
  '/records/:id',
  authenticate,
  requirePermissions('bazi:delete'),
  baziController.deleteRecord
);

/**
 * 更新AI分析结果
 * PUT /api/bazi/records/:id/analysis
 * 权限：bazi:aiAnalysis
 */
router.put(
  '/records/:id/analysis',
  authenticate,
  requirePermissions('bazi:aiAnalysis'),
  baziController.updateAiAnalysis
);

/**
 * 更新验证反馈
 * PUT /api/bazi/records/:id/verification
 * 权限：bazi:verify
 */
router.put(
  '/records/:id/verification',
  authenticate,
  requirePermissions('bazi:verify'),
  baziController.updateVerification
);

/**
 * 工具：仅计算四柱（不保存）
 * POST /api/bazi/tools/calculate-pillars
 * 权限：公开或仅需登录
 */
router.post(
  '/tools/calculate-pillars',
  authenticate,
  baziController.calculatePillars
);

// ==================== AI分析路由 ====================

/**
 * AI流式分析八字（SSE）
 * POST /api/bazi/ai/analyze
 * 权限：bazi:aiAnalysis
 */
router.post(
  '/ai/analyze',
  authenticate,
  requirePermissions('bazi:aiAnalysis'),
  aiController.analyzeBazi
);

/**
 * AI非流式分析八字（备用）
 * POST /api/bazi/ai/analyze-sync
 * 权限：bazi:aiAnalysis
 */
router.post(
  '/ai/analyze-sync',
  authenticate,
  requirePermissions('bazi:aiAnalysis'),
  aiController.analyzeBaziSync
);

export default router;

/**
 * 集成说明：
 *
 * 1. 在主服务器文件（如 src/index.ts 或 src/app.ts）中导入：
 *    import baziRoutes from './routes/baziRoutes';
 *
 * 2. 注册路由：
 *    app.use('/api/bazi', baziRoutes);
 *
 * 3. 取消注释上面的认证中间件（authenticate 和 requirePermissions）
 *
 * 4. 确保权限已在数据库中配置（已在 02_bazi_tables.sql 中完成）
 */
