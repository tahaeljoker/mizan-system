import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
    default: 'TRIAL'
  },
  billingCycle: {
    type: String,
    enum: ['MONTHLY', 'YEARLY'],
    default: 'MONTHLY'
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

subscriptionSchema.index({ orgId: 1, status: 1 });

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
