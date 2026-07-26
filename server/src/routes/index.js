import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import inventoryRoutes from './inventory.routes.js';
import invoiceRoutes from '../../routes/invoices.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
