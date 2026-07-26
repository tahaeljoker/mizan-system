import mongoose from 'mongoose';

const systemBackupSchema = new mongoose.Schema({
  backupName: { type: String, required: true },
  sizeMb: { type: Number, default: 0 },
  type: {
    type: String,
    enum: ['MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY'],
    default: 'MANUAL'
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  },
  storageUrl: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const SystemBackup = mongoose.models.SystemBackup || mongoose.model('SystemBackup', systemBackupSchema);
export default SystemBackup;
