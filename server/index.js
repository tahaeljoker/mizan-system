import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app.js';
import { seedDemoEnvironment } from './seeders/demo.seeder.js';

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    try {
      await seedDemoEnvironment();
    } catch (err) {
      console.warn('⚠️ Demo seeding skipped or notice:', err.message);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Running in offline DB mode. Please configure a valid MongoDB instance in server/.env');
  });

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Mizan Server listening on port ${PORT}`);
});
