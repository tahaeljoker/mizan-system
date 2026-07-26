import mongoose from 'mongoose';
import Shift from '../../models/Shift.js';
import Sale from '../../models/Sale.js';
import Return from '../../models/Return.js';
import User from '../../models/User.js';
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
 * Generate sequential shift number: SHIFT-000001, SHIFT-000002...
 */
export const generateShiftNumber = async (orgId) => {
  const lastShift = await Shift.findOne({ orgId, shiftNumber: /^SHIFT-\d+$/ })
    .sort({ createdAt: -1 })
    .lean();

  let nextSeq = 1;
  if (lastShift && lastShift.shiftNumber) {
    const match = lastShift.shiftNumber.match(/^SHIFT-(\d+)$/);
    if (match && match[1]) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const seqStr = nextSeq.toString().padStart(6, '0');
  return `SHIFT-${seqStr}`;
};

/**
 * Dynamically calculate sales, payments, returns, and cash totals for a shift
 */
export const calculateShiftTotals = async (shift) => {
  const orgId = shift.orgId;
  const cashierId = shift.userId;
  const openedAt = shift.openedAt;
  const closedAt = shift.closedAt || new Date();

  // Find all completed/held sales during shift
  const sales = await Sale.find({
    orgId,
    cashierId,
    status: { $ne: 'CANCELLED' },
    createdAt: { $gte: openedAt, $lte: closedAt }
  }).lean();

  // Find all returns during shift
  const returns = await Return.find({
    orgId,
    createdBy: cashierId,
    createdAt: { $gte: openedAt, $lte: closedAt }
  }).lean();

  let totalSales = 0;
  let totalInvoices = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalInstapay = 0;
  let totalDebt = 0;

  sales.forEach(sale => {
    if (sale.status === 'HELD') return;

    totalInvoices++;
    totalSales += sale.totalAmount;
    totalDebt += sale.dueAmount || 0;

    sale.payments.forEach(p => {
      if (p.method === 'CASH') totalCash += p.amount;
      if (p.method === 'CARD') totalCard += p.amount;
      if (p.method === 'INSTAPAY') totalInstapay += p.amount;
    });
  });

  let totalReturns = 0;
  let cashRefunds = 0;

  returns.forEach(r => {
    totalReturns += r.totalRefundAmount;
    if (r.refundMethod === 'CASH') {
      cashRefunds += r.totalRefundAmount;
    }
  });

  const netCashFromSales = totalCash - cashRefunds;
  const expectedCash = shift.openingCash + netCashFromSales;

  return {
    totalSales,
    totalInvoices,
    totalReturns,
    totalCash: netCashFromSales,
    totalCard,
    totalInstapay,
    totalDebt,
    expectedCash
  };
};

export const openShift = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const userId = user._id;

  // Rule: Only ONE open shift per cashier
  const existingOpenShift = await Shift.findOne({ orgId, userId, status: 'OPEN' });
  if (existingOpenShift) {
    const error = new Error('An active shift is already open for this user. Please close your current shift first.');
    error.statusCode = 400;
    throw error;
  }

  const shiftNumber = await generateShiftNumber(orgId);
  const openingCash = Number(data.openingCash || 0);

  const shift = await Shift.create({
    orgId,
    branchId: data.branchId || user.branchId || null,
    userId,
    shiftNumber,
    openingCash,
    expectedCash: openingCash,
    notes: data.notes || '',
    status: 'OPEN',
    openedAt: new Date()
  });

  await ActivityLog.create({
    orgId,
    userId,
    action: 'SHIFT_OPENED',
    entity: 'Shift',
    entityId: shift._id,
    details: { shiftNumber, openingCash },
    ipAddress: req.ip || ''
  });

  return shift;
};

