import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  key: {
    type: String,
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  seq: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

counterSchema.index({ orgId: 1, key: 1, branchId: 1 }, { unique: true });

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
export default Counter;
