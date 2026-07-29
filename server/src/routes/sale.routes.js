import express from 'express';
import * as saleController from '../controllers/sale.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Special GET routes (placed before /:id)
router.get('/history', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), saleController.getHistory);
router.get('/daily-summary', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), saleController.getDailySummary);
router.get('/invoice/:invoiceNumber', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), saleController.getSaleByInvoiceNumber);

// Standard GET routes
router.get('/', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), saleController.getSales);
router.get('/:id', authorizeRoles('owner', 'admin', 'manager', 'cashier', 'accountant'), saleController.getSaleById);

// Write Endpoints
router.post('/', authorizeRoles('owner', 'admin', 'manager', 'cashier'), saleController.createSale);
router.post('/hold', authorizeRoles('owner', 'admin', 'manager', 'cashier'), saleController.holdSale);
router.post('/:id/resume', authorizeRoles('owner', 'admin', 'manager', 'cashier'), saleController.resumeSale);

// Refund & Cancel Endpoints
router.post('/:id/refund', authorizeRoles('owner', 'admin', 'manager'), saleController.refundSale);
router.patch('/:id/cancel', authorizeRoles('owner', 'admin'), saleController.cancelSale);

export default router;
