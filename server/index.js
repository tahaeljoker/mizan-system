import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import Routes & Middleware
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import errorHandler from './middleware/errorHandler.js';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Development request logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[DEV LOG] ${req.method} ${req.url}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mizan Server MERN Backend is running smoothly' });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Running in offline DB mode. Please configure a valid MongoDB instance in server/.env');
  });

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Mizan Server listening on port ${PORT}`);
});
