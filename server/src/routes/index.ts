import express from 'express';
import {
  createDivination,
  simulateShake,
  getRecords,
  getRecordById,
  updateAiAnalysis,
  deleteRecord,
  updateVerification,
  cancelVerification,
  getVerifiedRecords,
  getUnverifiedRecords,
  getStatistics
} from '../controllers/divinationController';
import { analyzeGua } from '../controllers/aiController';
import {
  solarToLunar,
  lunarToSolar,
  branchRelations,
  yongShenHelper,
  getCategories,
  getGuaList,
  getGuaDetail,
  getJieQiTable
} from '../controllers/toolsController';
import {
  login,
  register,
  getCurrentUser,
  changePassword,
  updateProfile,
  refreshToken,
  logout
} from '../controllers/authController';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  resetPassword
} from '../controllers/userController';
import {
  getRoles,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRoleStatus,
  getPermissions,
  assignPermissions
} from '../controllers/roleController';
import {
  getApiKey,
  updateApiKey,
  deleteApiKey,
  testApiKey
} from '../controllers/apiKeyController';
import {
  getLoginLogs,
  getOperationLogs,
  deleteLoginLogs,
  deleteOperationLogs,
  exportLoginLogs,
  exportOperationLogs
} from '../controllers/logController';
import {
  getUserSessions,
  getAllActiveSessions,
  invalidateSession,
  invalidateOtherSessions,
  invalidateAllUserSessions,
  getSessionStatistics
} from '../controllers/sessionController';
import {
  getSecuritySettings,
  enableTwoFactor,
  disableTwoFactor,
  lockUserAccount,
  unlockUserAccount,
  forcePasswordReset,
  getSecurityAuditReport
} from '../controllers/securityController';
import {
  sendEmailVerification,
  verifyEmail,
  sendPasswordReset,
  resetPassword as resetPasswordEmail,
  sendEmailChangeVerification,
  confirmEmailChange,
  batchSendEmailVerification
} from '../controllers/emailController';
import {
  getInviteCodeList,
  getInviteCodeStatistics,
  getInviteCodeDetail,
  createInviteCodeController,
  batchCreateInviteCodesController,
  generateRandomInviteCodeController,
  updateInviteCodeController,
  updateInviteCodeStatusController,
  deleteInviteCodeController
} from '../controllers/inviteController';
import {
  getAuditLogList,
  exportAuditLogController,
  cleanupAuditLogController,
  getAuditLogStatistics
} from '../controllers/auditController';
import { authenticate, requirePermissions, requireRoles } from '../middleware/auth';

const router = express.Router();

// 卦象相关路由（需要登录）
router.post('/divination', authenticate, requirePermissions('divination:create'), createDivination);
router.get('/divination/simulate', authenticate, simulateShake);
router.get('/records', authenticate, requirePermissions('divination:view'), getRecords);
router.get('/records/:id', authenticate, requirePermissions('divination:view'), getRecordById);
router.put('/records/:id/analysis', authenticate, updateAiAnalysis);
router.delete('/records/:id', authenticate, requirePermissions('divination:delete'), deleteRecord);

// 验证反馈路由（需要登录）
router.put('/records/:id/verification', authenticate, updateVerification);
router.delete('/records/:id/verification', authenticate, cancelVerification);
router.get('/records/verified/list', authenticate, getVerifiedRecords);
router.get('/records/unverified/list', authenticate, getUnverifiedRecords);
router.get('/statistics', authenticate, getStatistics);

// AI解卦路由（需要登录和权限）
router.post('/ai/analyze', authenticate, requirePermissions('divination:aiAnalysis'), analyzeGua);

// 工具路由（需要登录）
router.get('/tools/calendar/solar-to-lunar', authenticate, solarToLunar);
router.get('/tools/calendar/lunar-to-solar', authenticate, lunarToSolar);
router.get('/tools/branch/relations', authenticate, branchRelations);
router.get('/tools/yongshen/helper', authenticate, yongShenHelper);
router.get('/tools/yongshen/categories', authenticate, getCategories);
router.get('/tools/jieqi/table', authenticate, getJieQiTable);
router.get('/tools/gua/list', authenticate, getGuaList);
router.get('/tools/gua/:number', authenticate, getGuaDetail);

// ==================== 认证相关路由 ====================
// 公开路由（无需认证）
router.post('/auth/login', login);
router.post('/auth/register', register);

// 需要认证的路由
router.get('/auth/me', authenticate, getCurrentUser);
router.post('/auth/change-password', authenticate, changePassword);
router.put('/auth/profile', authenticate, updateProfile);
router.post('/auth/refresh', authenticate, refreshToken);
router.post('/auth/logout', authenticate, logout);

// ==================== API Key 管理 ====================
router.get('/user/api-key', authenticate, getApiKey);
router.put('/user/api-key', authenticate, updateApiKey);
router.delete('/user/api-key', authenticate, deleteApiKey);
router.post('/user/api-key/test', authenticate, testApiKey);

// ==================== 用户管理路由 ====================
// 所有用户管理路由都需要管理员权限
router.get('/users', authenticate, requirePermissions('user:view'), getUsers);
router.get('/users/:id', authenticate, requirePermissions('user:view'), getUserById);
router.post('/users', authenticate, requirePermissions('user:create'), createUser);
router.put('/users/:id', authenticate, requirePermissions('user:edit'), updateUser);
router.delete('/users/:id', authenticate, requirePermissions('user:delete'), deleteUser);
router.patch('/users/:id/status', authenticate, requirePermissions('user:status'), updateUserStatus);
router.post('/users/:id/reset-password', authenticate, requirePermissions('user:edit'), resetPassword);

