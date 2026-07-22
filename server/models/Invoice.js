import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  customer: {
    type: String,
    default: 'عميل نقدي'
  },
  cashier: {
    type: String,
    required: true
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      qty: Number,
      price: Number
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['كاش', 'كارت', 'انستا باي'],
    default: 'كاش'
  },
  status: {
    type: String,
    enum: ['completed', 'refunded'],
    default: 'completed'
  }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
