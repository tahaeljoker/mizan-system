import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import apiRoutes from './routes/index.js';
import legacyProductRoutes from '../routes/products.js';
import { errorResponse } from './utils/response.js';
import { mongoSanitize } from './middleware/sanitize.middleware.js';
import { logger } from './middleware/logger.middleware.js';
import errorHandler from '../middleware/errorHandler.js';

dotenv.config();

const app = express();

// Suppress Express Server Fingerprint Signature
app.disable('x-powered-by');

// Security & Core Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Managed at gateway level
  crossOriginEmbedderPolicy: false
}));

// Universal CORS & Preflight Middleware for Vercel & Production Deployments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Query Injection Protection
app.use(mongoSanitize);

// Request Audit & Production Logging
app.use(logger);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Orbion ERP Backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Orbion ERP API v1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
});

// Primary API Router (v1 and root alias)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Fallback for legacy product endpoints
app.use('/api/products-legacy', legacyProductRoutes);

// 404 Handler
app.use((req, res, next) => {
  return errorResponse(res, `المسار المطلوب غير موجود: ${req.originalUrl}`, 404);
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return errorResponse(res, 'Validation failed', 400, formattedErrors);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Invalid or expired token', 401);
  }

  if (err.name === 'CastError') {
    return errorResponse(res, 'Invalid resource ID format', 400);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'حدث خطأ داخلي في الخادم'
    : err.message || 'Internal server error';

  return errorResponse(res, message, statusCode);
});

app.use(errorHandler);

export default app;
