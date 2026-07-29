import mongoose from 'mongoose';

const supplierTransactionSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
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
    enum: ['PURCHASE', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'PURCHASE_ORDER'],
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

supplierTransactionSchema.index({ orgId: 1, supplierId: 1, createdAt: -1 });

const SupplierTransaction = mongoose.models.SupplierTransaction || mongoose.model('SupplierTransaction', supplierTransactionSchema);
export default SupplierTransaction;
