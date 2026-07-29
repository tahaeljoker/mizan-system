import mongoose from 'mongoose';

const customerTransactionSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['SALE', 'PAYMENT', 'REFUND', 'SETTLEMENT', 'ADJUSTMENT'],
    required: true
  },
  reference: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

customerTransactionSchema.index({ orgId: 1, customerId: 1, createdAt: -1 });

const CustomerTransaction = mongoose.models.CustomerTransaction || mongoose.model('CustomerTransaction', customerTransactionSchema);
export default CustomerTransaction;
