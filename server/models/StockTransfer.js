import mongoose from 'mongoose';

const stockTransferItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  receivedQuantity: {
    type: Number,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
});

const stockTransferSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  transferNumber: {
    type: String,
    required: true
  },
  fromBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  toBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  status: {
    type: String,
    enum: ['CREATED', 'APPROVED', 'SENT', 'RECEIVED', 'REJECTED'],
    default: 'CREATED'
  },
  items: [stockTransferItemSchema],
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date,
    default: null
  },
  receivedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

stockTransferSchema.index({ orgId: 1, transferNumber: 1 }, { unique: true });
stockTransferSchema.index({ orgId: 1, status: 1, createdAt: -1 });

const StockTransfer = mongoose.models.StockTransfer || mongoose.model('StockTransfer', stockTransferSchema);
export default StockTransfer;
