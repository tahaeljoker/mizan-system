import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  unit: { type: String, default: 'قطعة' },
  quantity: { type: Number, required: true, min: 0.001 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  refundedQuantity: { type: Number, default: 0, min: 0 }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['CASH', 'CARD', 'INSTAPAY', 'DEBT', 'CREDIT'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  reference: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now }
});

const saleSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    default: null
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  items: [saleItemSchema],
  payments: [paymentSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, required: true, default: 0 },
  dueAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['COMPLETED', 'HELD', 'PARTIAL_REFUND', 'REFUNDED', 'CANCELLED'],
    default: 'COMPLETED'
  },
  notes: { type: String, default: '' },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

saleSchema.index({ orgId: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ orgId: 1, createdAt: -1 });
saleSchema.index({ orgId: 1, customerId: 1 });
saleSchema.index({ orgId: 1, status: 1 });

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
export default Sale;
