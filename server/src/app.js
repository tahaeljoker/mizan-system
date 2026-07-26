import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import productRoutes from '../routes/products.js';
import invoiceRoutes from '../routes/invoices.js';
import { errorResponse } from './utils/response.js';
import errorHandler from '../middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security & Core Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mizan ERP Backend', timestamp: new Date() });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mizan ERP API v1', timestamp: new Date() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/v1/products', productRoutes);
app.use('/api/products', productRoutes);

app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/invoices', invoiceRoutes);

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
  return errorResponse(res, err.message || 'Internal server error', statusCode);
});

app.use(errorHandler);

export default app;