export const getCurrentShift = async (user) => {
  const orgId = user.orgId;
  const userId = user._id;

  const shift = await Shift.findOne({ orgId, userId, status: 'OPEN' })
    .populate('userId', 'name email role')
    .populate('branchId', 'name code');

  if (!shift) {
    const error = new Error('No active open shift found for current user');
    error.statusCode = 404;
    throw error;
  }

  const totals = await calculateShiftTotals(shift);

  shift.totalSales = totals.totalSales;
  shift.totalInvoices = totals.totalInvoices;
  shift.totalReturns = totals.totalReturns;
  shift.totalCash = totals.totalCash;
  shift.totalCard = totals.totalCard;
  shift.totalInstapay = totals.totalInstapay;
  shift.totalDebt = totals.totalDebt;
  shift.expectedCash = totals.expectedCash;

  await shift.save();

  return shift;
};

export const getShiftById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid shift ID format');
    error.statusCode = 400;
    throw error;
  }

  const shift = await Shift.findOne({ _id: id, orgId: user.orgId })
    .populate('userId', 'name email role')
    .populate('branchId', 'name code');

  if (!shift) {
    const error = new Error('Shift record not found');
    error.statusCode = 404;
    throw error;
  }

  const totals = await calculateShiftTotals(shift);
  shift.totalSales = totals.totalSales;
  shift.totalInvoices = totals.totalInvoices;
  shift.totalReturns = totals.totalReturns;
  shift.totalCash = totals.totalCash;
  shift.totalCard = totals.totalCard;
  shift.totalInstapay = totals.totalInstapay;
  shift.totalDebt = totals.totalDebt;
  if (shift.status === 'OPEN') {
    shift.expectedCash = totals.expectedCash;
  }

  return shift;
};

export const closeShift = async (id, { actualCash, notes }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid shift ID format');
    error.statusCode = 400;
    throw error;
  }

  const shift = await Shift.findOne({ _id: id, orgId: user.orgId });

  if (!shift) {
    const error = new Error('Shift record not found');
    error.statusCode = 404;
    throw error;
  }

  if (shift.status === 'CLOSED') {
    const error = new Error('Shift is already closed');
    error.statusCode = 400;
    throw error;
  }

  // If cashier, can only close own shift
  if (['cashier', 'staff'].includes(user.role) && shift.userId.toString() !== user._id.toString()) {
    const error = new Error('Unauthorized to close another cashier shift');
    error.statusCode = 403;
    throw error;
  }

  const actual = Number(actualCash);
  const totals = await calculateShiftTotals(shift);
  const expected = totals.expectedCash;
  const diff = actual - expected;

  let reconciliationStatus = 'BALANCED';
  if (diff < -0.01) reconciliationStatus = 'SHORT';
  else if (diff > 0.01) reconciliationStatus = 'OVER';

  shift.actualCash = actual;
  shift.expectedCash = expected;
  shift.difference = diff;
  shift.reconciliationStatus = reconciliationStatus;

  shift.totalSales = totals.totalSales;
  shift.totalInvoices = totals.totalInvoices;
  shift.totalReturns = totals.totalReturns;
  shift.totalCash = totals.totalCash;
  shift.totalCard = totals.totalCard;
  shift.totalInstapay = totals.totalInstapay;
  shift.totalDebt = totals.totalDebt;

  shift.status = 'CLOSED';
  shift.closedAt = new Date();
  if (notes) shift.notes = `${shift.notes}\n[Closed Notes]: ${notes}`;

  await shift.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'SHIFT_CLOSED',
    entity: 'Shift',
    entityId: shift._id,
    details: { shiftNumber: shift.shiftNumber, expected, actual, diff, reconciliationStatus },
    ipAddress: req.ip || ''
  });

  return shift;
};

