import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import InventoryTransaction from '../../models/InventoryTransaction.js';
import ActivityLog from '../../models/ActivityLog.js';
import StockCountSession from '../../models/StockCountSession.js';
import StockTransfer from '../../models/StockTransfer.js';

/**
 * Helper: Pagination Response Builder
 */
const buildPaginationResponse = (data, page, limit, totalItems) => {
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

/* ==========================================================================
   1. INVENTORY SESSIONS (STOCK COUNT)
   ========================================================================== */

export const getSessions = async (queryParams, user) => {
  const { search, status, branch, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (status) filter.status = status;
  if (branch && mongoose.Types.ObjectId.isValid(branch)) filter.branchId = branch;
  if (search && search.trim()) {
    filter.$or = [
      { sessionNumber: new RegExp(search.trim(), 'i') },
      { title: new RegExp(search.trim(), 'i') }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [sessions, totalItems] = await Promise.all([
    StockCountSession.find(filter)
      .populate('createdBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    StockCountSession.countDocuments(filter)
  ]);

  return buildPaginationResponse(sessions, pageNum, limitNum, totalItems);
};

export const getSessionById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid session ID format');
    error.statusCode = 400;
    throw error;
  }

  const session = await StockCountSession.findOne({ _id: id, orgId: user.orgId })
    .populate('items.productId', 'name sku barcode sellPrice costPrice stock category unit')
    .populate('createdBy', 'name email role')
    .populate('countedBy', 'name email role')
    .populate('reviewedBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .lean();

  if (!session) {
    const error = new Error('Inventory count session not found');
    error.statusCode = 404;
    throw error;
  }

  return session;
};

export const createSession = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const sessionNumber = `CNT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  let items = [];
  if (data.items && data.items.length > 0) {
    items = data.items.map(item => ({
      productId: item.productId,
      systemQuantity: item.systemQuantity !== undefined ? item.systemQuantity : 0,
      countedQuantity: null,
      variance: 0,
      status: 'PENDING'
    }));
  } else {
    // Automatically load all active products for tenant
    const products = await Product.find({ orgId, isDeleted: { $ne: true } }).lean();
    items = products.map(p => ({
      productId: p._id,
      systemQuantity: p.stock || 0,
      countedQuantity: null,
      variance: 0,
      status: 'PENDING'
    }));
  }

  const session = await StockCountSession.create({
    orgId,
    sessionNumber,
    title: data.title || 'جرد مخزني',
    branchId: data.branchId || null,
    status: 'DRAFT',
    items,
    notes: data.notes || '',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'CREATE_STOCK_SESSION',
    entity: 'StockCountSession',
    entityId: session._id,
    details: { sessionNumber, totalItems: items.length },
    ipAddress: req.ip || ''
  });

  return session;
};

export const updateSession = async (id, data, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid session ID format');
    error.statusCode = 400;
    throw error;
  }

  const session = await StockCountSession.findOne({ _id: id, orgId: user.orgId });
  if (!session) {
    const error = new Error('Inventory session not found');
    error.statusCode = 404;
    throw error;
  }

  if (['APPROVED', 'REJECTED'].includes(session.status)) {
    const error = new Error(`Cannot update session in ${session.status} state`);
    error.statusCode = 400;
    throw error;
  }

  if (data.title !== undefined) session.title = data.title;
  if (data.notes !== undefined) session.notes = data.notes;
  if (data.items) {
    session.items = data.items.map(item => ({
      productId: item.productId,
      systemQuantity: item.systemQuantity !== undefined ? item.systemQuantity : 0,
      countedQuantity: item.countedQuantity !== undefined ? item.countedQuantity : null,
      variance: (item.countedQuantity !== null && item.countedQuantity !== undefined)
        ? (item.countedQuantity - (item.systemQuantity || 0))
        : 0,
      status: item.status || 'PENDING'
    }));
  }

  await session.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'UPDATE_STOCK_SESSION',
    entity: 'StockCountSession',
    entityId: session._id,
    details: { sessionNumber: session.sessionNumber },
    ipAddress: req.ip || ''
  });

  return session;
};

export const deleteSession = async (id, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid session ID format');
    error.statusCode = 400;
    throw error;
  }

  const session = await StockCountSession.findOneAndDelete({ _id: id, orgId: user.orgId });
  if (!session) {
    const error = new Error('Inventory session not found');
    error.statusCode = 404;
    throw error;
  }

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'DELETE_STOCK_SESSION',
    entity: 'StockCountSession',
    entityId: id,
    details: { sessionNumber: session.sessionNumber },
    ipAddress: req.ip || ''
  });

  return true;
};

export const submitBlindCount = async (id, itemsCounted, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid session ID format');
    error.statusCode = 400;
    throw error;
  }

  const session = await StockCountSession.findOne({ _id: id, orgId: user.orgId });
  if (!session) {
    const error = new Error('Inventory session not found');
    error.statusCode = 404;
    throw error;
  }

  if (['APPROVED', 'REJECTED'].includes(session.status)) {
    const error = new Error('Session is already finalized');
    error.statusCode = 400;
    throw error;
  }

  const countMap = new Map();
  itemsCounted.forEach(item => {
    countMap.set(item.productId.toString(), Number(item.countedQuantity));
  });

  session.items.forEach(item => {
    const pId = item.productId.toString();
    if (countMap.has(pId)) {
      const counted = countMap.get(pId);
      item.countedQuantity = counted;
      item.variance = counted - item.systemQuantity;
      item.status = 'COUNTED';
    }
  });

  session.status = 'UNDER_REVIEW';
  session.countedBy = user._id;
  await session.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'COUNT_SUBMITTED',
    entity: 'StockCountSession',
    entityId: session._id,
    details: { sessionNumber: session.sessionNumber, itemCount: itemsCounted.length },
    ipAddress: req.ip || ''
  });

  return session;
};

export const managerReview = async (id, { action, notes, items }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid session ID format');
    error.statusCode = 400;
    throw error;
  }

  const session = await StockCountSession.findOne({ _id: id, orgId: user.orgId });
  if (!session) {
    const error = new Error('Inventory session not found');
    error.statusCode = 404;
    throw error;
  }

  if (action === 'REJECT') {
    session.status = 'REJECTED';
    session.reviewedBy = user._id;
    session.reviewedAt = new Date();
    if (notes) session.notes = `${session.notes}\n[Manager Reject]: ${notes}`;
    await session.save();

    await ActivityLog.create({
      orgId: user.orgId,
      userId: user._id,
      action: 'REJECT_SESSION',
      entity: 'StockCountSession',
      entityId: session._id,
      details: { sessionNumber: session.sessionNumber, action },
      ipAddress: req.ip || ''
    });

    return session;
  }

  if (items && items.length > 0) {
    const itemMap = new Map();
    items.forEach(i => itemMap.set(i.productId.toString(), i));

    session.items.forEach(i => {
      const pId = i.productId.toString();
      if (itemMap.has(pId)) {
        const rev = itemMap.get(pId);
        i.status = rev.status || i.status;
        if (rev.notes) i.notes = rev.notes;
      }
    });
  }

  session.status = 'UNDER_REVIEW';
  session.reviewedBy = user._id;
  session.reviewedAt = new Date();
  if (notes) session.notes = `${session.notes}\n[Manager Review]: ${notes}`;
  await session.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'MANAGER_REVIEW',
    entity: 'StockCountSession',
    entityId: session._id,
    details: { sessionNumber: session.sessionNumber, action },
    ipAddress: req.ip || ''
  });

  return session;
};

export const ownerApproval = async (id, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid session ID format');
    error.statusCode = 400;
    throw error;
  }

  const session = await StockCountSession.findOne({ _id: id, orgId: user.orgId });
  if (!session) {
    const error = new Error('Inventory session not found');
    error.statusCode = 404;
    throw error;
  }

  if (session.status === 'APPROVED') {
    const error = new Error('Session is already approved');
    error.statusCode = 400;
    throw error;
  }

  session.status = 'APPROVED';
  session.approvedBy = user._id;
  session.approvedAt = new Date();
  await session.save();

  // Atomically update Product stocks & create InventoryTransactions
  for (const item of session.items) {
    if (item.countedQuantity !== null && item.countedQuantity !== undefined) {
      const product = await Product.findOne({ _id: item.productId, orgId: user.orgId });
      if (product) {
        const previousStock = product.stock;
        const newStock = item.countedQuantity;
        const variance = newStock - previousStock;

        product.stock = newStock;
        await product.save();

        await InventoryTransaction.create({
          orgId: user.orgId,
          productId: product._id,
          branchId: session.branchId,
          type: 'STOCKTAKE',
          quantity: variance,
          previousStock,
          newStock,
          reason: `اعتماد جرد مخزني رقم ${session.sessionNumber}`,
          reference: session.sessionNumber,
          referenceType: 'STOCK_COUNT_SESSION',
          createdBy: user._id
        });
      }
    }
  }

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'OWNER_APPROVAL',
    entity: 'StockCountSession',
    entityId: session._id,
    details: { sessionNumber: session.sessionNumber },
    ipAddress: req.ip || ''
  });

  return session;
};

export const rejectSession = async (id, reason, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid session ID format');
    error.statusCode = 400;
    throw error;
  }

  const session = await StockCountSession.findOne({ _id: id, orgId: user.orgId });
  if (!session) {
    const error = new Error('Inventory session not found');
    error.statusCode = 404;
    throw error;
  }

  session.status = 'REJECTED';
  if (reason) session.notes = `${session.notes}\n[Rejected]: ${reason}`;
  await session.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'REJECT_SESSION',
    entity: 'StockCountSession',
    entityId: session._id,
    details: { sessionNumber: session.sessionNumber, reason },
    ipAddress: req.ip || ''
  });

  return session;
};

/* ==========================================================================
   2. MANUAL STOCK ADJUSTMENT & REPORTS
   ========================================================================== */

export const manualAdjustment = async ({ productId, branchId, quantity, type, reason, reference }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error('Invalid product ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const product = await Product.findOne({ _id: productId, orgId, isDeleted: { $ne: true } });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  let quantityChange = 0;
  const qty = Number(quantity);

  switch (type) {
    case 'PURCHASE':
    case 'RETURN':
    case 'TRANSFER_IN':
      quantityChange = Math.abs(qty);
      break;
    case 'SALE':
    case 'TRANSFER_OUT':
      quantityChange = -Math.abs(qty);
      break;
    case 'ADJUSTMENT':
      quantityChange = qty;
      break;
    case 'STOCKTAKE':
      quantityChange = qty - product.stock;
      break;
    default:
      quantityChange = qty;
      break;
  }

  const previousStock = product.stock;
  const newStock = previousStock + quantityChange;

  if (newStock < 0) {
    const error = new Error(`Stock cannot be negative. Current stock is ${previousStock}, change requested is ${quantityChange}`);
    error.statusCode = 400;
    throw error;
  }

  product.stock = newStock;
  product.updatedBy = user._id;
  await product.save();

  const transaction = await InventoryTransaction.create({
    orgId,
    productId: product._id,
    branchId: branchId || product.branchId || null,
    type,
    quantity: quantityChange,
    previousStock,
    newStock,
    reason: reason || '',
    reference: reference || '',
    referenceType: 'MANUAL_ADJUSTMENT',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'STOCK_ADJUSTMENT',
    entity: 'Product',
    entityId: product._id,
    details: { productName: product.name, type, previousStock, newStock, quantityChange },
    ipAddress: req.ip || ''
  });

  return { product, transaction };
};

export const getHistory = async (queryParams, user) => {
  const { product, branch, date, transactionType, user: filterUser, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (product && mongoose.Types.ObjectId.isValid(product)) filter.productId = product;
  if (branch && mongoose.Types.ObjectId.isValid(branch)) filter.branchId = branch;
  if (filterUser && mongoose.Types.ObjectId.isValid(filterUser)) filter.createdBy = filterUser;
  if (transactionType) filter.type = transactionType;

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [history, totalItems] = await Promise.all([
    InventoryTransaction.find(filter)
      .populate('productId', 'name sku barcode category unit')
      .populate('branchId', 'name code')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    InventoryTransaction.countDocuments(filter)
  ]);

  return buildPaginationResponse(history, pageNum, limitNum, totalItems);
};

export const getLowStock = async (queryParams, user) => {
  const { page = 1, limit = 20 } = queryParams;
  const orgId = user.orgId;
  const filter = {
    orgId,
    isDeleted: { $ne: true },
    $expr: { $lte: ['$stock', '$minStock'] }
  };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, totalItems] = await Promise.all([
    Product.find(filter)
      .sort('stock')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  return buildPaginationResponse(products, pageNum, limitNum, totalItems);
};

export const getOutOfStock = async (queryParams, user) => {
  const { page = 1, limit = 20 } = queryParams;
  const orgId = user.orgId;
  const filter = {
    orgId,
    isDeleted: { $ne: true },
    stock: { $lte: 0 }
  };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, totalItems] = await Promise.all([
    Product.find(filter)
      .sort('name')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  return buildPaginationResponse(products, pageNum, limitNum, totalItems);
};

/* ==========================================================================
   3. BRANCH STOCK TRANSFERS
   ========================================================================== */

export const getTransfers = async (queryParams, user) => {
  const { search, status, fromBranch, toBranch, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (status) filter.status = status;
  if (fromBranch && mongoose.Types.ObjectId.isValid(fromBranch)) filter.fromBranchId = fromBranch;
  if (toBranch && mongoose.Types.ObjectId.isValid(toBranch)) filter.toBranchId = toBranch;
  if (search && search.trim()) {
    filter.transferNumber = new RegExp(search.trim(), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [transfers, totalItems] = await Promise.all([
    StockTransfer.find(filter)
      .populate('fromBranchId', 'name code')
      .populate('toBranchId', 'name code')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('receivedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    StockTransfer.countDocuments(filter)
  ]);

  return buildPaginationResponse(transfers, pageNum, limitNum, totalItems);
};

export const getTransferById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid transfer ID format');
    error.statusCode = 400;
    throw error;
  }

  const transfer = await StockTransfer.findOne({ _id: id, orgId: user.orgId })
    .populate('fromBranchId', 'name code')
    .populate('toBranchId', 'name code')
    .populate('items.productId', 'name sku barcode category unit stock')
    .populate('createdBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .populate('receivedBy', 'name email role')
    .lean();

  if (!transfer) {
    const error = new Error('Stock transfer not found');
    error.statusCode = 404;
    throw error;
  }

  return transfer;
};

export const createTransfer = async ({ fromBranchId, toBranchId, items, notes }, user, req = {}) => {
  if (fromBranchId.toString() === toBranchId.toString()) {
    const error = new Error('Sending and receiving branches cannot be the same');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const transferNumber = `TRF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const transferItems = items.map(item => ({
    productId: item.productId,
    quantity: Math.max(1, Number(item.quantity)),
    receivedQuantity: null,
    notes: item.notes || ''
  }));

  const transfer = await StockTransfer.create({
    orgId,
    transferNumber,
    fromBranchId,
    toBranchId,
    status: 'CREATED',
    items: transferItems,
    notes: notes || '',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'TRANSFER_CREATED',
    entity: 'StockTransfer',
    entityId: transfer._id,
    details: { transferNumber, itemCount: transferItems.length },
    ipAddress: req.ip || ''
  });

  return transfer;
};

export const approveTransfer = async (id, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid transfer ID format');
    error.statusCode = 400;
    throw error;
  }

  const transfer = await StockTransfer.findOne({ _id: id, orgId: user.orgId });
  if (!transfer) {
    const error = new Error('Stock transfer not found');
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status !== 'CREATED') {
    const error = new Error(`Cannot approve transfer in status ${transfer.status}`);
    error.statusCode = 400;
    throw error;
  }

  transfer.status = 'APPROVED';
  transfer.approvedBy = user._id;
  transfer.approvedAt = new Date();
  await transfer.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'TRANSFER_APPROVED',
    entity: 'StockTransfer',
    entityId: transfer._id,
    details: { transferNumber: transfer.transferNumber },
    ipAddress: req.ip || ''
  });

  return transfer;
};

