import mongoose from 'mongoose';
import ExpenseCategory from '../../models/ExpenseCategory.js';
import Expense from '../../models/Expense.js';
import BankAccount from '../../models/BankAccount.js';
import TreasuryTransaction from '../../models/TreasuryTransaction.js';
import JournalEntry from '../../models/JournalEntry.js';
import Customer from '../../models/Customer.js';
import CustomerTransaction from '../../models/CustomerTransaction.js';
import Supplier from '../../models/Supplier.js';
import SupplierTransaction from '../../models/SupplierTransaction.js';
import Sale from '../../models/Sale.js';
import PurchaseOrder from '../../models/PurchaseOrder.js';
import ActivityLog from '../../models/ActivityLog.js';

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

export const generateJournalNumber = async (orgId) => {
  const lastJE = await JournalEntry.findOne({ orgId, entryNumber: /^JE-\d+$/ })
    .sort({ createdAt: -1 })
    .lean();

  let nextSeq = 1;
  if (lastJE && lastJE.entryNumber) {
    const match = lastJE.entryNumber.match(/^JE-(\d+)$/);
    if (match && match[1]) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const seqStr = nextSeq.toString().padStart(6, '0');
  return `JE-${seqStr}`;
};

/* ==========================================================================
   1. EXPENSE CATEGORIES & EXPENSES
   ========================================================================== */

export const getExpenseCategories = async (user) => {
  return ExpenseCategory.find({ orgId: user.orgId }).sort('name').lean();
};

export const createExpenseCategory = async (data, user) => {
  const existing = await ExpenseCategory.findOne({ orgId: user.orgId, name: data.name });
  if (existing) {
    const error = new Error('فئة المصروفات موجودة بالفعل');
    error.statusCode = 400;
    throw error;
  }

  return ExpenseCategory.create({
    orgId: user.orgId,
    name: data.name,
    description: data.description || '',
    isDefault: data.isDefault || false,
    createdBy: user._id
  });
};

export const createExpense = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const category = await ExpenseCategory.findOne({ _id: data.categoryId, orgId });
  if (!category) {
    const error = new Error('فئة المصروفات غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  let bankAccount = null;
  if (data.bankAccountId) {
    bankAccount = await BankAccount.findOne({ _id: data.bankAccountId, orgId });
    if (!bankAccount) {
      const error = new Error('الحساب البنكي غير موجود');
      error.statusCode = 404;
      throw error;
    }
    if (bankAccount.balance < data.amount) {
      const error = new Error('رصيد الحساب البنكي غير كافٍ لتغطية المصروف');
      error.statusCode = 400;
      throw error;
    }
    bankAccount.balance -= data.amount;
    await bankAccount.save();
  }

  const expense = await Expense.create({
    orgId,
    branchId: data.branchId || user.branchId || null,
    categoryId: data.categoryId,
    amount: data.amount,
    paymentMethod: data.paymentMethod || 'CASH',
    bankAccountId: data.bankAccountId || null,
    reference: data.reference || '',
    notes: data.notes || '',
    expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
    createdBy: user._id
  });

  // Create Treasury Transaction
  await TreasuryTransaction.create({
    orgId,
    branchId: expense.branchId,
    bankAccountId: expense.bankAccountId,
    type: 'EXPENSE',
    direction: 'OUT',
    amount: expense.amount,
    paymentMethod: expense.paymentMethod,
    reference: expense.reference || category.name,
    referenceType: 'EXPENSE',
    expenseId: expense._id,
    notes: expense.notes,
    createdBy: user._id
  });

  // Automatic Double Entry
  const jeNumber = await generateJournalNumber(orgId);
  await JournalEntry.create({
    orgId,
    entryNumber: jeNumber,
    description: `مصروف: ${category.name} ${expense.notes ? '- ' + expense.notes : ''}`,
    reference: expense.reference,
    referenceType: 'EXPENSE',
    totalDebit: expense.amount,
    totalCredit: expense.amount,
    status: 'POSTED',
    items: [
      { accountCode: '5001', accountName: `مصروفات - ${category.name}`, debit: expense.amount, credit: 0 },
      { accountCode: expense.bankAccountId ? '1002' : '1001', accountName: expense.bankAccountId ? 'البنك' : 'النقدية / الخزينة', debit: 0, credit: expense.amount }
    ],
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'EXPENSE_CREATED',
    entity: 'Expense',
    entityId: expense._id,
    details: { amount: expense.amount, category: category.name, paymentMethod: expense.paymentMethod },
    ipAddress: req.ip || ''
  });

  return expense;
};

export const getExpenses = async (queryParams, user) => {
  const { category, branch, paymentMethod, dateFrom, dateTo, search, page = 1, limit = 20, sort = '-expenseDate' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (category && mongoose.Types.ObjectId.isValid(category)) filter.categoryId = category;
  if (branch && mongoose.Types.ObjectId.isValid(branch)) filter.branchId = branch;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (dateFrom || dateTo) {
    filter.expenseDate = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      filter.expenseDate.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = end;
    }
  }

  if (search && search.trim()) {
    filter.$or = [
      { reference: new RegExp(search.trim(), 'i') },
      { notes: new RegExp(search.trim(), 'i') }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [expenses, totalItems] = await Promise.all([
    Expense.find(filter)
      .populate('categoryId', 'name description')
      .populate('branchId', 'name code')
      .populate('bankAccountId', 'bankName accountNumber')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Expense.countDocuments(filter)
  ]);

  return buildPaginationResponse(expenses, pageNum, limitNum, totalItems);
};

export const getExpenseById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid expense ID');
    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOne({ _id: id, orgId: user.orgId })
    .populate('categoryId', 'name description')
    .populate('branchId', 'name code')
    .populate('bankAccountId', 'bankName accountNumber')
    .populate('createdBy', 'name email role')
    .lean();

  if (!expense) {
    const error = new Error('المصروف غير موجود');
    error.statusCode = 404;
    throw error;
  }

  return expense;
};

export const updateExpense = async (id, data, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid expense ID');
    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOne({ _id: id, orgId: user.orgId });
  if (!expense) {
    const error = new Error('المصروف غير موجود');
    error.statusCode = 404;
    throw error;
  }

  if (data.amount !== undefined) expense.amount = data.amount;
  if (data.reference !== undefined) expense.reference = data.reference;
  if (data.notes !== undefined) expense.notes = data.notes;
  if (data.categoryId) expense.categoryId = data.categoryId;

  await expense.save();

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'EXPENSE_UPDATED',
    entity: 'Expense',
    entityId: expense._id,
    details: { amount: expense.amount },
    ipAddress: req.ip || ''
  });

  return expense;
};

export const deleteExpense = async (id, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid expense ID');
    error.statusCode = 400;
    throw error;
  }

  const expense = await Expense.findOneAndDelete({ _id: id, orgId: user.orgId });
  if (!expense) {
    const error = new Error('المصروف غير موجود');
    error.statusCode = 404;
    throw error;
  }

  if (expense.bankAccountId) {
    await BankAccount.updateOne({ _id: expense.bankAccountId, orgId: user.orgId }, { $inc: { balance: expense.amount } });
  }

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'EXPENSE_DELETED',
    entity: 'Expense',
    entityId: id,
    details: { amount: expense.amount },
    ipAddress: req.ip || ''
  });

  return true;
};

