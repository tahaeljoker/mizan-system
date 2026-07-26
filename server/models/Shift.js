import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shiftNumber: {
    type: String,
    required: true
  },
  openingCash: {
    type: Number,
    required: true,
    default: 0
  },
  closingCash: {
    type: Number,
    default: null
  },
  expectedCash: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalCash: {
    type: Number,
    default: 0
  },
  totalCard: {
    type: Number,
    default: 0
  },
  totalInstaPay: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN'
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

shiftSchema.index({ orgId: 1, userId: 1, status: 1 });

const Shift = mongoose.models.Shift || mongoose.model('Shift', shiftSchema);
export default Shift;
