import mongoose from 'mongoose';
import Sale from '../../models/Sale.js';
import Return from '../../models/Return.js';
import Product from '../../models/Product.js';
import Customer from '../../models/Customer.js';
import CustomerTransaction from '../../models/CustomerTransaction.js';
import LoyaltyPoint from '../../models/LoyaltyPoint.js';
import InventoryTransaction from '../../models/InventoryTransaction.js';
import ActivityLog from '../../models/ActivityLog.js';

const buildPagination = (data, page, limit, totalItems) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
};

/**
 * Auto-generate sequential invoice number: INV-000001, INV-000002...
 */
export const generateInvoiceNumber = async (orgId) => {
  const lastSale = await Sale.findOne({ orgId, invoiceNumber: /^INV-\d+$/ })
    .sort({ createdAt: -1 })
    .lean();

  let nextSeq = 1;
  if (lastSale && lastSale.invoiceNumber) {
    const match = lastSale.invoiceNumber.match(/^INV-(\d+)$/);
    if (match && match[1]) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const seqStr = nextSeq.toString().padStart(6, '0');
  return `INV-${seqStr}`;
};

export const createSale = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const cashierId = user._id;

  if (!data.items || data.items.length === 0) {
    const error = new Error('Sale must contain at least one item');
    error.statusCode = 400;
    throw error;
  }

  // Step 1: Validate stock for all items
  const processedItems = [];
  let calculatedSubtotal = 0;

  for (const item of data.items) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      const error = new Error(`Invalid product ID format: ${item.productId}`);
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findOne({ _id: item.productId, orgId, isDeleted: { $ne: true } });
    if (!product) {
      const error = new Error(`Product not found: ${item.productId}`);
      error.statusCode = 404;
      throw error;
    }

    const qty = Number(item.quantity);
    if (product.stock < qty) {
      const error = new Error(`Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${qty}`);
      error.statusCode = 400;
      throw error;
    }

    const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.sellPrice;
    const discount = Number(item.discount || 0);
    const total = Math.max(0, (qty * unitPrice) - discount);

    calculatedSubtotal += total;

    processedItems.push({
      productId: product._id,
      name: product.name,
      unit: product.unit || 'قطعة',
      quantity: qty,
      unitPrice,
      discount,
      total,
      productRef: product
    });
  }

  const overallDiscount = Number(data.discount || 0);
  const tax = Number(data.tax || 0);
  const totalAmount = Math.max(0, calculatedSubtotal - overallDiscount + tax);

  // Step 2: Handle Payments & Calculate Debt
  let payments = data.payments || [];
  let paidAmount = 0;
  let debtAmount = 0;

  payments.forEach(p => {
    paidAmount += Number(p.amount || 0);
    if (p.method === 'DEBT') {
      debtAmount += Number(p.amount || 0);
    }
  });

  // If paidAmount is less than totalAmount, the remainder is treated as DEBT
  const remainingDue = totalAmount - paidAmount;
  if (remainingDue > 0.01) {
    debtAmount += remainingDue;
    payments.push({
      method: 'DEBT',
      amount: remainingDue,
      reference: 'أجل / آجل'
    });
    paidAmount += remainingDue;
  }

  // If there is debt amount, customerId must be provided
  let customer = null;
  if (debtAmount > 0 || data.customerId) {
    if (data.customerId) {
      if (!mongoose.Types.ObjectId.isValid(data.customerId)) {
        const error = new Error('Invalid customer ID format');
        error.statusCode = 400;
        throw error;
      }
      customer = await Customer.findOne({ _id: data.customerId, orgId, isDeleted: { $ne: true } });
      if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
      }
    } else if (debtAmount > 0) {
      const error = new Error('Customer must be selected for debt/credit sales');
      error.statusCode = 400;
      throw error;
    }
  }

  // Step 3: Generate Invoice Number
  const invoiceNumber = await generateInvoiceNumber(orgId);

  // Step 4: Decrease stock and record InventoryTransaction
  for (const item of processedItems) {
    const product = item.productRef;
    const previousStock = product.stock;
    const newStock = previousStock - item.quantity;

    product.stock = newStock;
    await product.save();

    await InventoryTransaction.create({
      orgId,
      productId: product._id,
      branchId: data.branchId || product.branchId || user.branchId || null,
      type: 'SALE',
      quantity: -item.quantity,
      previousStock,
      newStock,
      reason: `عملية بيع بفاتورة رقم ${invoiceNumber}`,
      reference: invoiceNumber,
      referenceType: 'SALE_INVOICE',
      createdBy: cashierId
    });
  }

  // Step 5: Update Customer Debt & Ledger if applicable
  if (customer && debtAmount > 0) {
    const balanceBefore = customer.balance;
    const balanceAfter = balanceBefore + debtAmount;

    customer.balance = balanceAfter;
    customer.updatedBy = cashierId;
    await customer.save();

    await CustomerTransaction.create({
      orgId,
      customerId: customer._id,
      amount: debtAmount,
      balanceBefore,
      balanceAfter,
      type: 'SALE',
      reference: invoiceNumber,
      createdBy: cashierId
    });
  }

  // Step 6: Calculate Loyalty Points if Customer attached
  if (customer) {
    const pointsEarned = Math.floor(totalAmount / 10); // 1 point per 10 currency units
    if (pointsEarned > 0) {
      customer.loyaltyPoints += pointsEarned;
      await customer.save();

      await LoyaltyPoint.create({
        orgId,
        customerId: customer._id,
        points: pointsEarned,
        type: 'EARN',
        description: `نقاط مكتسبة من الفاتورة رقم ${invoiceNumber}`,
        createdBy: cashierId
      });
    }
  }

  // Step 7: Save Sale Document
  const sale = await Sale.create({
    orgId,
    invoiceNumber,
    branchId: data.branchId || user.branchId || null,
    shiftId: data.shiftId || null,
    customerId: customer ? customer._id : null,
    items: processedItems.map(i => ({
      productId: i.productId,
      name: i.name,
      unit: i.unit,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount,
      total: i.total
    })),
    payments,
    subtotal: calculatedSubtotal,
    discount: overallDiscount,
    tax,
    totalAmount,
    paidAmount,
    dueAmount: debtAmount,
    status: 'COMPLETED',
    notes: data.notes || '',
    cashierId,
    createdBy: cashierId
  });

  // Step 8: Activity Log
  await ActivityLog.create({
    orgId,
    userId: cashierId,
    action: 'SALE_CREATED',
    entity: 'Sale',
    entityId: sale._id,
    details: { invoiceNumber, totalAmount, paidAmount, customerName: customer?.name || 'عميل نقدي' },
    ipAddress: req.ip || ''
  });

  return getSaleById(sale._id, user);
};

