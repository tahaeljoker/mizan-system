import express from 'express';
import * as demoController from '../controllers/demo.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/accounts', demoController.getDemoAccounts);
router.get('/status', demoController.getDemoStatus);
router.get('/info', demoController.getDemoInfo);

// Protected reset endpoint: Requires Owner/Admin authentication
router.post('/reset', authenticate, authorizeRoles('owner', 'admin'), demoController.resetDemoEnvironment);

export default router;