/* ==========================================================================
   2. TREASURY & BANK ACCOUNTS
   ========================================================================== */

export const getTreasuryBalance = async (user) => {
  const orgId = user.orgId;

  // Calculate Cash Balance from Treasury Transactions
  const cashIn = await TreasuryTransaction.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(orgId), bankAccountId: null, direction: 'IN' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const cashOut = await TreasuryTransaction.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(orgId), bankAccountId: null, direction: 'OUT' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalCashIn = cashIn[0]?.total || 0;
  const totalCashOut = cashOut[0]?.total || 0;
  const cashBalance = totalCashIn - totalCashOut;

  // Bank Accounts Balance
  const bankAccounts = await BankAccount.find({ orgId, status: 'ACTIVE' }).lean();
  const bankBalance = bankAccounts.reduce((acc, b) => acc + (b.balance || 0), 0);

  // Receivables & Payables
  const customers = await Customer.find({ orgId, isDeleted: { $ne: true } }).lean();
  const receivables = customers.reduce((acc, c) => acc + Math.max(0, c.balance || 0), 0);

  const suppliers = await Supplier.find({ orgId, isDeleted: { $ne: true } }).lean();
  const payables = suppliers.reduce((acc, s) => acc + Math.max(0, s.balance || 0), 0);

  return {
    cashBalance,
    bankBalance,
    totalLiquidFunds: cashBalance + bankBalance,
    receivables,
    payables
  };
};

