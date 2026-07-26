import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isSystem: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
export default Role;
