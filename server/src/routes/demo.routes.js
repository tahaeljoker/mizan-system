import express from 'express';
import * as demoController from '../controllers/demo.controller.js';

const router = express.Router();

router.get('/accounts', demoController.getDemoAccounts);
router.get('/status', demoController.getDemoStatus);
router.post('/reset', demoController.resetDemoEnvironment);
router.get('/info', demoController.getDemoInfo);

export default router;
