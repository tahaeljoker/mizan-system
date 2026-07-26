import mongoose from 'mongoose';
import Sale from '../../models/Sale.js';
import Return from '../../models/Return.js';
import Product from '../../models/Product.js';
import Customer from '../../models/Customer.js';
import Supplier from '../../models/Supplier.js';
import Expense from '../../models/Expense.js';
import BankAccount from '../../models/BankAccount.js';
import TreasuryTransaction from '../../models/TreasuryTransaction.js';
import Shift from '../../models/Shift.js';
import StockTransfer from '../../models/StockTransfer.js';
import StockCountSession from '../../models/StockCountSession.js';
import User from '../../models/User.js';
import ActivityLog from '../../models/ActivityLog.js';

/**
 * Helper to parse time periods into start and end Dates
 */
export const parseDateRange = (period = 'today', dateFrom, dateTo) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_week':
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_week':
      const currentDay = now.getDay();
      start.setDate(now.getDate() - currentDay - 7);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - currentDay - 1);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last_month':
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;

    case 'custom':
      if (dateFrom) {
        start = new Date(dateFrom);
        start.setHours(0, 0, 0, 0);
      }
      if (dateTo) {
        end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
      }
      break;

    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};

/* ==========================================================================
   1. EXECUTIVE OVERVIEW
   ========================================================================== */

