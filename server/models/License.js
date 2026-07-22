import mongoose from 'mongoose';

const licenseSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  type: {
    type: String,
    enum: ['trial', 'subscription', 'lifetime', 'enterprise'],
    default: 'trial'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'cancelled'],
    default: 'active'
  },
  startsAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  },
  trialEndsAt: {
    type: Date,
    default: null
  },
  activatedAt: {
    type: Date,
    default: null
  },
  renewedAt: {
    type: Date,
    default: null
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  offlineAllowed: {
    type: Boolean,
    default: false
  },
  licenseKey: {
    type: String,
    default: null
  },
  issuedBy: {
    type: String,
    default: 'SYSTEM'
  },
  provider: {
    type: String,
    enum: ['manual', 'stripe', 'paymob', 'fawry', 'instapay', 'offline_key'],
    default: 'manual'
  },
  providerSubscriptionId: {
    type: String,
    default: null
  },
  providerCustomerId: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Optimized Frequent Indexes
licenseSchema.index({ orgId: 1, status: 1 });
licenseSchema.index({ licenseKey: 1 }, { unique: true, sparse: true });
licenseSchema.index({ expiresAt: 1 });

const License = mongoose.model('License', licenseSchema);
export default License;
