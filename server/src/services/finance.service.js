import mongoose from 'mongoose';
import JournalEntry from '../../models/JournalEntry.js';
import Expense from '../../models/Expense.js';
import ExpenseCategory from '../../models/ExpenseCategory.js';
import TreasuryTransaction from '../../models/TreasuryTransaction.js';
import BankAccount from '../../models/BankAccount.js';
import Customer from '../../models/Customer.js';
import Supplier from '../../models/Supplier.js';
import CustomerTransaction from '../../models/CustomerTransaction.js';
import SupplierTransaction from '../../models/SupplierTransaction.js';
import ActivityLog from '../../models/ActivityLog.js';
import { ZodError } from 'zod';

const buildPaginationResponse = (data, page, limit, total) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
});

const generateJournalNumber = async (orgId) => {
  const count = await JournalEntry.countDocuments({ orgId });
  return `JE-${String(count + 1).padStart(6, '0')}`;
};

export const STANDARD_COA = [
  { code: '1000', name: 'الأصول (Assets)', type: 'ASSET', parent: null, status: 'ACTIVE' },
  { code: '1001', name: 'النقدية والخزينة الرئيسية', type: 'ASSET', parent: '1000', status: 'ACTIVE' },
  { code: '1002', name: 'الحسابات البنكية', type: 'ASSET', parent: '1000', status: 'ACTIVE' },
  { code: '1101', name: 'حسابات العملاء والمدينون', type: 'ASSET', parent: '1000', status: 'ACTIVE' },
  { code: '1201', name: 'مخزون البضائع والأصناف', type: 'ASSET', parent: '1000', status: 'ACTIVE' },

  { code: '2000', name: 'الالتزامات (Liabilities)', type: 'LIABILITY', parent: null, status: 'ACTIVE' },
  { code: '2101', name: 'حسابات الموردين والدائنون', type: 'LIABILITY', parent: '2000', status: 'ACTIVE' },
  { code: '2201', name: 'مصروفات ومستحقات معلقة', type: 'LIABILITY', parent: '2000', status: 'ACTIVE' },

  { code: '3000', name: 'حقوق الملكية (Equity)', type: 'EQUITY', parent: null, status: 'ACTIVE' },
  { code: '3001', name: 'رأس المال المباشر', type: 'EQUITY', parent: '3000', status: 'ACTIVE' },
  { code: '3002', name: 'الأرباح والمكاسب المبقاة', type: 'EQUITY', parent: '3000', status: 'ACTIVE' },

  { code: '4000', name: 'الإيرادات والمبيعات (Revenue)', type: 'REVENUE', parent: null, status: 'ACTIVE' },
  { code: '4001', name: 'إيرادات مبيعات النشاط التجارى', type: 'REVENUE', parent: '4000', status: 'ACTIVE' },
  { code: '4002', name: 'إيرادات خدمات وتوصيل أخرى', type: 'REVENUE', parent: '4000', status: 'ACTIVE' },

  { code: '5000', name: 'المصروفات والتكاليف (Expenses)', type: 'EXPENSE', parent: null, status: 'ACTIVE' },
  { code: '5001', name: 'تكلفة البضاعة المباعة (COGS)', type: 'EXPENSE', parent: '5000', status: 'ACTIVE' },
  { code: '5002', name: 'مصروفات الإيجار والكهرباء', type: 'EXPENSE', parent: '5000', status: 'ACTIVE' },
  { code: '5003', name: 'رواتب وأجور الموظفين', type: 'EXPENSE', parent: '5000', status: 'ACTIVE' },
  { code: '5004', name: 'مصروفات تشغيلية وعامة', type: 'EXPENSE', parent: '5000', status: 'ACTIVE' }
];

