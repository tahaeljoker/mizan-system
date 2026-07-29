import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  type: {
    type: String,
    enum: [
      'PURCHASE_ORDER',
      'EXPENSE',
      'STOCK_ADJUSTMENT',
      'BANK_TRANSFER',
      'MANUAL_JOURNAL',
      'PRICE_CHANGE',
      'DISCOUNT_OVERRIDE',
      'DELETE_PRODUCT',
      'DELETE_CUSTOMER',
      'DELETE_SUPPLIER',
      'DELETE_EXPENSE'
    ],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  },
  reason: {
    type: String,
    default: ''
  },
  comments: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

approvalRequestSchema.index({ orgId: 1, status: 1, createdAt: -1 });
approvalRequestSchema.index({ orgId: 1, requestedBy: 1 });

const ApprovalRequest = mongoose.models.ApprovalRequest || mongoose.model('ApprovalRequest', approvalRequestSchema);
export default ApprovalRequest;
