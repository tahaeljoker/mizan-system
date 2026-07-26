import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true,
    default: ''
  },
  barcode: {
    type: String,
    required: true,
    trim: true
  },
  alternateBarcodes: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    default: '',
    trim: true
  },
  costPrice: {
    type: Number,
    default: 0
  },
  sellPrice: {
    type: Number,
    required: true,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  minStock: {
    type: Number,
    default: 5
  },
  unit: {
    type: String,
    default: 'قطعة'
  },
  image: {
    type: String,
    default: null
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'deleted'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// Virtual alias for minimumStock
productSchema.virtual('minimumStock').get(function() {
  return this.minStock;
});

// Indexes for high performance queries
productSchema.index({ orgId: 1, barcode: 1 });
productSchema.index({ orgId: 1, sku: 1 });
productSchema.index({ orgId: 1, category: 1 });
productSchema.index({ orgId: 1, brand: 1 });
productSchema.index({ orgId: 1, isDeleted: 1, status: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
