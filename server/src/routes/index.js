import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import inventoryRoutes from './inventory.routes.js';
import customerRoutes from './customer.routes.js';
import supplierRoutes from './supplier.routes.js';
import purchaseOrderRoutes from './purchaseOrder.routes.js';
import saleRoutes from './sale.routes.js';
import shiftRoutes from './shift.routes.js';
import financeRoutes from './finance.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import workflowRoutes from './workflow.routes.js';
import demoRoutes from './demo.routes.js';
import saasRoutes from './saas.routes.js';
import invoiceRoutes from '../../routes/invoices.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/sales', saleRoutes);
router.use('/shifts', shiftRoutes);
router.use('/finance', financeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/workflow', workflowRoutes);
router.use('/demo', demoRoutes);

// SaaS Cloud Platform Router
router.use('/', saasRoutes);

// Direct top-level route mounts for workflow endpoints
router.use('/', workflowRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
