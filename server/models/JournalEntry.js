import mongoose from 'mongoose';

const journalItemSchema = new mongoose.Schema({
  accountCode: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  debit: {
    type: Number,
    default: 0
  },
  credit: {
    type: Number,
    default: 0
  },
  memo: {
    type: String,
    default: ''
  }
});

const journalEntrySchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  entryNumber: {
    type: String,
    required: true
  },
  entryDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  reference: {
    type: String,
    default: ''
  },
  referenceType: {
    type: String,
    default: ''
  },
  totalDebit: {
    type: Number,
    required: true,
    default: 0
  },
  totalCredit: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'POSTED', 'CANCELLED'],
    default: 'POSTED'
  },
  items: [journalItemSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

journalEntrySchema.index({ orgId: 1, entryNumber: 1 }, { unique: true });
journalEntrySchema.index({ orgId: 1, entryDate: -1 });

const JournalEntry = mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
