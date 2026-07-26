import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Read Endpoints
router.get('/', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier', 'staff'), customerController.getCustomers);
router.get('/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier', 'staff'), customerController.getCustomerById);
router.get('/:id/statement', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier', 'staff'), customerController.getStatement);

// Write Endpoints
router.post('/', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), customerController.createCustomer);
router.put('/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), customerController.updateCustomer);
router.post('/:id/settle', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), customerController.settleDebt);
router.patch('/:id/loyalty', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), customerController.updateLoyalty);

// Delete Endpoint
router.delete('/:id', authorizeRoles('owner', 'admin'), customerController.deleteCustomer);

export default router;