export const holdSale = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const invoiceNumber = `INV-HELD-${Date.now()}`;

  let calculatedSubtotal = 0;
  const items = (data.items || []).map(item => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.unitPrice || 0);
    const disc = Number(item.discount || 0);
    const total = Math.max(0, (qty * price) - disc);
    calculatedSubtotal += total;
    return {
      productId: item.productId,
      name: item.name || 'منتج',
      unit: item.unit || 'قطعة',
      quantity: qty,
      unitPrice: price,
      discount: disc,
      total
    };
  });

  const sale = await Sale.create({
    orgId,
    invoiceNumber,
    branchId: data.branchId || user.branchId || null,
    customerId: data.customerId || null,
    items,
    payments: [],
    subtotal: calculatedSubtotal,
    totalAmount: calculatedSubtotal,
    paidAmount: 0,
    dueAmount: calculatedSubtotal,
    status: 'HELD',
    notes: data.notes || 'فاتورة معلقة',
    cashierId: user._id,
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'SALE_HELD',
    entity: 'Sale',
    entityId: sale._id,
    details: { invoiceNumber, totalAmount: calculatedSubtotal },
    ipAddress: req.ip || ''
  });

  return sale;
};

export const resumeSale = async (id, data, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid sale ID format');
    error.statusCode = 400;
    throw error;
  }

  const heldSale = await Sale.findOne({ _id: id, orgId: user.orgId, status: 'HELD' });
  if (!heldSale) {
    const error = new Error('Held sale invoice not found');
    error.statusCode = 404;
    throw error;
  }

  // Merge items from payload or held sale
  const itemsToProcess = (data.items && data.items.length > 0) ? data.items : heldSale.items.map(i => ({
    productId: i.productId.toString(),
    name: i.name,
    unit: i.unit,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    discount: i.discount
  }));

  const completePayload = {
    ...data,
    items: itemsToProcess,
    customerId: data.customerId || (heldSale.customerId ? heldSale.customerId.toString() : null)
  };

  const completedSale = await createSale(completePayload, user, req);

  // Remove held invoice
  await Sale.deleteOne({ _id: heldSale._id });

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'SALE_RESUMED',
    entity: 'Sale',
    entityId: completedSale._id,
    details: { newInvoiceNumber: completedSale.invoiceNumber },
    ipAddress: req.ip || ''
  });

  return completedSale;
};

