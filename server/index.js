import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app.js';

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;

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
