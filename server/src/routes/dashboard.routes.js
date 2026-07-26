import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('owner', 'admin', 'manager', 'accountant'));

router.get('/', dashboardController.getExecutiveOverview);
router.get('/overview', dashboardController.getExecutiveOverview);
router.get('/sales', dashboardController.getSalesAnalytics);
router.get('/products', dashboardController.getProductAnalytics);
router.get('/customers', dashboardController.getCustomerAnalytics);
router.get('/inventory', dashboardController.getInventoryAnalytics);
router.get('/finance', dashboardController.getFinanceAnalytics);
router.get('/cashiers', dashboardController.getCashierAnalytics);
router.get('/branches', dashboardController.getBranchAnalytics);
router.get('/charts', dashboardController.getChartsData);

export default router;