export const getTreasuryTransactions = async (queryParams, user) => {
  const { type, direction, paymentMethod, branch, dateFrom, dateTo, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (type) filter.type = type;
  if (direction) filter.direction = direction;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (branch && mongoose.Types.ObjectId.isValid(branch)) filter.branchId = branch;

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

  const [transactions, totalItems] = await Promise.all([
    TreasuryTransaction.find(filter)
      .populate('bankAccountId', 'bankName accountNumber')
      .populate('branchId', 'name code')
      .populate('customerId', 'name phone')
      .populate('supplierId', 'name phone')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    TreasuryTransaction.countDocuments(filter)
  ]);

  return buildPaginationResponse(transactions, pageNum, limitNum, totalItems);
};

export const recordCashIn = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const transaction = await TreasuryTransaction.create({
    orgId,
    branchId: data.branchId || user.branchId || null,
    bankAccountId: data.bankAccountId || null,
    type: 'RECEIPT',
    direction: 'IN',
    amount: data.amount,
    paymentMethod: data.paymentMethod || 'CASH',
    reference: data.reference || '',
    notes: data.notes || 'سند قبض نقدي',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'TREASURY_TRANSACTION',
    entity: 'TreasuryTransaction',
    entityId: transaction._id,
    details: { direction: 'IN', amount: data.amount },
    ipAddress: req.ip || ''
  });

  return transaction;
};

export const recordCashOut = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const transaction = await TreasuryTransaction.create({
    orgId,
    branchId: data.branchId || user.branchId || null,
    bankAccountId: data.bankAccountId || null,
    type: 'PAYMENT',
    direction: 'OUT',
    amount: data.amount,
    paymentMethod: data.paymentMethod || 'CASH',
    reference: data.reference || '',
    notes: data.notes || 'سند صرف نقدي',
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'TREASURY_TRANSACTION',
    entity: 'TreasuryTransaction',
    entityId: transaction._id,
    details: { direction: 'OUT', amount: data.amount },
    ipAddress: req.ip || ''
  });

  return transaction;
};

export const getBankAccounts = async (user) => {
  return BankAccount.find({ orgId: user.orgId }).sort('-createdAt').lean();
};

export const getBankAccountById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid bank account ID');
    error.statusCode = 400;
    throw error;
  }

  const account = await BankAccount.findOne({ _id: id, orgId: user.orgId }).lean();
  if (!account) {
    const error = new Error('الحساب البنكي غير موجود');
    error.statusCode = 404;
    throw error;
  }

  return account;
};

export const createBankAccount = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const existing = await BankAccount.findOne({ orgId, accountNumber: data.accountNumber });
  if (existing) {
    const error = new Error('رقم الحساب البنكي موجود بالفعل');
    error.statusCode = 400;
    throw error;
  }

  const account = await BankAccount.create({
    orgId,
    bankName: data.bankName,
    accountName: data.accountName,
    accountNumber: data.accountNumber,
    iban: data.iban || '',
    swiftCode: data.swiftCode || '',
    balance: Number(data.balance || 0),
    currency: data.currency || 'EGP',
    branchId: data.branchId || null,
    isDefault: data.isDefault || false,
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'BANK_ACCOUNT_CREATED',
    entity: 'BankAccount',
    entityId: account._id,
    details: { bankName: account.bankName, accountNumber: account.accountNumber },
    ipAddress: req.ip || ''
  });

  return account;
};

