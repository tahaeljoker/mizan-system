import express from 'express';
import * as shiftController from '../controllers/shift.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Special GET endpoints (must come before /:id)
router.get('/current', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'staff'), shiftController.getCurrentShift);
router.get('/history', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), shiftController.getHistory);
router.get('/daily-report', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), shiftController.getDailyReport);

// Shift Actions
router.post('/open', authorizeRoles('owner', 'admin', 'manager', 'cashier'), shiftController.openShift);
router.post('/:id/close', authorizeRoles('owner', 'admin', 'manager', 'cashier'), shiftController.closeShift);

// Standard GET endpoints
router.get('/', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), shiftController.getShifts);
router.get('/:id', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), shiftController.getShiftById);

export default router;
