import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as saasService from './src/services/saas.service.js';
import User from './models/User.js';

dotenv.config();

const runSaaSTests = async () => {
  console.log('🧪 Starting SaaS Cloud Platform Integration Tests...');

  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // 1. Super Admin Dashboard Metrics
    console.log('--- Test 1: Super Admin Dashboard ---');
    const dashboard = await saasService.getSuperAdminDashboard();
    console.log('✅ Super Admin Dashboard metrics:', {
      totalCompanies: dashboard.totalCompanies,
      activeCompanies: dashboard.activeCompanies,
      mrr: dashboard.mrr,
      arr: dashboard.arr,
      systemHealth: dashboard.systemHealth.dbState
    });

    // 2. Company Management List
    console.log('--- Test 2: List Companies ---');
    const companies = await saasService.listCompanies({ page: 1, limit: 10 });
    console.log(`✅ Companies List fetched: ${companies.data.length} companies, Total: ${companies.pagination.totalItems}`);

    // 3. Subscription Plans
    console.log('--- Test 3: Subscription Plans ---');
    const plans = await saasService.getSubscriptionPlans();
    console.log(`✅ Subscription Plans fetched: ${plans.length} active plans`);

    // 4. System Backup Trigger
    console.log('--- Test 4: Trigger System Backup ---');
    const dummyUser = await User.findOne({}) || { _id: new mongoose.Types.ObjectId() };
    const backup = await saasService.triggerSystemBackup(dummyUser);
    console.log('✅ System Backup triggered:', backup.backupName);

    // 5. System Backups List
    console.log('--- Test 5: Get System Backups List ---');
    const backups = await saasService.getSystemBackups();
    console.log(`✅ System Backups List fetched: ${backups.length} backups recorded`);

    console.log('🎉 All Phase 14.0 SaaS Cloud Platform Integration Tests Passed 100%!');
    process.exit(0);
  } catch (error) {
    console.error('❌ SaaS Test Failed:', error);
    process.exit(1);
  }
};

runSaaSTests();
