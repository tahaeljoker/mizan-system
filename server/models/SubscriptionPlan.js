import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  priceMonthly: { type: Number, required: true, default: 0 },
  priceYearly: { type: Number, required: true, default: 0 },
  maxUsers: { type: Number, required: true, default: 5 },
  maxBranches: { type: Number, required: true, default: 1 },
  maxProducts: { type: Number, required: true, default: 500 },
  maxStorageMb: { type: Number, required: true, default: 1000 },
  modules: [{ type: String }],
  trialDays: { type: Number, default: 14 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
