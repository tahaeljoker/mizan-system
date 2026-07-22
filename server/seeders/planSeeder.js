import Plan from '../models/Plan.js';

export const defaultPlans = [
  {
    code: 'trial',
    name: 'الفترة التجريبية',
    version: '1.0',
    monthlyPrice: 0,
    yearlyPrice: 0,
    allowedModules: ['pos', 'inventory', 'reports'],
    limits: { maxUsers: 3, maxBranches: 1, maxProducts: 500 },
    isActive: true
  },
  {
    code: 'starter',
    name: 'الباقة الأساسية',
    version: '1.0',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    allowedModules: ['pos', 'inventory', 'reports'],
    limits: { maxUsers: 3, maxBranches: 1, maxProducts: 1000 },
    isActive: true
  },
  {
    code: 'business',
    name: 'باقة الأعمال',
    version: '1.0',
    monthlyPrice: 399,
    yearlyPrice: 3990,
    allowedModules: ['pos', 'inventory', 'reports', 'accounting', 'multi_branch'],
    limits: { maxUsers: 10, maxBranches: 3, maxProducts: 10000 },
    isActive: true
  },
  {
    code: 'professional',
    name: 'الباقة الاحترافية',
    version: '1.0',
    monthlyPrice: 699,
    yearlyPrice: 6990,
    allowedModules: ['pos', 'inventory', 'reports', 'accounting', 'multi_branch', 'e_invoicing'],
    limits: { maxUsers: null, maxBranches: 10, maxProducts: null },
    isActive: true
  },
  {
    code: 'enterprise',
    name: 'باقة المؤسسات',
    version: '1.0',
    monthlyPrice: 0,
    yearlyPrice: 0,
    allowedModules: ['pos', 'inventory', 'reports', 'accounting', 'multi_branch', 'e_invoicing'],
    limits: { maxUsers: null, maxBranches: null, maxProducts: null },
    isActive: true
  }
];

/**
 * Idempotent Plan Seeder using MongoDB bulkWrite for maximum performance.
 */
export const seedPlans = async () => {
  console.log('🌱 [Seeder]: Seeding system plans...');

  const bulkOps = defaultPlans.map(plan => ({
    updateOne: {
      filter: { code: plan.code },
      update: { $set: plan },
      upsert: true
    }
  }));

  const result = await Plan.bulkWrite(bulkOps);

  const upsertedCount = result.upsertedCount || 0;
  const modifiedCount = result.modifiedCount || 0;
  const matchedCount = result.matchedCount || 0;
  const skippedCount = Math.max(0, matchedCount - modifiedCount);

  console.log('✔ Plans Seeding Completed:');
  console.log(`   - Created: ${upsertedCount}`);
  console.log(`   - Updated: ${modifiedCount}`);
  console.log(`   - Skipped/Unchanged: ${skippedCount}`);

  return { created: upsertedCount, updated: modifiedCount, skipped: skippedCount };
};
