import mongoose from 'mongoose';
import PurchaseOrder from '../../models/PurchaseOrder.js';
import Product from '../../models/Product.js';
import Supplier from '../../models/Supplier.js';
import InventoryTransaction from '../../models/InventoryTransaction.js';
import SupplierTransaction from '../../models/SupplierTransaction.js';
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

export const getPurchaseOrders = async (queryParams, user) => {
  const { search, status, supplier, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (status) filter.status = status;
  if (supplier && mongoose.Types.ObjectId.isValid(supplier)) filter.supplierId = supplier;
  if (search && search.trim()) {
    filter.purchaseOrderNumber = new RegExp(search.trim(), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [orders, totalItems] = await Promise.all([
    PurchaseOrder.find(filter)
      .populate('supplierId', 'company phone taxNumber')
      .populate('branchId', 'name code')
      .populate('createdBy', 'name email')
      .populate('receivedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    PurchaseOrder.countDocuments(filter)
  ]);

  return buildPagination(orders, pageNum, limitNum, totalItems);
};

export const getPurchaseOrderById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid purchase order ID format');
    error.statusCode = 400;
    throw error;
  }

  const order = await PurchaseOrder.findOne({ _id: id, orgId: user.orgId })
    .populate('supplierId', 'company contactPerson phone email taxNumber address balance')
    .populate('branchId', 'name code')
    .populate('items.productId', 'name sku barcode sellPrice costPrice stock category unit')
    .populate('createdBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .populate('receivedBy', 'name email role')
    .lean();

  if (!order) {
    const error = new Error('Purchase order not found');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

export const createPurchaseOrder = async (data, user, req = {}) => {
  const orgId = user.orgId;

  if (!mongoose.Types.ObjectId.isValid(data.supplierId)) {
    const error = new Error('Invalid supplier ID format');
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findOne({ _id: data.supplierId, orgId, isDeleted: { $ne: true } });
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  let totalAmount = 0;
  const items = data.items.map(item => {
    const qty = Math.max(1, Number(item.quantity));
    const cost = Math.max(0, Number(item.costPrice));
    totalAmount += qty * cost;
    return {
      productId: item.productId,
      quantity: qty,
      costPrice: cost,
      receivedQuantity: 0
    };
  });

  const order = await PurchaseOrder.create({
    orgId,
    purchaseOrderNumber: poNumber,
    supplierId: supplier._id,
    branchId: data.branchId || user.branchId || null,
    status: 'DRAFT',
    items,
    totalAmount,
    notes: data.notes || '',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'PURCHASE_ORDER_CREATED',
    entity: 'PurchaseOrder',
    entityId: order._id,
    details: { purchaseOrderNumber: poNumber, totalAmount, itemCount: items.length },
    ipAddress: req.ip || ''
  });

  return order;
};

export const updatePurchaseOrder = async (id, data, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid purchase order ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const order = await PurchaseOrder.findOne({ _id: id, orgId });

  if (!order) {
    const error = new Error('Purchase order not found');
    error.statusCode = 404;
    throw error;
  }

  if (['RECEIVED', 'CANCELLED'].includes(order.status)) {
    const error = new Error(`Cannot update purchase order in ${order.status} state`);
    error.statusCode = 400;
    throw error;
  }

  if (data.notes !== undefined) order.notes = data.notes;
  if (data.items && data.items.length > 0) {
    let totalAmount = 0;
    order.items = data.items.map(item => {
      const qty = Math.max(1, Number(item.quantity));
      const cost = Math.max(0, Number(item.costPrice));
      totalAmount += qty * cost;
      return {
        productId: item.productId,
        quantity: qty,
        costPrice: cost,
        receivedQuantity: item.receivedQuantity || 0
      };
    });
    order.totalAmount = totalAmount;
  }

  await order.save();

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'PURCHASE_ORDER_UPDATED',
    entity: 'PurchaseOrder',
    entityId: order._id,
    details: { purchaseOrderNumber: order.purchaseOrderNumber },
    ipAddress: req.ip || ''
  });

  return order;
};

export const deletePurchaseOrder = async (id, user, req = {}) => {
  return cancelPurchaseOrder(id, 'Deleted by user', user, req);
};

export const receivePurchaseOrder = async (id, { items, notes }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid purchase order ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const order = await PurchaseOrder.findOne({ _id: id, orgId });

  if (!order) {
    const error = new Error('Purchase order not found');
    error.statusCode = 404;
    throw error;
  }

  if (['RECEIVED', 'CANCELLED'].includes(order.status)) {
    const error = new Error(`Purchase order is already ${order.status}`);
    error.statusCode = 400;
    throw error;
  }

  const receivedMap = new Map();
  if (items && items.length > 0) {
    items.forEach(i => receivedMap.set(i.productId.toString(), Number(i.receivedQuantity)));
  }

  let totalReceivedValue = 0;

  // Atomically update product stock and create InventoryTransaction records
  for (const item of order.items) {
    const pId = item.productId.toString();
    const qtyToReceive = receivedMap.has(pId) ? receivedMap.get(pId) : item.quantity;
    item.receivedQuantity = qtyToReceive;
    totalReceivedValue += qtyToReceive * item.costPrice;

    if (qtyToReceive > 0) {
      const product = await Product.findOne({ _id: item.productId, orgId });
      if (product) {
        const previousStock = product.stock;
        const newStock = previousStock + qtyToReceive;

        product.stock = newStock;
        product.costPrice = item.costPrice; // Update cost price to latest received cost
        await product.save();

        await InventoryTransaction.create({
          orgId,
          productId: product._id,
          branchId: order.branchId || product.branchId || null,
          type: 'PURCHASE',
          quantity: qtyToReceive,
          previousStock,
          newStock,
          reason: `استلام أمر شراء رقم ${order.purchaseOrderNumber}`,
          reference: order.purchaseOrderNumber,
          referenceType: 'PURCHASE_ORDER',
          createdBy: user._id
        });
      }
    }
  }

  // Update Supplier balance & create SupplierTransaction ledger entry
  const supplier = await Supplier.findOne({ _id: order.supplierId, orgId });
  if (supplier) {
    const balanceBefore = supplier.balance;
    const balanceAfter = balanceBefore + totalReceivedValue;

    supplier.balance = balanceAfter;
    supplier.updatedBy = user._id;
    await supplier.save();

    await SupplierTransaction.create({
      orgId,
      supplierId: supplier._id,
      amount: totalReceivedValue,
      balanceBefore,
      balanceAfter,
      type: 'PURCHASE_ORDER',
      reference: order.purchaseOrderNumber,
      createdBy: user._id
    });
  }

  order.status = 'RECEIVED';
  order.receivedBy = user._id;
  order.receivedAt = new Date();
  if (notes) order.notes = `${order.notes}\n[Received Notes]: ${notes}`;
  await order.save();

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'PURCHASE_ORDER_RECEIVED',
    entity: 'PurchaseOrder',
    entityId: order._id,
    details: { purchaseOrderNumber: order.purchaseOrderNumber, totalReceivedValue },
    ipAddress: req.ip || ''
  });

  return order;
};

export const cancelPurchaseOrder = async (id, reason = '', user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid purchase order ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const order = await PurchaseOrder.findOne({ _id: id, orgId });

  if (!order) {
    const error = new Error('Purchase order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.status === 'RECEIVED') {
    const error = new Error('Cannot cancel an already received purchase order');
    error.statusCode = 400;
    throw error;
  }

  order.status = 'CANCELLED';
  if (reason) order.notes = `${order.notes}\n[Cancelled]: ${reason}`;
  await order.save();

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'PURCHASE_ORDER_CANCELLED',
    entity: 'PurchaseOrder',
    entityId: order._id,
    details: { purchaseOrderNumber: order.purchaseOrderNumber, reason },
    ipAddress: req.ip || ''
  });

  return order;
};