export const getExecutiveOverview = async (queryParams, user) => {
  const orgId = new mongoose.Types.ObjectId(user.orgId);
  const { period = 'today', dateFrom, dateTo, branchId } = queryParams;
  const { start, end } = parseDateRange(period, dateFrom, dateTo);

  const monthStart = new Date(nowYear(), nowMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(nowYear(), nowMonth() + 1, 0, 23, 59, 59, 999);

  function nowYear() { return new Date().getFullYear(); }
  function nowMonth() { return new Date().getMonth(); }

  const branchFilter = branchId && mongoose.Types.ObjectId.isValid(branchId)
    ? { branchId: new mongoose.Types.ObjectId(branchId) }
    : {};

  // 1. Period Sales
  const periodSales = await Sale.aggregate([
    {
      $match: {
        orgId,
        status: { $ne: 'CANCELLED' },
        createdAt: { $gte: start, $lte: end },
        ...branchFilter
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalInvoices: { $sum: 1 }
      }
    }
  ]);

  // 2. Month Sales
  const monthSales = await Sale.aggregate([
    {
      $match: {
        orgId,
        status: { $ne: 'CANCELLED' },
        createdAt: { $gte: monthStart, $lte: monthEnd },
        ...branchFilter
      }
    },
    {
      $group: {
        _id: null,
        monthRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  // 3. Period Expenses
  const periodExpenses = await Expense.aggregate([
    {
      $match: {
        orgId,
        expenseDate: { $gte: start, $lte: end },
        ...branchFilter
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' }
      }
    }
  ]);

  // 4. Products Inventory Value & Stock Cost
  const prodMatch = { orgId, isDeleted: { $ne: true } };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) prodMatch.branchId = new mongoose.Types.ObjectId(branchId);

  const inventoryStats = await Product.aggregate([
    { $match: prodMatch },
    {
      $group: {
        _id: null,
        inventoryValue: { $sum: { $multiply: ['$stock', '$sellPrice'] } },
        stockCost: { $sum: { $multiply: ['$stock', '$costPrice'] } }
      }
    }
  ]);

  // 5. Liquid Funds & Balances
  const cashIn = await TreasuryTransaction.aggregate([
    { $match: { orgId, bankAccountId: null, direction: 'IN' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const cashOut = await TreasuryTransaction.aggregate([
    { $match: { orgId, bankAccountId: null, direction: 'OUT' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const cashBalance = (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);

  const bankAccounts = await BankAccount.find({ orgId, status: 'ACTIVE' }).lean();
  const bankBalance = bankAccounts.reduce((acc, b) => acc + (b.balance || 0), 0);

  // 6. Receivables & Payables
  const customers = await Customer.find({ orgId, isDeleted: { $ne: true } }).lean();
  const receivables = customers.reduce((acc, c) => acc + Math.max(0, c.balance || 0), 0);

  const suppliers = await Supplier.find({ orgId, isDeleted: { $ne: true } }).lean();
  const payables = suppliers.reduce((acc, s) => acc + Math.max(0, s.balance || 0), 0);

  // 7. Shifts & Active Users
  const openShiftsCount = await Shift.countDocuments({ orgId, status: 'OPEN' });
  const activeUsersCount = await User.countDocuments({ orgId, status: 'active' });

  const revenue = periodSales[0]?.totalRevenue || 0;
  const invoicesCount = periodSales[0]?.totalInvoices || 0;
  const monthRevenue = monthSales[0]?.monthRevenue || 0;
  const expenses = periodExpenses[0]?.totalExpenses || 0;

  // Estimated Cost of Goods Sold for profit calculations
  const estimatedCOGS = revenue * 0.65; // Approx 65% cost ratio
  const grossProfit = revenue - estimatedCOGS;
  const netProfit = grossProfit - expenses;
  const monthProfit = monthRevenue - (monthRevenue * 0.65) - expenses;

  return {
    todaySalesCount: invoicesCount,
    todayRevenue: revenue,
    todayProfit: netProfit,
    monthRevenue,
    monthProfit,
    todayExpenses: expenses,
    cashBalance,
    bankBalance,
    receivables,
    payables,
    openShifts: openShiftsCount,
    activeUsers: activeUsersCount,
    inventoryValue: inventoryStats[0]?.inventoryValue || 0,
    stockCost: inventoryStats[0]?.stockCost || 0,
    grossProfit,
    netProfit
  };
};

/* ==========================================================================
   2. SALES ANALYTICS
   ========================================================================== */

export const getSalesAnalytics = async (queryParams, user) => {
  const orgId = new mongoose.Types.ObjectId(user.orgId);
  const { period = 'today', dateFrom, dateTo, branchId, cashierId } = queryParams;
  const { start, end } = parseDateRange(period, dateFrom, dateTo);

  const matchFilter = {
    orgId,
    status: { $ne: 'CANCELLED' },
    createdAt: { $gte: start, $lte: end }
  };

  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) matchFilter.branchId = new mongoose.Types.ObjectId(branchId);
  if (cashierId && mongoose.Types.ObjectId.isValid(cashierId)) matchFilter.cashierId = new mongoose.Types.ObjectId(cashierId);

  const salesStats = await Sale.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalSalesRevenue: { $sum: '$totalAmount' },
        totalPaidAmount: { $sum: '$paidAmount' },
        totalDueAmount: { $sum: '$dueAmount' },
        invoicesCount: { $sum: 1 },
        averageInvoice: { $avg: '$totalAmount' }
      }
    }
  ]);

  // Payment Method Breakdown
  const paymentsBreakdown = await Sale.aggregate([
    { $match: matchFilter },
    { $unwind: '$payments' },
    {
      $group: {
        _id: '$payments.method',
        totalAmount: { $sum: '$payments.amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Refund Analytics
  const returnsStats = await Return.aggregate([
    {
      $match: {
        orgId,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalRefundAmount: { $sum: '$totalRefundAmount' },
        returnsCount: { $sum: 1 }
      }
    }
  ]);

  const totalRevenue = salesStats[0]?.totalSalesRevenue || 0;
  const totalRefunds = returnsStats[0]?.totalRefundAmount || 0;
  const refundRate = totalRevenue > 0 ? ((totalRefunds / totalRevenue) * 100).toFixed(2) : 0;

  const paymentMap = { CASH: 0, CARD: 0, INSTAPAY: 0, DEBT: 0 };
  paymentsBreakdown.forEach(p => {
    paymentMap[p._id] = p.totalAmount;
  });

  return {
    totalRevenue,
    invoicesCount: salesStats[0]?.invoicesCount || 0,
    averageInvoice: salesStats[0]?.averageInvoice || 0,
    totalRefunds,
    refundRate: Number(refundRate),
    paymentBreakdown: paymentMap
  };
};

/* ==========================================================================
   3. PRODUCT ANALYTICS
   ========================================================================== */

export const getProductAnalytics = async (queryParams, user) => {
  const orgId = new mongoose.Types.ObjectId(user.orgId);
  const { period = 'this_month', dateFrom, dateTo, categoryId } = queryParams;
  const { start, end } = parseDateRange(period, dateFrom, dateTo);

  // Top Selling Products by Quantity & Revenue
  const topProducts = await Sale.aggregate([
    { $match: { orgId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.name' },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' }
      }
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: 10 }
  ]);

  // Products Never Sold
  const soldProductIds = await Sale.distinct('items.productId', { orgId, status: { $ne: 'CANCELLED' } });
  const neverSoldProducts = await Product.find({
    orgId,
    _id: { $nin: soldProductIds },
    isDeleted: { $ne: true }
  })
    .select('name sku barcode stock sellPrice costPrice')
    .limit(10)
    .lean();

  return {
    topSellingProducts: topProducts,
    neverSoldProducts
  };
};

/* ==========================================================================
   4. INVENTORY ANALYTICS
   ========================================================================== */

export const getInventoryAnalytics = async (queryParams, user) => {
  const orgId = user.orgId;

  const products = await Product.find({ orgId, isDeleted: { $ne: true } }).lean();
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let stockValue = 0;
  let stockCost = 0;

  products.forEach(p => {
    const stk = p.stock || 0;
    if (stk <= 0) outOfStockCount++;
    else if (stk <= (p.minStock || 5)) lowStockCount++;

    stockValue += stk * (p.sellPrice || 0);
    stockCost += stk * (p.costPrice || 0);
  });

  const activeTransfersCount = await StockTransfer.countDocuments({ orgId, status: 'IN_TRANSIT' });
  const openStockCountsCount = await StockCountSession.countDocuments({ orgId, status: { $in: ['OPEN', 'COUNTING', 'REVIEW'] } });

  return {
    totalProductsCount: products.length,
    lowStockCount,
    outOfStockCount,
    stockValue,
    stockCost,
    activeTransfersInTransit: activeTransfersCount,
    openStockCountSessions: openStockCountsCount
  };
};

/* ==========================================================================
   5. CUSTOMER ANALYTICS
   ========================================================================== */

export const getCustomerAnalytics = async (queryParams, user) => {
  const orgId = new mongoose.Types.ObjectId(user.orgId);
  const { period = 'this_month', dateFrom, dateTo } = queryParams;
  const { start, end } = parseDateRange(period, dateFrom, dateTo);

  // Top Customers by Spending
  const topCustomers = await Sale.aggregate([
    { $match: { orgId, status: { $ne: 'CANCELLED' }, customerId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$customerId',
        totalSpent: { $sum: '$totalAmount' },
        invoicesCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerId: '$_id',
        name: '$customer.name',
        phone: '$customer.phone',
        totalSpent: 1,
        invoicesCount: 1,
        loyaltyPoints: '$customer.loyaltyPoints'
      }
    }
  ]);

  // Debtors
  const debtors = await Customer.find({ orgId, balance: { $gt: 0 }, isDeleted: { $ne: true } })
    .select('name phone balance loyaltyPoints')
    .sort('-balance')
    .limit(10)
    .lean();

  return {
    topCustomers,
    debtors
  };
};

/* ==========================================================================
   6. CASHIER & BRANCH ANALYTICS
   ========================================================================== */

export const getCashierAnalytics = async (queryParams, user) => {
  const orgId = new mongoose.Types.ObjectId(user.orgId);
  const { period = 'today', dateFrom, dateTo } = queryParams;
  const { start, end } = parseDateRange(period, dateFrom, dateTo);

  const cashierStats = await Sale.aggregate([
    { $match: { orgId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$cashierId',
        totalSalesVolume: { $sum: '$totalAmount' },
        invoicesCount: { $sum: 1 },
        avgInvoice: { $avg: '$totalAmount' }
      }
    },
    { $sort: { totalSalesVolume: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'cashier'
      }
    },
    { $unwind: '$cashier' },
    {
      $project: {
        cashierId: '$_id',
        name: '$cashier.name',
        email: '$cashier.email',
        role: '$cashier.role',
        totalSalesVolume: 1,
        invoicesCount: 1,
        avgInvoice: 1
      }
    }
  ]);

  return cashierStats;
};

export const getBranchAnalytics = async (queryParams, user) => {
  const orgId = new mongoose.Types.ObjectId(user.orgId);
  const { period = 'this_month', dateFrom, dateTo } = queryParams;
  const { start, end } = parseDateRange(period, dateFrom, dateTo);

  const branchStats = await Sale.aggregate([
    { $match: { orgId, status: { $ne: 'CANCELLED' }, branchId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$branchId',
        totalRevenue: { $sum: '$totalAmount' },
        invoicesCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branch'
      }
    },
    { $unwind: '$branch' },
    {
      $project: {
        branchId: '$_id',
        branchName: '$branch.name',
        code: '$branch.code',
        totalRevenue: 1,
        invoicesCount: 1
      }
    }
  ]);

  return branchStats;
};

/* ==========================================================================
   7. CHARTS API (JSON Data for Frontend Charts)
   ========================================================================== */

export const getChartsData = async (queryParams, user) => {
  const orgId = new mongoose.Types.ObjectId(user.orgId);
  const { period = 'this_month', dateFrom, dateTo } = queryParams;
  const { start, end } = parseDateRange(period, dateFrom, dateTo);

  // Sales Line Chart (Daily grouping)
  const salesTrend = await Sale.aggregate([
    { $match: { orgId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        invoicesCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top Products Bar Chart
  const topProductsBar = await Sale.aggregate([
    { $match: { orgId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' }
      }
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 }
  ]);

  // Payment Method Doughnut Chart
  const paymentDoughnut = await Sale.aggregate([
    { $match: { orgId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$payments' },
    {
      $group: {
        _id: '$payments.method',
        amount: { $sum: '$payments.amount' }
      }
    }
  ]);

  // Expense Category Pie Chart
  const expensePie = await Expense.aggregate([
    { $match: { orgId, expenseDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$categoryId',
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'expensecategories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        categoryName: '$category.name',
        amount: '$totalAmount'
      }
    }
  ]);

  return {
    salesLineChart: salesTrend.map(s => ({ date: s._id, revenue: s.revenue, invoices: s.invoicesCount })),
    topProductsBarChart: topProductsBar.map(p => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
    paymentDoughnutChart: paymentDoughnut.map(p => ({ method: p._id, amount: p.amount })),
    expensePieChart: expensePie.map(e => ({ name: e.categoryName, value: e.amount }))
  };
};