export const receiveTransfer = async (id, { items, notes }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid transfer ID format');
    error.statusCode = 400;
    throw error;
  }

  const transfer = await StockTransfer.findOne({ _id: id, orgId: user.orgId });
  if (!transfer) {
    const error = new Error('Stock transfer not found');
    error.statusCode = 404;
    throw error;
  }

  if (['RECEIVED', 'REJECTED'].includes(transfer.status)) {
    const error = new Error(`Transfer is already ${transfer.status}`);
    error.statusCode = 400;
    throw error;
  }

  const receivedMap = new Map();
  if (items && items.length > 0) {
    items.forEach(i => receivedMap.set(i.productId.toString(), Number(i.receivedQuantity)));
  }

  // Atomically update stock & create InventoryTransactions for sending and receiving branches
  for (const item of transfer.items) {
    const pId = item.productId.toString();
    const qtyReceived = receivedMap.has(pId) ? receivedMap.get(pId) : item.quantity;
    item.receivedQuantity = qtyReceived;

    const product = await Product.findOne({ _id: item.productId, orgId: user.orgId });
    if (product) {
      const currentStock = product.stock;

      // 1. Transaction for Sending Branch (TRANSFER_OUT)
      await InventoryTransaction.create({
        orgId: user.orgId,
        productId: product._id,
        branchId: transfer.fromBranchId,
        type: 'TRANSFER_OUT',
        quantity: -item.quantity,
        previousStock: currentStock,
        newStock: Math.max(0, currentStock - item.quantity),
        reason: `تحويل مخزني صادر برقم ${transfer.transferNumber}`,
        reference: transfer.transferNumber,
        referenceType: 'STOCK_TRANSFER',
        createdBy: user._id
      });

      // 2. Transaction for Receiving Branch (TRANSFER_IN)
      await InventoryTransaction.create({
        orgId: user.orgId,
        productId: product._id,
        branchId: transfer.toBranchId,
        type: 'TRANSFER_IN',
        quantity: qtyReceived,
        previousStock: currentStock,
        newStock: currentStock + qtyReceived,
        reason: `تحويل مخزني وارد برقم ${transfer.transferNumber}`,
        reference: transfer.transferNumber,
        referenceType: 'STOCK_TRANSFER',
        createdBy: user._id
      });
    }
  }

  transfer.status = 'RECEIVED';
  transfer.receivedBy = user._id;
  transfer.receivedAt = new Date();
  if (notes) transfer.notes = `${transfer.notes}\n[Received Notes]: ${notes}`;
  await transfer.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'TRANSFER_RECEIVED',
    entity: 'StockTransfer',
    entityId: transfer._id,
    details: { transferNumber: transfer.transferNumber },
    ipAddress: req.ip || ''
  });

  return transfer;
};

export const rejectTransfer = async (id, reason, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid transfer ID format');
    error.statusCode = 400;
    throw error;
  }

  const transfer = await StockTransfer.findOne({ _id: id, orgId: user.orgId });
  if (!transfer) {
    const error = new Error('Stock transfer not found');
    error.statusCode = 404;
    throw error;
  }

  transfer.status = 'REJECTED';
  if (reason) transfer.notes = `${transfer.notes}\n[Reject Reason]: ${reason}`;
  await transfer.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'TRANSFER_REJECTED',
    entity: 'StockTransfer',
    entityId: transfer._id,
    details: { transferNumber: transfer.transferNumber, reason },
    ipAddress: req.ip || ''
  });

  return transfer;
};
