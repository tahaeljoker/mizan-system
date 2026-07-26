import express from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all inventory endpoints
router.use(authenticate);

/* ==========================================================================
   REPORT & MANUAL ADJUSTMENT ENDPOINTS
   ========================================================================== */
router.get('/history', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getHistory);
router.get('/low-stock', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getLowStock);
router.get('/out-of-stock', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getOutOfStock);
router.patch('/adjust', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.manualAdjustment);

/* ==========================================================================
   STOCK COUNT SESSION ENDPOINTS
   ========================================================================== */
router.get('/sessions', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getSessions);
router.get('/sessions/:id', authorizeRoles('owner', 'admin', 'manager', 'warehouse', 'cashier', 'staff'), inventoryController.getSessionById);
router.post('/sessions', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.createSession);
router.put('/sessions/:id', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.updateSession);
router.delete('/sessions/:id', authorizeRoles('owner', 'admin'), inventoryController.deleteSession);

// Session Workflows (Blind Count, Manager Review, Owner Approval, Reject)
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
router.post('/transfers/:id/approve', authorizeRoles('manager', 'admin', 'owner'), inventoryController.approveTransfer);
router.post('/transfers/:id/receive', authorizeRoles('owner', 'admin', 'manager', 'warehouse'), inventoryController.receiveTransfer);
router.post('/transfers/:id/reject', authorizeRoles('manager', 'admin', 'owner'), inventoryController.rejectTransfer);

export default router;