export const depositBank = async (id, { amount, notes, reference }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid bank account ID');
    error.statusCode = 400;
    throw error;
  }

  const account = await BankAccount.findOne({ _id: id, orgId: user.orgId });
  if (!account) {
    const error = new Error('الحساب البنكي غير موجود');
    error.statusCode = 404;
    throw error;
  }

  const depositAmount = Number(amount);
  account.balance += depositAmount;
  await account.save();

  await TreasuryTransaction.create({
    orgId: user.orgId,
    bankAccountId: account._id,
    type: 'DEPOSIT',
    direction: 'IN',
    amount: depositAmount,
    balanceAfter: account.balance,
    paymentMethod: 'BANK_TRANSFER',
    reference: reference || '',
    notes: notes || `إيداع بنكي بالحساب ${account.accountNumber}`,
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'BANK_DEPOSIT',
    entity: 'BankAccount',
    entityId: account._id,
    details: { amount: depositAmount, newBalance: account.balance },
    ipAddress: req.ip || ''
  });

  return account;
};

export const withdrawBank = async (id, { amount, notes, reference }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid bank account ID');
    error.statusCode = 400;
    throw error;
  }

  const account = await BankAccount.findOne({ _id: id, orgId: user.orgId });
  if (!account) {
    const error = new Error('الحساب البنكي غير موجود');
    error.statusCode = 404;
    throw error;
  }

  const withdrawAmount = Number(amount);
  if (account.balance < withdrawAmount) {
    const error = new Error(`رصيد الحساب البنكي غير كافٍ. المتاح: ${account.balance}`);
    error.statusCode = 400;
    throw error;
  }

  account.balance -= withdrawAmount;
  await account.save();

  await TreasuryTransaction.create({
    orgId: user.orgId,
    bankAccountId: account._id,
    type: 'WITHDRAW',
    direction: 'OUT',
    amount: withdrawAmount,
    balanceAfter: account.balance,
    paymentMethod: 'BANK_TRANSFER',
    reference: reference || '',
    notes: notes || `سحب بنكي من الحساب ${account.accountNumber}`,
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'BANK_WITHDRAW',
    entity: 'BankAccount',
    entityId: account._id,
    details: { amount: withdrawAmount, newBalance: account.balance },
    ipAddress: req.ip || ''
  });

  return account;
};

export const transferBetweenBanks = async ({ fromAccountId, toAccountId, amount, notes }, user, req = {}) => {
  if (fromAccountId.toString() === toAccountId.toString()) {
    const error = new Error('الحساب البنكي المحول منه والمنقول إليه هما نفس الحساب');
    error.statusCode = 400;
    throw error;
  }

  const fromAcc = await BankAccount.findOne({ _id: fromAccountId, orgId: user.orgId });
  const toAcc = await BankAccount.findOne({ _id: toAccountId, orgId: user.orgId });

  if (!fromAcc || !toAcc) {
    const error = new Error('أحد الحسابين البنكيين غير موجود');
    error.statusCode = 404;
    throw error;
  }

  const transferAmt = Number(amount);
  if (fromAcc.balance < transferAmt) {
    const error = new Error(`رصيد الحساب المحول منه غير كافٍ. المتاح: ${fromAcc.balance}`);
    error.statusCode = 400;
    throw error;
  }

  fromAcc.balance -= transferAmt;
  await fromAcc.save();

  toAcc.balance += transferAmt;
  await toAcc.save();

  await TreasuryTransaction.create({
    orgId: user.orgId,
    bankAccountId: fromAcc._id,
    type: 'TRANSFER',
    direction: 'OUT',
    amount: transferAmt,
    balanceAfter: fromAcc.balance,
    paymentMethod: 'BANK_TRANSFER',
    notes: `تحويل بنكي إلى ${toAcc.bankName} (${toAcc.accountNumber})`,
    createdBy: user._id
  });

  await TreasuryTransaction.create({
    orgId: user.orgId,
    bankAccountId: toAcc._id,
    type: 'TRANSFER',
    direction: 'IN',
    amount: transferAmt,
    balanceAfter: toAcc.balance,
    paymentMethod: 'BANK_TRANSFER',
    notes: `تحويل بنكي وارد من ${fromAcc.bankName} (${fromAcc.accountNumber})`,
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId: user.orgId,
    userId: user._id,
    action: 'BANK_TRANSFER',
    entity: 'BankAccount',
    entityId: fromAcc._id,
    details: { fromAccount: fromAcc.accountNumber, toAccount: toAcc.accountNumber, amount: transferAmt },
    ipAddress: req.ip || ''
  });

  return { fromAcc, toAcc };
};

