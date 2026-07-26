import mongoose from 'mongoose';

const stockCountItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  systemQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  countedQuantity: {
    type: Number,
    default: null
  },
  variance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'COUNTED', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    default: ''
  }
});

const stockCountSessionSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  sessionNumber: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'جرد مخزني'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  status: {
    type: String,
    enum: ['DRAFT', 'COUNTING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'DRAFT'
  },
  items: [stockCountItemSchema],
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  countedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

stockCountSessionSchema.index({ orgId: 1, sessionNumber: 1 }, { unique: true });
stockCountSessionSchema.index({ orgId: 1, status: 1, createdAt: -1 });

const StockCountSession = mongoose.models.StockCountSession || mongoose.model('StockCountSession', stockCountSessionSchema);
export default StockCountSession;
