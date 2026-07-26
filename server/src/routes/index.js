import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import inventoryRoutes from './inventory.routes.js';
import customerRoutes from './customer.routes.js';
import supplierRoutes from './supplier.routes.js';
import purchaseOrderRoutes from './purchaseOrder.routes.js';
import saleRoutes from './sale.routes.js';
import invoiceRoutes from '../../routes/invoices.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/sales', saleRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