/* ==========================================================================
   3. CUSTOMER & SUPPLIER PAYMENTS
   ========================================================================== */

export const recordCustomerPayment = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const customer = await Customer.findOne({ _id: data.customerId, orgId, isDeleted: { $ne: true } });

  if (!customer) {
    const error = new Error('العميل غير موجود');
    error.statusCode = 404;
    throw error;
  }

  const amount = Number(data.amount);
  const balanceBefore = customer.balance;
  const balanceAfter = balanceBefore - amount;

  customer.balance = balanceAfter;
  await customer.save();

  const custTx = await CustomerTransaction.create({
    orgId,
    customerId: customer._id,
    amount,
    balanceBefore,
    balanceAfter,
    type: 'PAYMENT',
    reference: data.reference || 'تحصيل آجل / دفع سداد',
    createdBy: user._id
  });

  let bankAccount = null;
  if (data.bankAccountId) {
    bankAccount = await BankAccount.findOne({ _id: data.bankAccountId, orgId });
    if (bankAccount) {
      bankAccount.balance += amount;
      await bankAccount.save();
    }
  }

  await TreasuryTransaction.create({
    orgId,
    branchId: data.branchId || user.branchId || null,
    bankAccountId: bankAccount ? bankAccount._id : null,
    type: 'RECEIPT',
    direction: 'IN',
    amount,
    paymentMethod: data.paymentMethod || 'CASH',
    reference: data.reference || '',
    referenceType: 'CUSTOMER_PAYMENT',
    customerId: customer._id,
    notes: data.notes || `تحصيل مبلغ من العميل ${customer.name}`,
    createdBy: user._id
  });

  const jeNumber = await generateJournalNumber(orgId);
  await JournalEntry.create({
    orgId,
    entryNumber: jeNumber,
    description: `سداد آجل عميل: ${customer.name}`,
    reference: data.reference || '',
    referenceType: 'CUSTOMER_PAYMENT',
    totalDebit: amount,
    totalCredit: amount,
    status: 'POSTED',
    items: [
      { accountCode: bankAccount ? '1002' : '1001', accountName: bankAccount ? 'البنك' : 'النقدية / الخزينة', debit: amount, credit: 0 },
      { accountCode: '1101', accountName: `العملاء - ${customer.name}`, debit: 0, credit: amount }
    ],
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'CUSTOMER_PAYMENT',
    entity: 'Customer',
    entityId: customer._id,
    details: { customerName: customer.name, amount, balanceBefore, balanceAfter },
    ipAddress: req.ip || ''
  });

  return { customer, customerTransaction: custTx };
};

