import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  barcode: {
    type: String,
    default: '',
    trim: true
  },
  nationalId: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: ''
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

customerSchema.index({ orgId: 1, phone: 1 });
customerSchema.index({ orgId: 1, barcode: 1 });
customerSchema.index({ orgId: 1, isDeleted: 1 });

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export default Customer;
