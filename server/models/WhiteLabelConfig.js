import mongoose from 'mongoose';

const whiteLabelConfigSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true
  },
  logoUrl: { type: String, default: '' },
  primaryColor: { type: String, default: '#4f46e5' },
  secondaryColor: { type: String, default: '#7c3aed' },
  systemName: { type: String, default: 'مِدار ERP' },
  invoiceFooter: { type: String, default: 'شكراً لتسوقكم معنا!' },
  customDomain: { type: String, default: '' }
}, { timestamps: true });

const WhiteLabelConfig = mongoose.models.WhiteLabelConfig || mongoose.model('WhiteLabelConfig', whiteLabelConfigSchema);
export default WhiteLabelConfig;
