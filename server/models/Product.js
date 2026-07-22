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
  barcode: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  costPrice: {
    type: Number,
    default: 0
  },
  sellPrice: {
    type: Number,
    required: true
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
  }
}, { timestamps: true });

// Create compound index to ensure barcode is unique per organization
productSchema.index({ orgId: 1, barcode: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