export const refundSale = async (id, { items, refundMethod = 'CASH', reason = '' }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid sale ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const sale = await Sale.findOne({ _id: id, orgId });

  if (!sale) {
    const error = new Error('Sale invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (['HELD', 'CANCELLED'].includes(sale.status)) {
    const error = new Error(`Cannot refund sale in ${sale.status} state`);
    error.statusCode = 400;
    throw error;
  }

  const itemMap = new Map();
  items.forEach(i => itemMap.set(i.productId.toString(), Number(i.quantity)));

  let totalRefundAmount = 0;
  const returnItems = [];

  for (const item of sale.items) {
    const pId = item.productId.toString();
    if (itemMap.has(pId)) {
      const qtyToRefund = itemMap.get(pId);
      const remainingRefundable = item.quantity - item.refundedQuantity;

      if (qtyToRefund > remainingRefundable) {
        const error = new Error(`Cannot refund ${qtyToRefund} for product '${item.name}'. Maximum refundable quantity is ${remainingRefundable}`);
        error.statusCode = 400;
        throw error;
      }

      const itemRefundValue = qtyToRefund * item.unitPrice;
      totalRefundAmount += itemRefundValue;
      item.refundedQuantity += qtyToRefund;

      returnItems.push({
        productId: item.productId,
        quantity: qtyToRefund,
        unitPrice: item.unitPrice,
        refundAmount: itemRefundValue
      });

      // Increase product stock & create InventoryTransaction
      const product = await Product.findOne({ _id: item.productId, orgId });
      if (product) {
        const previousStock = product.stock;
        const newStock = previousStock + qtyToRefund;

        product.stock = newStock;
        await product.save();

        await InventoryTransaction.create({
          orgId,
          productId: product._id,
          branchId: sale.branchId || product.branchId || null,
          type: 'RETURN',
          quantity: qtyToRefund,
          previousStock,
          newStock,
          reason: `مرتجع مبيعات للفاتورة رقم ${sale.invoiceNumber}`,
          reference: sale.invoiceNumber,
          referenceType: 'SALE_RETURN',
          createdBy: user._id
        });
      }
    }
  }

  if (returnItems.length === 0) {
    const error = new Error('No valid items specified for refund');
    error.statusCode = 400;
    throw error;
  }

  // Handle Customer Ledger if customer attached & refund method is CUSTOMER_BALANCE
  if (sale.customerId && refundMethod === 'CUSTOMER_BALANCE') {
    const customer = await Customer.findOne({ _id: sale.customerId, orgId });
    if (customer) {
      const balanceBefore = customer.balance;
      const balanceAfter = balanceBefore - totalRefundAmount;

      customer.balance = balanceAfter;
      customer.updatedBy = user._id;
      await customer.save();

      await CustomerTransaction.create({
        orgId,
        customerId: customer._id,
        amount: totalRefundAmount,
        balanceBefore,
        balanceAfter,
        type: 'REFUND',
        reference: sale.invoiceNumber,
        createdBy: user._id
      });
    }
  }

  // Determine new sale status (PARTIAL_REFUND or REFUNDED)
  const isFullyRefunded = sale.items.every(i => i.refundedQuantity >= i.quantity);
  sale.status = isFullyRefunded ? 'REFUNDED' : 'PARTIAL_REFUND';
  await sale.save();

  const returnNumber = `RET-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  const returnRecord = await Return.create({
    orgId,
    returnNumber,
    saleId: sale._id,
    invoiceNumber: sale.invoiceNumber,
    customerId: sale.customerId,
    items: returnItems,
    totalRefundAmount,
    refundMethod,
    reason: reason || 'مرتجع مبيعات',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'SALE_REFUNDED',
    entity: 'Sale',
    entityId: sale._id,
    details: { invoiceNumber: sale.invoiceNumber, returnNumber, totalRefundAmount, status: sale.status },
    ipAddress: req.ip || ''
  });

  return { sale, returnRecord };
};

export const cancelSale = async (id, reason = '', user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid sale ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const sale = await Sale.findOne({ _id: id, orgId });

  if (!sale) {
    const error = new Error('Sale invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (sale.status === 'CANCELLED') {
    const error = new Error('Sale invoice is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  // Restore stock for unrefunded quantities
  for (const item of sale.items) {
    const remainingQty = item.quantity - item.refundedQuantity;
    if (remainingQty > 0) {
      const product = await Product.findOne({ _id: item.productId, orgId });
      if (product) {
        const previousStock = product.stock;
        const newStock = previousStock + remainingQty;

        product.stock = newStock;
        await product.save();

        await InventoryTransaction.create({
          orgId,
          productId: product._id,
          branchId: sale.branchId || product.branchId || null,
          type: 'RETURN',
          quantity: remainingQty,
          previousStock,
          newStock,
          reason: `إلغاء فاتورة مبيعات رقم ${sale.invoiceNumber}`,
          reference: sale.invoiceNumber,
          referenceType: 'SALE_CANCEL',
          createdBy: user._id
        });
      }
    }
  }

  // Revert customer debt if customer attached
  if (sale.customerId && sale.dueAmount > 0) {
    const customer = await Customer.findOne({ _id: sale.customerId, orgId });
    if (customer) {
      const balanceBefore = customer.balance;
      const balanceAfter = Math.max(0, balanceBefore - sale.dueAmount);

      customer.balance = balanceAfter;
      customer.updatedBy = user._id;
      await customer.save();

      await CustomerTransaction.create({
        orgId,
        customerId: customer._id,
        amount: sale.dueAmount,
        balanceBefore,
        balanceAfter,
        type: 'ADJUSTMENT',
        reference: `إلغاء الفاتورة ${sale.invoiceNumber}`,
        createdBy: user._id
      });
    }
  }

  sale.status = 'CANCELLED';
  if (reason) sale.notes = `${sale.notes}\n[Cancelled]: ${reason}`;
  await sale.save();

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'SALE_CANCELLED',
    entity: 'Sale',
    entityId: sale._id,
    details: { invoiceNumber: sale.invoiceNumber, reason },
    ipAddress: req.ip || ''
  });

  return sale;
};

export const getSales = async (queryParams, user) => {
  const { search, status, customer, cashier, branch, paymentMethod, dateFrom, dateTo, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (status) filter.status = status;
  if (customer && mongoose.Types.ObjectId.isValid(customer)) filter.customerId = customer;
  if (cashier && mongoose.Types.ObjectId.isValid(cashier)) filter.cashierId = cashier;
  if (branch && mongoose.Types.ObjectId.isValid(branch)) filter.branchId = branch;

  if (paymentMethod) {
    filter['payments.method'] = paymentMethod;
  }

  if (search && search.trim()) {
    filter.invoiceNumber = new RegExp(search.trim(), 'i');
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [sales, totalItems] = await Promise.all([
    Sale.find(filter)
      .populate('customerId', 'name phone email')
      .populate('cashierId', 'name email role')
      .populate('branchId', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Sale.countDocuments(filter)
  ]);

  return buildPagination(sales, pageNum, limitNum, totalItems);
};

export const getSaleById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid sale ID format');
    error.statusCode = 400;
    throw error;
  }

  const sale = await Sale.findOne({ _id: id, orgId: user.orgId })
    .populate('customerId', 'name phone email barcode creditLimit balance loyaltyPoints')
    .populate('cashierId', 'name email role')
    .populate('branchId', 'name code')
    .populate('items.productId', 'name sku barcode sellPrice category unit')
    .lean();

  if (!sale) {
    const error = new Error('Sale invoice not found');
    error.statusCode = 404;
    throw error;
  }

  return sale;
};

export const getSaleByInvoiceNumber = async (invoiceNumber, user) => {
  const sale = await Sale.findOne({ invoiceNumber, orgId: user.orgId })
    .populate('customerId', 'name phone email barcode creditLimit balance loyaltyPoints')
    .populate('cashierId', 'name email role')
    .populate('branchId', 'name code')
    .populate('items.productId', 'name sku barcode sellPrice category unit')
    .lean();

  if (!sale) {
    const error = new Error(`Invoice '${invoiceNumber}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return sale;
};

export const getHistory = async (queryParams, user) => {
  return getSales(queryParams, user);
};

export const getDailySummary = async (queryParams, user) => {
  const orgId = user.orgId;
  const { date, dateFrom, dateTo, branch } = queryParams;

  const filter = { orgId, status: { $ne: 'CANCELLED' } };

  if (branch && mongoose.Types.ObjectId.isValid(branch)) {
    filter.branchId = branch;
  }

  const targetDate = date ? new Date(date) : new Date();
  const start = dateFrom ? new Date(dateFrom) : new Date(targetDate.setHours(0, 0, 0, 0));
  const end = dateTo ? new Date(dateTo) : new Date(targetDate.setHours(23, 59, 59, 999));

  filter.createdAt = { $gte: start, $lte: end };

  const sales = await Sale.find(filter).lean();

  let salesCount = 0;
  let totalRevenue = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalInstaPay = 0;
  let totalDebt = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const cashierSalesMap = new Map();

  sales.forEach(sale => {
    if (sale.status === 'HELD') return;

    salesCount++;
    totalRevenue += sale.totalAmount;
    totalDiscount += sale.discount || 0;
    totalTax += sale.tax || 0;
    totalDebt += sale.dueAmount || 0;

    sale.payments.forEach(p => {
      if (p.method === 'CASH') totalCash += p.amount;
      if (p.method === 'CARD') totalCard += p.amount;
      if (p.method === 'INSTAPAY') totalInstaPay += p.amount;
    });

    const cId = sale.cashierId ? sale.cashierId.toString() : 'unknown';
    cashierSalesMap.set(cId, (cashierSalesMap.get(cId) || 0) + sale.totalAmount);
  });

  // Calculate Returns / Refunds total for the period
  const returns = await Return.find({
    orgId,
    createdAt: { $gte: start, $lte: end }
  }).lean();

  let totalRefunds = 0;
  returns.forEach(r => {
    totalRefunds += r.totalRefundAmount;
  });

  const netSales = totalRevenue - totalRefunds;
  const averageSale = salesCount > 0 ? (totalRevenue / salesCount) : 0;

  // Determine Top Cashier
  let topCashierId = null;
  let maxSalesVolume = 0;
  for (const [cashierId, volume] of cashierSalesMap.entries()) {
    if (volume > maxSalesVolume) {
      maxSalesVolume = volume;
      topCashierId = cashierId;
    }
  }

  return {
    period: { start, end },
    salesCount,
    totalRevenue,
    totalCash,
    totalCard,
    totalInstaPay,
    totalDebt,
    totalRefunds,
    totalDiscount,
    totalTax,
    netSales,
    averageSale,
    topCashier: { cashierId: topCashierId, volume: maxSalesVolume }
  };
};
