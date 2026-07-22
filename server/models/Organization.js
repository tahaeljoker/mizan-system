import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    enum: ['trial', 'starter', 'business', 'pro'],
    default: 'trial'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended'],
    default: 'active'
  },
  trialEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
  },
  subscriptionExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  },
  billingLogs: [
    {
      amount: Number,
      planRequested: String,
      transactionId: String,
      reportedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }
  ]
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
