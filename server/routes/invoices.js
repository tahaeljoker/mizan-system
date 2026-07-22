import express from 'express';
import mongoose from 'mongoose';
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
// @desc    Complete a POS checkout sale, create invoice, and deduct inventory stock atomically
// @access  Private
router.post(
  '/',
  sanitizeBody(),
  injectOrgId,
  asyncHandler(async (req, res) => {
    const { customer, items, discount, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'السلة فارغة، لا توجد منتجات للبيع' });
    }

    const session = await mongoose.startSession();
    let createdInvoice = null;

    try {
      await session.withTransaction(async () => {
        let subtotal = 0;
        const processedItems = [];

        // 1. Validate items and verify stock availability INSIDE the transaction session
        for (const item of items) {
          const itemId = item.id || item._id || item.productId;
          const product = await Product.findOne({ _id: itemId, orgId: req.user.orgId }).session(session);
          
          if (!product) {
            const error = new Error(`المنتج (${item.name || itemId}) غير متوفر في قاعدة البيانات`);
            error.statusCode = 404;
            throw error;
          }

          if (product.stock < item.qty) {
            const error = new Error(`عذراً، الكمية المطلوبة من (${product.name}) غير متوفرة في المخزن. المتاح: ${product.stock}`);
            error.statusCode = 400;
            throw error;
          }

          subtotal += product.sellPrice * item.qty;
          processedItems.push({
            productId: product._id,
            name: product.name,
            qty: item.qty,
            price: product.sellPrice
          });
        }

        const calculatedTotal = Math.max(0, subtotal - (discount || 0));

        // 2. Create the invoice document INSIDE the session
        const [invoice] = await Invoice.create(
          [{
            orgId: req.user.orgId,
            customer: customer || 'عميل نقدي',
            cashier: req.user.name,
            items: processedItems,
            subtotal,
            discount: discount || 0,
            total: calculatedTotal,
            paymentMethod: paymentMethod || 'كاش'
          }],
          { session }
        );

        createdInvoice = invoice;

        // 3. Atomically deduct stock quantities from inventory INSIDE the session
        for (const item of items) {
          const itemId = item.id || item._id || item.productId;
          await Product.findOneAndUpdate(
            { _id: itemId, orgId: req.user.orgId, stock: { $gte: item.qty } },
            { $inc: { stock: -item.qty } },
            { session, runValidators: true }
          );
        }
      });

      res.status(201).json({ success: true, invoice: createdInvoice });
    } finally {
      // Always end session to release DB resources
      await session.endSession();
    }
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
