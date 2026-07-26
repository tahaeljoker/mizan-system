import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import invoiceRoutes from '../../routes/invoices.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
