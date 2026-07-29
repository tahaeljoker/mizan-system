import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loginRateLimiter } from '../middleware/rateLimiter.middleware.js';
import legacyAuthRoutes from '../../routes/auth.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/login', loginRateLimiter(10, 15 * 60 * 1000), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// Protected Authentication Endpoints
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

// Mount legacy auth routes for backward compatibility (/register, /report-payment)
router.use('/', legacyAuthRoutes);

export default router;
