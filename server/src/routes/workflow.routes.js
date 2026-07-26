import express from 'express';
import * as workflowController from '../controllers/workflow.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

/* ==========================================================================
   1. NOTIFICATIONS ENDPOINTS
   ========================================================================== */
router.get('/notifications/unread-count', workflowController.getUnreadCount);
router.patch('/notifications/read-all', workflowController.markAllRead);
router.get('/notifications', workflowController.getNotifications);
router.patch('/notifications/:id/read', workflowController.markAsRead);
router.delete('/notifications/:id', workflowController.deleteNotification);

/* ==========================================================================
   2. APPROVAL WORKFLOW ENDPOINTS
   ========================================================================== */
router.get('/approvals/pending', authorizeRoles('owner', 'admin', 'manager'), workflowController.getPendingApprovals);
router.get('/approvals/history', authorizeRoles('owner', 'admin', 'manager'), workflowController.getApprovalHistory);
router.get('/approvals', authorizeRoles('owner', 'admin', 'manager'), workflowController.getApprovals);
router.post('/approvals', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'staff', 'accountant', 'warehouse'), workflowController.createApproval);
router.post('/approvals/:id/approve', authorizeRoles('owner', 'admin', 'manager'), workflowController.approveRequest);
router.post('/approvals/:id/reject', authorizeRoles('owner', 'admin', 'manager'), workflowController.rejectRequest);
router.post('/approvals/:id/cancel', workflowController.cancelRequest);

/* ==========================================================================
   3. AUDIT TRAIL ENDPOINTS
   ========================================================================== */
router.get('/audit', authorizeRoles('owner', 'admin', 'manager', 'accountant'), workflowController.getAuditTrail);
router.get('/audit/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant'), workflowController.getAuditById);

/* ==========================================================================
   4. BACKGROUND JOBS ENDPOINTS
   ========================================================================== */
router.get('/jobs', authorizeRoles('owner', 'admin'), workflowController.getJobsList);
router.get('/jobs/history', authorizeRoles('owner', 'admin'), workflowController.getJobHistory);
router.post('/jobs/run/:job', authorizeRoles('owner', 'admin'), workflowController.runJob);

export default router;
