import mongoose from 'mongoose';
import Supplier from '../../models/Supplier.js';
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

export const getSuppliers = async (queryParams, user) => {
  const { search, status, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId, isDeleted: { $ne: true } };

  if (status) filter.status = status;
  if (search && search.trim()) {
    const sRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { company: sRegex },
      { contactPerson: sRegex },
      { phone: sRegex },
      { taxNumber: sRegex },
      { email: sRegex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [suppliers, totalItems] = await Promise.all([
    Supplier.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Supplier.countDocuments(filter)
  ]);

  return buildPagination(suppliers, pageNum, limitNum, totalItems);
};

export const getSupplierById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid supplier ID format');
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findOne({ _id: id, orgId: user.orgId, isDeleted: { $ne: true } }).lean();
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  return supplier;
};

export const createSupplier = async (data, user, req = {}) => {
  const orgId = user.orgId;

  if (data.phone && data.phone.trim()) {
    const existingPhone = await Supplier.findOne({ orgId, phone: data.phone.trim(), isDeleted: { $ne: true } });
    if (existingPhone) {
      const error = new Error(`Supplier with phone '${data.phone.trim()}' already exists`);
      error.statusCode = 400;
      throw error;
    }
  }

  const openingBalance = data.openingBalance || 0;

  const supplier = await Supplier.create({
    ...data,
    orgId,
    balance: openingBalance,
    createdBy: user._id,
    status: data.status || 'active'
  });

  if (openingBalance !== 0) {
    await SupplierTransaction.create({
      orgId,
      supplierId: supplier._id,
      amount: openingBalance,
      balanceBefore: 0,
      balanceAfter: openingBalance,
      type: 'ADJUSTMENT',
      reference: 'OPENING_BALANCE',
      createdBy: user._id
    });
  }

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'SUPPLIER_CREATED',
    entity: 'Supplier',
    entityId: supplier._id,
    details: { company: supplier.company, phone: supplier.phone },
    ipAddress: req.ip || ''
  });

  return supplier;
};

export const updateSupplier = async (id, data, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid supplier ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const supplier = await Supplier.findOne({ _id: id, orgId, isDeleted: { $ne: true } });
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.phone && data.phone.trim() && data.phone.trim() !== supplier.phone) {
    const existingPhone = await Supplier.findOne({
      _id: { $ne: id },
      orgId,
      phone: data.phone.trim(),
      isDeleted: { $ne: true }
    });
    if (existingPhone) {
      const error = new Error(`Supplier with phone '${data.phone.trim()}' already exists`);
      error.statusCode = 400;
      throw error;
    }
    supplier.phone = data.phone.trim();
  }

  if (data.company !== undefined) supplier.company = data.company;
  if (data.contactPerson !== undefined) supplier.contactPerson = data.contactPerson;
  if (data.email !== undefined) supplier.email = data.email;
  if (data.taxNumber !== undefined) supplier.taxNumber = data.taxNumber;
  if (data.address !== undefined) supplier.address = data.address;
  if (data.status !== undefined) supplier.status = data.status;

  supplier.updatedBy = user._id;
  await supplier.save();

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'SUPPLIER_UPDATED',
    entity: 'Supplier',
    entityId: supplier._id,
    details: { company: supplier.company },
    ipAddress: req.ip || ''
  });

  return supplier;
};

export const deleteSupplier = async (id, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid supplier ID format');
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findOneAndUpdate(
    { _id: id, orgId: user.orgId, isDeleted: { $ne: true } },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user._id,
        status: 'deleted'
      }
    },
    { new: true }
  );

  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'SUPPLIER_DELETED',
    entity: 'Supplier',
    entityId: id,
    details: { company: supplier.company },
    ipAddress: req.ip || ''
  });

  return true;
};

export const settleDebt = async (id, { amount, type = 'PAYMENT', reference = '', notes = '' }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid supplier ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const supplier = await Supplier.findOne({ _id: id, orgId, isDeleted: { $ne: true } });
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  const payAmount = Number(amount);
  const balanceBefore = supplier.balance;
  const balanceAfter = balanceBefore - payAmount;

  supplier.balance = balanceAfter;
  supplier.updatedBy = user._id;
  await supplier.save();

  const transaction = await SupplierTransaction.create({
    orgId,
    supplierId: supplier._id,
    amount: payAmount,
    balanceBefore,
    balanceAfter,
    type: type || 'PAYMENT',
    reference: reference || notes || 'سداد مستحقات للمورد',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'SUPPLIER_SETTLEMENT',
    entity: 'Supplier',
    entityId: supplier._id,
    details: { amount: payAmount, balanceBefore, balanceAfter },
    ipAddress: req.ip || ''
  });

  return { supplier, transaction };
};

export const getStatement = async (id, queryParams, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid supplier ID format');
    error.statusCode = 400;
    throw error;
  }

  const { page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;

  const supplier = await Supplier.findOne({ _id: id, orgId, isDeleted: { $ne: true } });
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, totalItems] = await Promise.all([
    SupplierTransaction.find({ orgId, supplierId: id })
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    SupplierTransaction.countDocuments({ orgId, supplierId: id })
  ]);

  return {
    supplier: {
      id: supplier._id,
      company: supplier.company,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      balance: supplier.balance
    },
    ...buildPagination(transactions, pageNum, limitNum, totalItems)
  };
};
