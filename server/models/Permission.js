import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  module: {
    type: String,
    required: true,
    default: 'general'
  },
  description: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);
export default Permission;