export const recordSupplierPayment = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const supplier = await Supplier.findOne({ _id: data.supplierId, orgId, isDeleted: { $ne: true } });

  if (!supplier) {
    const error = new Error('المورد غير موجود');
    error.statusCode = 404;
    throw error;
  }

  const amount = Number(data.amount);
  const balanceBefore = supplier.balance;
  const balanceAfter = balanceBefore - amount;

  supplier.balance = balanceAfter;
  await supplier.save();

  const suppTx = await SupplierTransaction.create({
    orgId,
    supplierId: supplier._id,
    amount,
    balanceBefore,
    balanceAfter,
    type: 'PAYMENT',
    reference: data.reference || 'سداد مستحقات مورد',
    createdBy: user._id
  });

  let bankAccount = null;
  if (data.bankAccountId) {
    bankAccount = await BankAccount.findOne({ _id: data.bankAccountId, orgId });
    if (bankAccount) {
      if (bankAccount.balance < amount) {
        const error = new Error('رصيد الحساب البنكي غير كافٍ لسداد المورد');
        error.statusCode = 400;
        throw error;
      }
      bankAccount.balance -= amount;
      await bankAccount.save();
    }
  }

  await TreasuryTransaction.create({
    orgId,
    branchId: data.branchId || user.branchId || null,
    bankAccountId: bankAccount ? bankAccount._id : null,
    type: 'PAYMENT',
    direction: 'OUT',
    amount,
    paymentMethod: data.paymentMethod || 'CASH',
    reference: data.reference || '',
    referenceType: 'SUPPLIER_PAYMENT',
    supplierId: supplier._id,
    notes: data.notes || `سداد دفعة للمورد ${supplier.name}`,
    createdBy: user._id
  });

  const jeNumber = await generateJournalNumber(orgId);
  await JournalEntry.create({
    orgId,
    entryNumber: jeNumber,
    description: `سداد مستحقات مورد: ${supplier.name}`,
    reference: data.reference || '',
    referenceType: 'SUPPLIER_PAYMENT',
    totalDebit: amount,
    totalCredit: amount,
    status: 'POSTED',
    items: [
      { accountCode: '2101', accountName: `الموردون - ${supplier.name}`, debit: amount, credit: 0 },
      { accountCode: bankAccount ? '1002' : '1001', accountName: bankAccount ? 'البنك' : 'النقدية / الخزينة', debit: 0, credit: amount }
    ],
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'SUPPLIER_PAYMENT',
    entity: 'Supplier',
    entityId: supplier._id,
    details: { supplierName: supplier.name, amount, balanceBefore, balanceAfter },
    ipAddress: req.ip || ''
  });

  return { supplier, supplierTransaction: suppTx };
};

/* ==========================================================================
   4. JOURNAL ENTRIES & DOUBLE-ENTRY ACCOUNTING
   ========================================================================== */

export const createJournalEntry = async (data, user, req = {}) => {
  const orgId = user.orgId;
  const items = data.items || [];

  let totalDebit = 0;
  let totalCredit = 0;

  items.forEach(item => {
    totalDebit += Number(item.debit || 0);
    totalCredit += Number(item.credit || 0);
  });

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    const error = new Error(`القيد المحاسبي غير متوازن. مجموع المدين: ${totalDebit}، مجموع الدائن: ${totalCredit}`);
    error.statusCode = 400;
    throw error;
  }

  const entryNumber = await generateJournalNumber(orgId);
  const entry = await JournalEntry.create({
    orgId,
    entryNumber,
    description: data.description || '',
    reference: data.reference || '',
    referenceType: 'MANUAL',
    totalDebit,
    totalCredit,
    status: 'POSTED',
    items,
    createdBy: user._id
  });

  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'JOURNAL_ENTRY',
    entity: 'JournalEntry',
    entityId: entry._id,
    details: { entryNumber, totalDebit },
    ipAddress: req.ip || ''
  });

  return entry;
};

