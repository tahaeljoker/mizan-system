import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedPlans } from './planSeeder.js';

dotenv.config();

/**
 * Extensible Database Seed Runner for Mizan ERP System.
 */
const runSeeders = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    console.log('🔌 Connecting to MongoDB for Seeding...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB.');

    // Extensible Seeder Pipeline
    console.log('\n--- Starting Database Seeders ---');
    await seedPlans();
    // await seedSettings();
    // await seedRoles();
    console.log('---------------------------------\n');

    console.log('🎉 All seeders executed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

runSeeders();
