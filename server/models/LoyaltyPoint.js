import mongoose from 'mongoose';

const loyaltyPointSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['EARN', 'REDEEM', 'ADJUSTMENT'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

loyaltyPointSchema.index({ orgId: 1, customerId: 1, createdAt: -1 });

const LoyaltyPoint = mongoose.models.LoyaltyPoint || mongoose.model('LoyaltyPoint', loyaltyPointSchema);
export default LoyaltyPoint;
