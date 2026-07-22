import express from 'express';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { protect, checkSubscription } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);

// @route   GET api/invoices
// @desc    Get all invoices for this shop
// @access  Private
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find({ orgId: req.user.orgId }).sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحميل الفواتير' });
  }
});

// @route   POST api/invoices
// @desc    Complete a POS checkout sale, create invoice, and deduct inventory stock
// @access  Private
router.post('/', async (req, res) => {
  const { customer, items, discount, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'السلة فارغة، لا توجد منتجات للبيع' });
  }

  try {
    let subtotal = 0;

    // 1. Validate items and calculate subtotal
    for (const item of items) {
      const product = await Product.findOne({ _id: item.id, orgId: req.user.orgId });
      if (!product) {
        return res.status(404).json({ success: false, message: `المنتج ${item.name} غير متوفر في قاعدة البيانات` });
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

    // 2. Create the invoice
    const invoice = await Invoice.create({
      orgId: req.user.orgId,
      customer: customer || 'عميل نقدي',
      cashier: req.user.name,
      items: items.map(item => ({
        productId: item.id,
        name: item.name,
        qty: item.qty,
        price: item.sellPrice
      })),
      subtotal,
      discount: discount || 0,
      total: calculatedTotal,
      paymentMethod: paymentMethod || 'كاش'
    });

    // 3. Deduct stock quantities from inventory
    for (const item of items) {
      await Product.findOneAndUpdate(
        { _id: item.id, orgId: req.user.orgId },
        { $inc: { stock: -item.qty } }
      );
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('POS sale processing error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في النظام أثناء معالجة عملية البيع' });
  }
});

// @route   PUT api/invoices/:id
// @desc    Update invoice (e.g., status, items list, total for refunds)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { $set: req.body },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Invoice update error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الفاتورة' });
  }
});

export default router;
