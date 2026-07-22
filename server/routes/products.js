import express from 'express';
import Product from '../models/Product.js';
import { protect, checkSubscription, authorize } from '../middleware/auth.js';
import { sanitizeBody, injectOrgId, checkOwnership } from '../middleware/tenant.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Apply auth protection & subscription check to all product routes
router.use(protect);
router.use(checkSubscription);

// @route   GET api/products
// @desc    Get all products for the tenant shop
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const products = await Product.find({ orgId: req.user.orgId });
  res.json({ success: true, count: products.length, products });
}));

// @route   POST api/products
// @desc    Add new product (requires Owner/Manager/Warehouse role)
// @access  Private
router.post(
  '/',
  authorize('owner', 'manager', 'warehouse'),
  sanitizeBody(),
  injectOrgId,
  asyncHandler(async (req, res) => {
    const { name, barcode, category, costPrice, sellPrice, wholesalePrice, stock, minStock, unit } = req.body;

    if (!name || sellPrice === undefined || sellPrice === null) {
      return res.status(400).json({ success: false, message: 'من فضلك أدخل الاسم وسعر البيع' });
    }

    const generatedBarcode = barcode || Math.floor(6221000000 + Math.random() * 999999).toString();

    // Check if barcode is already in use within THIS organization
    const productExists = await Product.findOne({ orgId: req.user.orgId, barcode: generatedBarcode });
    if (productExists) {
      return res.status(400).json({ success: false, message: 'الباركود مسجل لمنتج آخر بالفعل' });
    }

    const product = await Product.create({
      ...req.body,
      orgId: req.user.orgId, // Ensure tenant scoping
      barcode: generatedBarcode,
      costPrice: costPrice || 0,
      wholesalePrice: wholesalePrice || 0,
      stock: stock || 0,
      minStock: minStock || 5,
      unit: unit || 'قطعة'
    });

    res.status(201).json({ success: true, product });
  })
);

// @route   PUT api/products/:id
// @desc    Update product details
// @access  Private
router.put(
  '/:id',
  authorize('owner', 'manager', 'warehouse'),
  sanitizeBody(),
  checkOwnership({ Model: Product, param: 'id' }),
  asyncHandler(async (req, res) => {
    // req.resource is pre-validated by checkOwnership to belong to req.user.orgId
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ success: true, product: updatedProduct });
  })
);

// @route   DELETE api/products/:id
// @desc    Delete product
// @access  Private
router.delete(
  '/:id',
  authorize('owner', 'manager'),
  checkOwnership({ Model: Product, param: 'id' }),
  asyncHandler(async (req, res) => {
    await Product.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  })
);

export default router;
