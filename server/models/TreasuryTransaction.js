import mongoose from 'mongoose';

const treasuryTransactionSchema = new mongoose.Schema({
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
  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    default: null
  },
  type: {
    type: String,
    enum: ['SALE', 'PURCHASE', 'EXPENSE', 'PAYMENT', 'RECEIPT', 'TRANSFER', 'ADJUSTMENT', 'DEPOSIT', 'WITHDRAW'],
    required: true
  },
  direction: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'INSTAPAY', 'CUSTOMER_BALANCE'],
    default: 'CASH'
  },
  reference: {
    type: String,
    default: ''
  },
  referenceType: {
    type: String,
    default: ''
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

treasuryTransactionSchema.index({ orgId: 1, createdAt: -1 });
treasuryTransactionSchema.index({ orgId: 1, type: 1 });

const TreasuryTransaction = mongoose.models.TreasuryTransaction || mongoose.model('TreasuryTransaction', treasuryTransactionSchema);
export default TreasuryTransaction;
