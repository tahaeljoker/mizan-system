import express from 'express';
import * as saasController from '../controllers/saas.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ==========================================================================
   PUBLIC SAAS ENDPOINTS
   ========================================================================== */
router.post('/saas/register', saasController.registerCompany);
router.get('/saas/plans', saasController.getSubscriptionPlans);

/* ==========================================================================
   TENANT SAAS ENDPOINTS (Requires Auth)
   ========================================================================== */
router.get('/saas/tickets', authenticate, saasController.getSupportTickets);
router.post('/saas/tickets', authenticate, saasController.createSupportTicket);
router.post('/saas/tickets/:id/reply', authenticate, saasController.replySupportTicket);
router.get('/saas/white-label', authenticate, saasController.getWhiteLabelConfig);
router.post('/saas/white-label', authenticate, saasController.updateWhiteLabelConfig);

/* ==========================================================================
   SUPER ADMIN ENDPOINTS (Requires Super Admin Auth)
   ========================================================================== */
router.use('/super', authenticate);
router.use('/super', authorizeRoles('admin', 'SUPER_ADMIN', 'owner'));

router.get('/super/dashboard', saasController.getSuperAdminDashboard);
router.get('/super/companies', saasController.listCompanies);
router.patch('/super/companies/:id/status', saasController.updateCompanyStatus);
router.delete('/super/companies/:id', saasController.deleteCompany);
router.post('/super/companies/:id/impersonate', saasController.impersonateCompany);
router.get('/super/plans', saasController.getSubscriptionPlans);
router.post('/super/plans', saasController.createSubscriptionPlan);
router.get('/super/backups', saasController.getSystemBackups);
router.post('/super/backups', saasController.triggerSystemBackup);

export default router;