// ==================== 角色管理路由 ====================
// 所有角色管理路由都需要管理员权限
router.get('/roles', authenticate, requirePermissions('role:view'), getRoles);
router.get('/roles/all', authenticate, getAllRoles); // 用于下拉选择，所有登录用户可访问
router.get('/roles/:id', authenticate, requirePermissions('role:view'), getRoleById);
router.post('/roles', authenticate, requirePermissions('role:create'), createRole);
router.put('/roles/:id', authenticate, requirePermissions('role:edit'), updateRole);
router.delete('/roles/:id', authenticate, requirePermissions('role:delete'), deleteRole);
router.patch('/roles/:id/status', authenticate, requirePermissions('role:edit'), updateRoleStatus);

// 权限管理路由
router.get('/permissions', authenticate, requirePermissions('permission:view'), getPermissions);
router.post('/roles/:id/permissions', authenticate, requirePermissions('role:assignPermission'), assignPermissions);

// ==================== 日志管理路由 ====================
router.get('/logs/login', authenticate, requirePermissions('log:viewLogin'), getLoginLogs);
router.get('/logs/operation', authenticate, requirePermissions('log:viewOperation'), getOperationLogs);
router.delete('/logs/login', authenticate, requirePermissions('log:delete'), deleteLoginLogs);
router.delete('/logs/operation', authenticate, requirePermissions('log:delete'), deleteOperationLogs);
router.get('/logs/login/export', authenticate, requirePermissions('log:export'), exportLoginLogs);
router.get('/logs/operation/export', authenticate, requirePermissions('log:export'), exportOperationLogs);

// ==================== 会话管理路由 ====================
router.get('/sessions', authenticate, requirePermissions('session:view'), getAllActiveSessions);
router.get('/sessions/user/:userId', authenticate, requirePermissions('session:view'), getUserSessions);
router.delete('/sessions/:sessionId', authenticate, requirePermissions('session:manage'), invalidateSession);
router.post('/sessions/invalidate-others', authenticate, invalidateOtherSessions);
router.delete('/sessions/user/:userId/all', authenticate, requirePermissions('session:manage'), invalidateAllUserSessions);
router.get('/sessions/statistics', authenticate, requirePermissions('session:view'), getSessionStatistics);

// ==================== 安全管理路由 ====================
router.get('/security/settings', authenticate, requirePermissions('security:view'), getSecuritySettings);
router.post('/security/2fa/enable', authenticate, enableTwoFactor);
router.post('/security/2fa/disable', authenticate, disableTwoFactor);
router.post('/security/lock/:userId', authenticate, requirePermissions('security:lockUnlock'), lockUserAccount);
router.post('/security/unlock/:userId', authenticate, requirePermissions('security:lockUnlock'), unlockUserAccount);
router.post('/security/force-reset-password/:userId', authenticate, requirePermissions('security:forcePasswordReset'), forcePasswordReset);
router.get('/security/audit-report', authenticate, requirePermissions('security:auditReport'), getSecurityAuditReport);

// ==================== 邮箱验证路由 ====================
router.post('/email/send-verification', authenticate, sendEmailVerification);
router.post('/email/verify', authenticate, verifyEmail);
router.post('/email/send-reset', sendPasswordReset);
router.post('/email/reset-password', resetPasswordEmail);
router.post('/email/send-change-verification', authenticate, sendEmailChangeVerification);
router.post('/email/confirm-change', authenticate, confirmEmailChange);
router.post('/email/batch-send-verification', authenticate, requirePermissions('email:batchVerify'), batchSendEmailVerification);

// ==================== 邀请码管理路由 ====================
// 所有邀请码管理路由都需要管理员权限
router.get('/invite-codes', authenticate, requirePermissions('invite:view'), getInviteCodeList);
router.get('/invite-codes/statistics', authenticate, requirePermissions('invite:view'), getInviteCodeStatistics);
router.get('/invite-codes/:id', authenticate, requirePermissions('invite:view'), getInviteCodeDetail);
router.post('/invite-codes', authenticate, requirePermissions('invite:create'), createInviteCodeController);
router.post('/invite-codes/batch', authenticate, requirePermissions('invite:create'), batchCreateInviteCodesController);
router.get('/invite-codes/generate/random', authenticate, generateRandomInviteCodeController);
router.put('/invite-codes/:id', authenticate, requirePermissions('invite:edit'), updateInviteCodeController);
router.patch('/invite-codes/:id/status', authenticate, requirePermissions('invite:edit'), updateInviteCodeStatusController);
router.delete('/invite-codes/:id', authenticate, requirePermissions('invite:delete'), deleteInviteCodeController);

// ==================== 审计日志管理路由 ====================
// 所有审计日志路由都需要管理员权限
router.get('/audit-logs', authenticate, requirePermissions('audit:view'), getAuditLogList);
router.get('/audit-logs/statistics', authenticate, requirePermissions('audit:view'), getAuditLogStatistics);
router.get('/audit-logs/export', authenticate, requirePermissions('audit:export'), exportAuditLogController);
router.post('/audit-logs/cleanup', authenticate, requirePermissions('audit:cleanup'), cleanupAuditLogController);

export default router;
