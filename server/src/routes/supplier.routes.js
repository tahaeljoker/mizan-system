import express from 'express';
import * as supplierController from '../controllers/supplier.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Read Endpoints
router.get('/', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier', 'staff'), supplierController.getSuppliers);
router.get('/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier', 'staff'), supplierController.getSupplierById);
router.get('/:id/statement', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier', 'staff'), supplierController.getStatement);

// Write Endpoints
router.post('/', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse'), supplierController.createSupplier);
router.put('/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse'), supplierController.updateSupplier);
router.post('/:id/settle', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse'), supplierController.settleDebt);

// Delete Endpoint
router.delete('/:id', authorizeRoles('owner', 'admin'), supplierController.deleteSupplier);

export default router;
