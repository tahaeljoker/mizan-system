import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, required: true, min: 0.001 },
  unitPrice: { type: Number, required: true, min: 0 },
  refundAmount: { type: Number, required: true, min: 0 }
});

const returnSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  returnNumber: {
    type: String,
    required: true
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  items: [returnItemSchema],
  totalRefundAmount: {
    type: Number,
    required: true
  },
  refundMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'INSTAPAY', 'CUSTOMER_BALANCE'],
    default: 'CASH'
  },
  reason: { type: String, default: '' },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

returnSchema.index({ orgId: 1, returnNumber: 1 }, { unique: true });
returnSchema.index({ orgId: 1, saleId: 1 });

const Return = mongoose.models.Return || mongoose.model('Return', returnSchema);
export default Return;
