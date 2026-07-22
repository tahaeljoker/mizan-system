import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    enum: ['trial', 'starter', 'business', 'professional', 'enterprise']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  monthlyPrice: {
    type: Number,
    default: 0
  },
  yearlyPrice: {
    type: Number,
    default: 0
  },
  allowedModules: [{
    type: String,
    enum: ['pos', 'inventory', 'reports', 'accounting', 'multi_branch', 'e_invoicing']
  }],
  limits: {
    maxUsers: {
      type: Number,
      default: 3 // null means unlimited
    },
    maxBranches: {
      type: Number,
      default: 1 // null means unlimited
    },
    maxProducts: {
      type: Number,
      default: 500 // null means unlimited
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