export const getJournalEntries = async (queryParams, user) => {
  const { search, dateFrom, dateTo, page = 1, limit = 20, sort = '-entryDate' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (search && search.trim()) {
    filter.$or = [
      { entryNumber: new RegExp(search.trim(), 'i') },
      { description: new RegExp(search.trim(), 'i') }
    ];
  }

  if (dateFrom || dateTo) {
    filter.entryDate = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      filter.entryDate.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.entryDate.$lte = end;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [entries, totalItems] = await Promise.all([
    JournalEntry.find(filter)
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    JournalEntry.countDocuments(filter)
  ]);

  return buildPaginationResponse(entries, pageNum, limitNum, totalItems);
};

/* ==========================================================================
   5. FINANCIAL REPORTS & STATISTICAL DASHBOARDS
   ========================================================================== */

export const getFinanceDashboard = async (queryParams, user) => {
  const orgId = user.orgId;

  // Sales Revenue
  const sales = await Sale.find({ orgId, status: { $ne: 'CANCELLED' } }).lean();
  let totalRevenue = 0;
  sales.forEach(s => totalRevenue += (s.totalAmount || 0));

  // Operating Expenses
  const expenses = await Expense.find({ orgId }).lean();
  let totalExpenses = 0;
  expenses.forEach(e => totalExpenses += (e.amount || 0));

  // Purchases Cost
  const pos = await PurchaseOrder.find({ orgId, status: 'RECEIVED' }).lean();
  let totalPurchases = 0;
  pos.forEach(p => totalPurchases += (p.totalAmount || 0));

  const grossProfit = totalRevenue - totalPurchases;
  const netProfit = grossProfit - totalExpenses;

  const treasury = await getTreasuryBalance(user);

  return {
    totalRevenue,
    totalExpenses,
    totalPurchases,
    grossProfit,
    netProfit,
    cashBalance: treasury.cashBalance,
    bankBalance: treasury.bankBalance,
    totalLiquidFunds: treasury.totalLiquidFunds,
    receivables: treasury.receivables,
    payables: treasury.payables
  };
};

export const getProfitLossReport = async (queryParams, user) => {
  const dashboard = await getFinanceDashboard(queryParams, user);

  return {
    revenue: {
      salesRevenue: dashboard.totalRevenue,
      otherRevenue: 0,
      totalRevenue: dashboard.totalRevenue
    },
    costOfGoodsSold: {
      purchasesCost: dashboard.totalPurchases,
      totalCOGS: dashboard.totalPurchases
    },
    grossProfit: dashboard.grossProfit,
    operatingExpenses: {
      totalExpenses: dashboard.totalExpenses
    },
    netProfit: dashboard.netProfit
  };
};

export const getCashFlowReport = async (queryParams, user) => {
  const orgId = user.orgId;
  const txs = await TreasuryTransaction.find({ orgId }).sort('createdAt').lean();

  let operatingInflow = 0;
  let operatingOutflow = 0;

  txs.forEach(t => {
    if (t.direction === 'IN') operatingInflow += t.amount;
    if (t.direction === 'OUT') operatingOutflow += t.amount;
  });

  return {
    operatingInflow,
    operatingOutflow,
    netCashFlow: operatingInflow - operatingOutflow,
    transactionsCount: txs.length
  };
};

export const getExpenseReport = async (queryParams, user) => {
  const orgId = user.orgId;
  const expenses = await Expense.find({ orgId }).populate('categoryId', 'name').lean();

  const categoryMap = new Map();
  let totalAmount = 0;

  expenses.forEach(e => {
    const catName = e.categoryId?.name || 'غير مصنف';
    const amt = e.amount || 0;
    totalAmount += amt;
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + amt);
  });

  return {
    totalAmount,
    expensesCount: expenses.length,
    categoryBreakdown: Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(2) : 0
    }))
  };
};

export const getTreasuryReport = async (queryParams, user) => {
  return getTreasuryTransactions(queryParams, user);
};

export const getBankReport = async (queryParams, user) => {
  const orgId = user.orgId;
  const accounts = await BankAccount.find({ orgId }).lean();
  const bankTxs = await TreasuryTransaction.find({ orgId, bankAccountId: { $ne: null } })
    .populate('bankAccountId', 'bankName accountNumber')
    .sort('-createdAt')
    .lean();

  return {
    totalAccountsCount: accounts.length,
    accounts,
    recentTransactions: bankTxs
  };
};
