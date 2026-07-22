import express from 'express';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { protect, checkSubscription } from '../middleware/auth.js';
import { sanitizeBody, injectOrgId, checkOwnership } from '../middleware/tenant.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);

// @route   GET api/invoices
// @desc    Get all invoices for this shop
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ orgId: req.user.orgId }).sort({ createdAt: -1 });
  res.json({ success: true, count: invoices.length, invoices });
}));

// @route   POST api/invoices
// @desc    Complete a POS checkout sale, create invoice, and deduct inventory stock
// @access  Private
router.post(
  '/',
  sanitizeBody(),
  injectOrgId,
  asyncHandler(async (req, res) => {
    const { customer, items, discount, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'السلة فارغة، لا توجد منتجات للبيع' });
    }

    let subtotal = 0;

    // 1. Validate items and check tenant-scoped stock
    for (const item of items) {
      const itemId = item.id || item._id || item.productId;
      const product = await Product.findOne({ _id: itemId, orgId: req.user.orgId });
      
      if (!product) {
        return res.status(404).json({ success: false, message: `المنتج (${item.name || itemId}) غير متوفر في قاعدة البيانات` });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({ 
          success: false, 
          message: `عذراً، الكمية المطلوبة من (${product.name}) غير متوفرة في المخزن. المتاح: ${product.stock}` 
        });
      }

      subtotal += product.sellPrice * item.qty;
    }

    const calculatedTotal = Math.max(0, subtotal - (discount || 0));

    // 2. Create the tenant-scoped invoice
    const invoice = await Invoice.create({
      orgId: req.user.orgId,
      customer: customer || 'عميل نقدي',
      cashier: req.user.name,
      items: items.map(item => ({
        productId: item.id || item._id || item.productId,
        name: item.name,
        qty: item.qty,
        price: item.price || item.sellPrice
      })),
      subtotal,
      discount: discount || 0,
      total: calculatedTotal,
      paymentMethod: paymentMethod || 'كاش'
    });

    // 3. Deduct stock quantities from inventory within tenant boundary
    for (const item of items) {
      const itemId = item.id || item._id || item.productId;
      await Product.findOneAndUpdate(
        { _id: itemId, orgId: req.user.orgId },
        { $inc: { stock: -item.qty } }
      );
    }

    res.status(201).json({ success: true, invoice });
  })
);

// @route   PUT api/invoices/:id
// @desc    Update invoice (e.g., status, items list, total for refunds)
// @access  Private
router.put(
  '/:id',
  sanitizeBody(),
  checkOwnership({ Model: Invoice, param: 'id' }),
  asyncHandler(async (req, res) => {
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ success: true, invoice: updatedInvoice });
  })
);

export default router;
