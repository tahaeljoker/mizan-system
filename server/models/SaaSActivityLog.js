import mongoose from 'mongoose';

const saasActivityLogSchema = new mongoose.Schema({
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetOrgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const SaaSActivityLog = mongoose.models.SaaSActivityLog || mongoose.model('SaaSActivityLog', saasActivityLogSchema);
export default SaaSActivityLog;
