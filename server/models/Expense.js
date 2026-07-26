import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
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
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'INSTAPAY'],
    default: 'CASH'
  },
  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    default: null
  },
  reference: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  expenseDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

expenseSchema.index({ orgId: 1, expenseDate: -1 });
expenseSchema.index({ orgId: 1, categoryId: 1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export default Expense;
