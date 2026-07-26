import express from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

/* ==========================================================================
   REPORT & MANUAL / BULK ADJUSTMENT ENDPOINTS
   ========================================================================== */
router.get('/history', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getHistory);
router.get('/low-stock', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getLowStock);
router.get('/out-of-stock', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getOutOfStock);
router.get('/report', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'accountant'), inventoryController.getInventoryReport);

router.patch('/adjust', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.manualAdjustment);
router.patch('/bulk-adjust', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.bulkAdjust);

/* ==========================================================================
   STOCK COUNT SESSION ENDPOINTS (/stock-count & /sessions)
   ========================================================================== */
router.get('/sessions', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getSessions);
router.get('/sessions/:id', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getSessionById);
router.post('/sessions', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.createSession);
router.put('/sessions/:id', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.updateSession);
router.delete('/sessions/:id', authorizeRoles('owner', 'admin'), inventoryController.deleteSession);

// Phase 13.9 Stock Count Aliases & Workflows
router.post('/stock-count', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.createSession);
router.post('/stock-count/:id/start', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.startCounting);
router.post('/stock-count/:id/submit', authorizeRoles('staff', 'cashier', 'warehouse', 'manager', 'admin', 'owner'), inventoryController.submitBlindCount);
router.post('/stock-count/:id/approve', authorizeRoles('owner', 'admin'), inventoryController.ownerApproval);

// Session Workflows
router.post('/sessions/:id/count', authorizeRoles('staff', 'cashier', 'warehouse', 'manager', 'admin', 'owner'), inventoryController.submitBlindCount);
router.post('/sessions/:id/review', authorizeRoles('manager', 'admin', 'owner'), inventoryController.managerReview);
router.post('/sessions/:id/approve', authorizeRoles('owner', 'admin'), inventoryController.ownerApproval);
router.post('/sessions/:id/reject', authorizeRoles('manager', 'admin', 'owner'), inventoryController.rejectSession);

/* ==========================================================================
   BRANCH STOCK TRANSFER ENDPOINTS
   ========================================================================== */
router.get('/transfers', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getTransfers);
router.get('/transfers/:id', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getTransferById);
router.post('/transfers', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.createTransfer);
router.post('/transfers/:id/dispatch', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.dispatchTransfer);
router.post('/transfers/:id/approve', authorizeRoles('manager', 'admin', 'owner'), inventoryController.approveTransfer);
router.post('/transfers/:id/receive', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.receiveTransfer);
router.post('/transfers/:id/cancel', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.cancelTransfer);
router.post('/transfers/:id/reject', authorizeRoles('manager', 'admin', 'owner'), inventoryController.cancelTransfer);

export default router;
