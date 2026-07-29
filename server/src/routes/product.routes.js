import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Read Endpoints (Owner, Admin, Manager, Cashier, Warehouse, Staff)
router.get('/', authenticate, productController.getProducts);
router.get('/barcode/:barcode', authenticate, productController.getProductByBarcode);
router.get('/:id', authenticate, productController.getProductById);

// Write Endpoints (Owner, Admin, Manager, Warehouse)
router.post('/', authenticate, authorizeRoles('owner', 'admin', 'manager', 'warehouse'), productController.createProduct);
router.put('/:id', authenticate, authorizeRoles('owner', 'admin', 'manager', 'warehouse'), productController.updateProduct);
router.post('/import', authenticate, authorizeRoles('owner', 'admin', 'manager', 'warehouse'), productController.importProducts);
router.patch('/:id/stock', authenticate, authorizeRoles('owner', 'admin', 'manager', 'warehouse'), productController.updateStock);

// Delete Endpoint (Owner, Admin)
router.delete('/:id', authenticate, authorizeRoles('owner', 'admin'), productController.deleteProduct);

export default router;
