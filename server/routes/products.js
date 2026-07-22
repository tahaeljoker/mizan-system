import express from 'express';
import Product from '../models/Product.js';
import { protect, checkSubscription, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply auth protection & subscription check to all product routes
router.use(protect);
router.use(checkSubscription);

// @route   GET api/products
// @desc    Get all products for the tenant shop
// @access  Private
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ orgId: req.user.orgId });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب المنتجات' });
  }
});

// @route   POST api/products
// @desc    Add new product (requires Owner/Manager/Warehouse role)
// @access  Private
router.post('/', authorize('owner', 'manager', 'warehouse'), async (req, res) => {
  const { name, barcode, category, costPrice, sellPrice, wholesalePrice, stock, minStock, unit } = req.body;

  if (!name || !sellPrice) {
    return res.status(400).json({ success: false, message: 'من فضلك أدخل الاسم وسعر البيع' });
  }

  try {
    // Check if barcode is already in use in this organization
    const productExists = await Product.findOne({ orgId: req.user.orgId, barcode });
    if (productExists) {
      return res.status(400).json({ success: false, message: 'الباركود مسجل لمنتج آخر بالفعل' });
    }

    const product = await Product.create({
      orgId: req.user.orgId,
      name,
      barcode: barcode || Math.floor(6221000000 + Math.random() * 999999).toString(),
      category,
      costPrice: costPrice || 0,
      sellPrice,
      wholesalePrice: wholesalePrice || 0,
      stock: stock || 0,
      minStock: minStock || 5,
      unit: unit || 'قطعة'
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء إضافة المنتج' });
  }
});

// @route   PUT api/products/:id
// @desc    Update product details
// @access  Private
router.put('/:id', authorize('owner', 'manager', 'warehouse'), async (req, res) => {
  try {
    let product = await Product.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تعديل المنتج' });
  }
});

// @route   DELETE api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', authorize('owner', 'manager'), async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف المنتج' });
  }
});

export default router;
