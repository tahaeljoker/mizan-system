import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  iban: {
    type: String,
    default: ''
  },
  swiftCode: {
    type: String,
    default: ''
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'EGP'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

bankAccountSchema.index({ orgId: 1, accountNumber: 1 }, { unique: true });

const BankAccount = mongoose.models.BankAccount || mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;
