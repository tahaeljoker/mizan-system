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
  expectedCash: {
    type: Number,
    default: 0
  },
  actualCash: {
    type: Number,
    default: null
  },
  difference: {
    type: Number,
    default: 0
  },
  reconciliationStatus: {
    type: String,
    enum: ['SHORT', 'OVER', 'BALANCED'],
    default: 'BALANCED'
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalInvoices: {
    type: Number,
    default: 0
  },
  totalReturns: {
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
  totalInstapay: {
    type: Number,
    default: 0
  },
  totalDebt: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
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
shiftSchema.index({ orgId: 1, shiftNumber: 1 }, { unique: true });

const Shift = mongoose.models.Shift || mongoose.model('Shift', shiftSchema);
export default Shift;