export const getJournalEntries = async (queryParams, user) => {
  const { search, status, dateFrom, dateTo, page = 1, limit = 20 } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (search && search.trim()) {
    filter.$or = [
      { entryNumber: new RegExp(search.trim(), 'i') },
      { description: new RegExp(search.trim(), 'i') }
    ];
  }

  if (status) filter.status = status;

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

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [entries, totalItems] = await Promise.all([
    JournalEntry.find(filter)
      .populate('createdBy', 'name email')
      .sort('-entryDate')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    JournalEntry.countDocuments(filter)
  ]);

  return buildPaginationResponse(entries, pageNum, limitNum, totalItems);
};

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
    referenceType: data.referenceType || 'MANUAL',
    totalDebit,
    totalCredit,
    status: 'POSTED',
    items,
    createdBy: user._id
  });

  return entry;
};

export const getGeneralLedger = async (queryParams, user) => {
  const { accountCode, dateFrom, dateTo } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

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

  const entries = await JournalEntry.find(filter).sort('entryDate').lean();
  let ledgerRows = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let runningBalance = 0;

  entries.forEach(entry => {
    (entry.items || []).forEach(item => {
      if (!accountCode || accountCode === 'ALL' || item.accountCode === accountCode) {
        const debit = item.debit || 0;
        const credit = item.credit || 0;
        totalDebit += debit;
        totalCredit += credit;
        runningBalance += (debit - credit);

        ledgerRows.push({
          id: `${entry._id}_${item.accountCode}`,
          entryNumber: entry.entryNumber,
          date: entry.entryDate,
          accountCode: item.accountCode,
          accountName: item.accountName,
          description: entry.description || item.memo || 'قيد محاسبي تلقائي',
          reference: entry.reference || '',
          debit,
          credit,
          runningBalance
        });
      }
    });
  });

  return {
    accountCode: accountCode || 'ALL',
    openingBalance: 0,
    totalDebit,
    totalCredit,
    closingBalance: runningBalance,
    transactions: ledgerRows
  };
};

export const getTrialBalance = async (queryParams, user) => {
  const orgId = user.orgId;
  const entries = await JournalEntry.find({ orgId }).lean();
  const accountsMap = new Map();

  STANDARD_COA.forEach(acc => {
    accountsMap.set(acc.code, {
      accountCode: acc.code,
      accountName: acc.name,
      type: acc.type,
      opening: 0,
      debit: 0,
      credit: 0,
      closing: 0
    });
  });

  entries.forEach(entry => {
    (entry.items || []).forEach(item => {
      if (!accountsMap.has(item.accountCode)) {
        accountsMap.set(item.accountCode, {
          accountCode: item.accountCode,
          accountName: item.accountName,
          type: 'OTHER',
          opening: 0,
          debit: 0,
          credit: 0,
          closing: 0
        });
      }

      const acc = accountsMap.get(item.accountCode);
      acc.debit += (item.debit || 0);
      acc.credit += (item.credit || 0);
      acc.closing = acc.opening + acc.debit - acc.credit;
    });
  });

  const accountRows = Array.from(accountsMap.values());
  let grandTotalDebit = 0;
  let grandTotalCredit = 0;

  accountRows.forEach(row => {
    grandTotalDebit += row.debit;
    grandTotalCredit += row.credit;
  });

  const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

  return {
    accounts: accountRows,
    totalDebit: grandTotalDebit,
    totalCredit: grandTotalCredit,
    isBalanced
  };
};

export const getChartOfAccounts = async (queryParams, user) => {
  const orgId = user.orgId;
  const entries = await JournalEntry.find({ orgId }).lean();
  const balancesMap = new Map();

  entries.forEach(entry => {
    (entry.items || []).forEach(item => {
      const code = item.accountCode;
      const net = (item.debit || 0) - (item.credit || 0);
      balancesMap.set(code, (balancesMap.get(code) || 0) + net);
    });
  });

  return STANDARD_COA.map(acc => ({
    ...acc,
    balance: balancesMap.get(acc.code) || 0
  }));
};
