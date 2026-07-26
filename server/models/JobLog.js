import mongoose from 'mongoose';

const jobLogSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  jobName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['RUNNING', 'COMPLETED', 'FAILED'],
    required: true
  },
  durationMs: {
    type: Number,
    default: 0
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    type: String,
    default: null
  }
}, { timestamps: true });

jobLogSchema.index({ jobName: 1, createdAt: -1 });

const JobLog = mongoose.models.JobLog || mongoose.model('JobLog', jobLogSchema);
export default JobLog;