export const getShifts = async (queryParams, user) => {
  const { search, status, cashier, branch, dateFrom, dateTo, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  // Role scoping: Cashier can only view own shifts
  if (['cashier', 'staff'].includes(user.role)) {
    filter.userId = user._id;
  } else if (cashier && mongoose.Types.ObjectId.isValid(cashier)) {
    filter.userId = cashier;
  }

  if (status) filter.status = status;
  if (branch && mongoose.Types.ObjectId.isValid(branch)) filter.branchId = branch;
  if (search && search.trim()) {
    filter.shiftNumber = new RegExp(search.trim(), 'i');
  }

  if (dateFrom || dateTo) {
    filter.openedAt = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      filter.openedAt.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.openedAt.$lte = end;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [shifts, totalItems] = await Promise.all([
    Shift.find(filter)
      .populate('userId', 'name email role')
      .populate('branchId', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Shift.countDocuments(filter)
  ]);

  return buildPagination(shifts, pageNum, limitNum, totalItems);
};

export const getDailyReport = async (queryParams, user, req = {}) => {
  const orgId = user.orgId;
  const { date, dateFrom, dateTo, branch } = queryParams;

  const filter = { orgId };
  if (branch && mongoose.Types.ObjectId.isValid(branch)) {
    filter.branchId = branch;
  }

  const targetDate = date ? new Date(date) : new Date();
  const start = dateFrom ? new Date(dateFrom) : new Date(targetDate.setHours(0, 0, 0, 0));
  const end = dateTo ? new Date(dateTo) : new Date(targetDate.setHours(23, 59, 59, 999));

  filter.openedAt = { $gte: start, $lte: end };

  const shifts = await Shift.find(filter)
    .populate('userId', 'name email')
    .populate('branchId', 'name code')
    .lean();

  let salesCount = 0;
  let totalRevenue = 0;
  let totalReturns = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalInstapay = 0;
  let totalDebt = 0;
  let openShiftsCount = 0;
  let closedShiftsCount = 0;

  let totalShort = 0;
  let totalOver = 0;
  let balancedCount = 0;

  const branchMap = new Map();

  shifts.forEach(shift => {
    if (shift.status === 'OPEN') openShiftsCount++;
    if (shift.status === 'CLOSED') closedShiftsCount++;

    salesCount += shift.totalInvoices || 0;
    totalRevenue += shift.totalSales || 0;
    totalReturns += shift.totalReturns || 0;
    totalCash += shift.totalCash || 0;
    totalCard += shift.totalCard || 0;
    totalInstapay += shift.totalInstaPay || 0;
    totalDebt += shift.totalDebt || 0;

    if (shift.reconciliationStatus === 'SHORT') totalShort += Math.abs(shift.difference || 0);
    if (shift.reconciliationStatus === 'OVER') totalOver += Math.abs(shift.difference || 0);
    if (shift.reconciliationStatus === 'BALANCED') balancedCount++;

    const bName = shift.branchId?.name || 'الفرع الرئيسي';
    if (!branchMap.has(bName)) {
      branchMap.set(bName, { sales: 0, revenue: 0, cash: 0, card: 0 });
    }
    const bData = branchMap.get(bName);
    bData.sales += shift.totalInvoices || 0;
    bData.revenue += shift.totalSales || 0;
    bData.cash += shift.totalCash || 0;
    bData.card += shift.totalCard || 0;
  });

  const averageInvoice = salesCount > 0 ? (totalRevenue / salesCount) : 0;

  const report = {
    period: { start, end },
    salesCount,
    totalRevenue,
    totalReturns,
    averageInvoice,
    totalCash,
    totalCard,
    totalInstapay,
    totalDebt,
    openShiftsCount,
    closedShiftsCount,
    cashDifferenceSummary: {
      shortAmount: totalShort,
      overAmount: totalOver,
      balancedShiftsCount: balancedCount
    },
    branchBreakdown: Array.from(branchMap.entries()).map(([branchName, stats]) => ({
      branchName,
      ...stats
    }))
  };

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'DAILY_REPORT_VIEWED',
    entity: 'ShiftReport',
    details: { period: report.period },
    ipAddress: req.ip || ''
  });

  return report;
};
