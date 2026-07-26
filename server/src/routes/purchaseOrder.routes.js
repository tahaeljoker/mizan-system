import express from 'express';
import * as purchaseOrderController from '../controllers/purchaseOrder.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Read Endpoints
router.get('/', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier', 'staff'), purchaseOrderController.getPurchaseOrders);
router.get('/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier', 'staff'), purchaseOrderController.getPurchaseOrderById);

// Write / Workflows Endpoints
router.post('/', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse'), purchaseOrderController.createPurchaseOrder);
router.put('/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse'), purchaseOrderController.updatePurchaseOrder);
router.post('/:id/receive', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse'), purchaseOrderController.receivePurchaseOrder);
router.post('/:id/cancel', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse'), purchaseOrderController.cancelPurchaseOrder);

// Delete Endpoint
router.delete('/:id', authorizeRoles('owner', 'admin'), purchaseOrderController.deletePurchaseOrder);

export default router;
