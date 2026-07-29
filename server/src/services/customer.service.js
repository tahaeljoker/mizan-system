import mongoose from 'mongoose';
import Customer from '../../models/Customer.js';
import CustomerTransaction from '../../models/CustomerTransaction.js';
import LoyaltyPoint from '../../models/LoyaltyPoint.js';
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

export const getCustomers = async (queryParams, user) => {
  const { search, status, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId, isDeleted: { $ne: true } };

  if (status) filter.status = status;
  if (search && search.trim()) {
    const sRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: sRegex },
      { phone: sRegex },
      { email: sRegex },
      { barcode: sRegex },
      { nationalId: sRegex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [customers, totalItems] = await Promise.all([
    Customer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Customer.countDocuments(filter)
  ]);

  return buildPagination(customers, pageNum, limitNum, totalItems);
};

export const getCustomerById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid customer ID format');
    error.statusCode = 400;
    throw error;
  }

  const customer = await Customer.findOne({ _id: id, orgId: user.orgId, isDeleted: { $ne: true } }).lean();
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  return customer;
};

export const createCustomer = async (data, user, req = {}) => {
  const orgId = user.orgId;

  // Check duplicate phone if provided
  if (data.phone && data.phone.trim()) {
    const existingPhone = await Customer.findOne({ orgId, phone: data.phone.trim(), isDeleted: { $ne: true } });
    if (existingPhone) {
      const error = new Error(`Customer with phone '${data.phone.trim()}' already exists`);
      error.statusCode = 400;
      throw error;
    }
  }

  const openingBalance = data.openingBalance || 0;

  const customer = await Customer.create({
    ...data,
    orgId,
    balance: openingBalance,
    createdBy: user._id,
    status: data.status || 'active'
  });

  if (openingBalance !== 0) {
    await CustomerTransaction.create({
      orgId,
      customerId: customer._id,
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
    action: 'CUSTOMER_CREATED',
    entity: 'Customer',
    entityId: customer._id,
    details: { name: customer.name, phone: customer.phone },
    ipAddress: req.ip || ''
  });

  return customer;
};

export const updateCustomer = async (id, data, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid customer ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const customer = await Customer.findOne({ _id: id, orgId, isDeleted: { $ne: true } });
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.phone && data.phone.trim() && data.phone.trim() !== customer.phone) {
    const existingPhone = await Customer.findOne({
      _id: { $ne: id },
      orgId,
      phone: data.phone.trim(),
      isDeleted: { $ne: true }
    });
    if (existingPhone) {
      const error = new Error(`Customer with phone '${data.phone.trim()}' already exists`);
      error.statusCode = 400;
      throw error;
    }
    customer.phone = data.phone.trim();
  }

  if (data.name !== undefined) customer.name = data.name;
  if (data.email !== undefined) customer.email = data.email;
  if (data.barcode !== undefined) customer.barcode = data.barcode;
  if (data.nationalId !== undefined) customer.nationalId = data.nationalId;
  if (data.address !== undefined) customer.address = data.address;
  if (data.creditLimit !== undefined) customer.creditLimit = data.creditLimit;
  if (data.status !== undefined) customer.status = data.status;

  customer.updatedBy = user._id;
  await customer.save();

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'CUSTOMER_UPDATED',
    entity: 'Customer',
    entityId: customer._id,
    details: { name: customer.name },
    ipAddress: req.ip || ''
  });

  return customer;
};

export const deleteCustomer = async (id, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid customer ID format');
    error.statusCode = 400;
    throw error;
  }

  const customer = await Customer.findOneAndUpdate(
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

  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'CUSTOMER_DELETED',
    entity: 'Customer',
    entityId: id,
    details: { name: customer.name },
    ipAddress: req.ip || ''
  });

  return true;
};

export const settleDebt = async (id, { amount, type = 'PAYMENT', reference = '', notes = '' }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid customer ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const customer = await Customer.findOne({ _id: id, orgId, isDeleted: { $ne: true } });
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const payAmount = Number(amount);
  const balanceBefore = customer.balance;
  const balanceAfter = balanceBefore - payAmount;

  customer.balance = balanceAfter;
  customer.updatedBy = user._id;
  await customer.save();

  const transaction = await CustomerTransaction.create({
    orgId,
    customerId: customer._id,
    amount: payAmount,
    balanceBefore,
    balanceAfter,
    type: type || 'PAYMENT',
    reference: reference || notes || 'تسوية حساسة',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'CUSTOMER_SETTLEMENT',
    entity: 'Customer',
    entityId: customer._id,
    details: { amount: payAmount, balanceBefore, balanceAfter },
    ipAddress: req.ip || ''
  });

  return { customer, transaction };
};

export const getStatement = async (id, queryParams, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid customer ID format');
    error.statusCode = 400;
    throw error;
  }

  const { page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;

  const customer = await Customer.findOne({ _id: id, orgId, isDeleted: { $ne: true } });
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, totalItems] = await Promise.all([
    CustomerTransaction.find({ orgId, customerId: id })
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    CustomerTransaction.countDocuments({ orgId, customerId: id })
  ]);

  return {
    customer: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      balance: customer.balance,
      creditLimit: customer.creditLimit
    },
    ...buildPagination(transactions, pageNum, limitNum, totalItems)
  };
};

export const updateLoyalty = async (id, { points, type, description = '' }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid customer ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const customer = await Customer.findOne({ _id: id, orgId, isDeleted: { $ne: true } });
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const pts = Number(points);
  let pointsDelta = pts;
  if (type === 'REDEEM') {
    pointsDelta = -Math.abs(pts);
    if (customer.loyaltyPoints + pointsDelta < 0) {
      const error = new Error(`Insufficient loyalty points. Current points: ${customer.loyaltyPoints}`);
      error.statusCode = 400;
      throw error;
    }
  } else if (type === 'EARN') {
    pointsDelta = Math.abs(pts);
  }

  const previousPoints = customer.loyaltyPoints;
  const newPoints = (type === 'ADJUSTMENT') ? pts : (previousPoints + pointsDelta);

  customer.loyaltyPoints = Math.max(0, newPoints);
  customer.updatedBy = user._id;
  await customer.save();

  const loyaltyLog = await LoyaltyPoint.create({
    orgId,
    customerId: customer._id,
    points: pointsDelta,
    type,
    description,
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'LOYALTY_UPDATED',
    entity: 'Customer',
    entityId: customer._id,
    details: { type, pointsDelta, previousPoints, newPoints: customer.loyaltyPoints },
    ipAddress: req.ip || ''
  });

  return { customer, loyaltyLog };
};
