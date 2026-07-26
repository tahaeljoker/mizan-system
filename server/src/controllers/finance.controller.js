import { ZodError } from 'zod';
import * as financeService from '../services/finance.service.js';
import {
  expenseCategorySchema,
  expenseSchema,
  bankAccountSchema,
  cashMovementSchema,
  treasuryTransferSchema,
  bankDepositWithdrawSchema,
  customerPaymentSchema,
  supplierPaymentSchema,
  journalEntrySchema
} from '../validators/finance.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

/* ==========================================================================
   1. EXPENSES & CATEGORIES
   ========================================================================== */

export const getExpenseCategories = async (req, res) => {
  try {
    const categories = await financeService.getExpenseCategories(req.user);
    return successResponse(res, { categories }, 'Expense categories fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch categories', statusCode);
  }
};

export const createExpenseCategory = async (req, res) => {
  try {
    const validatedData = expenseCategorySchema.parse(req.body);
    const category = await financeService.createExpenseCategory(validatedData, req.user);
    return successResponse(res, { category }, 'Expense category created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create category', statusCode);
  }
};

export const getExpenses = async (req, res) => {
  try {
    const result = await financeService.getExpenses(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Expenses fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch expenses', statusCode);
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await financeService.getExpenseById(req.params.id, req.user);
    return successResponse(res, { expense }, 'Expense details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Expense not found', statusCode);
  }
};

export const createExpense = async (req, res) => {
  try {
    const validatedData = expenseSchema.parse(req.body);
    const expense = await financeService.createExpense(validatedData, req.user, req);
    return successResponse(res, { expense }, 'Expense recorded successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to record expense', statusCode);
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await financeService.updateExpense(req.params.id, req.body, req.user, req);
    return successResponse(res, { expense }, 'Expense updated successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update expense', statusCode);
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await financeService.deleteExpense(req.params.id, req.user, req);
    return successResponse(res, {}, 'Expense deleted successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete expense', statusCode);
  }
};

/* ==========================================================================
   2. TREASURY & BANK ACCOUNTS
   ========================================================================== */

export const getTreasuryBalance = async (req, res) => {
  try {
    const treasury = await financeService.getTreasuryBalance(req.user);
    return successResponse(res, { treasury }, 'Treasury balance fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch treasury balance', statusCode);
  }
};

export const getTreasuryTransactions = async (req, res) => {
  try {
    const result = await financeService.getTreasuryTransactions(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Treasury transactions fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch transactions', statusCode);
  }
};

export const recordCashIn = async (req, res) => {
  try {
    const validatedData = cashMovementSchema.parse(req.body);
    const transaction = await financeService.recordCashIn(validatedData, req.user, req);
    return successResponse(res, { transaction }, 'Cash in transaction recorded successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to record cash in', statusCode);
  }
};

export const recordCashOut = async (req, res) => {
  try {
    const validatedData = cashMovementSchema.parse(req.body);
    const transaction = await financeService.recordCashOut(validatedData, req.user, req);
    return successResponse(res, { transaction }, 'Cash out transaction recorded successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to record cash out', statusCode);
  }
};

export const getBankAccounts = async (req, res) => {
  try {
    const accounts = await financeService.getBankAccounts(req.user);
    return successResponse(res, { accounts }, 'Bank accounts fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch bank accounts', statusCode);
  }
};

export const getBankAccountById = async (req, res) => {
  try {
    const account = await financeService.getBankAccountById(req.params.id, req.user);
    return successResponse(res, { account }, 'Bank account details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Bank account not found', statusCode);
  }
};

export const createBankAccount = async (req, res) => {
  try {
    const validatedData = bankAccountSchema.parse(req.body);
    const account = await financeService.createBankAccount(validatedData, req.user, req);
    return successResponse(res, { account }, 'Bank account created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create bank account', statusCode);
  }
};

export const depositBank = async (req, res) => {
  try {
    const validatedData = bankDepositWithdrawSchema.parse(req.body);
    const account = await financeService.depositBank(req.params.id, validatedData, req.user, req);
    return successResponse(res, { account }, 'Deposit to bank account recorded successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to deposit to bank account', statusCode);
  }
};

export const withdrawBank = async (req, res) => {
  try {
    const validatedData = bankDepositWithdrawSchema.parse(req.body);
    const account = await financeService.withdrawBank(req.params.id, validatedData, req.user, req);
    return successResponse(res, { account }, 'Withdrawal from bank account recorded successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to withdraw from bank account', statusCode);
  }
};

export const transferBetweenBanks = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, notes } = req.body;
    const result = await financeService.transferBetweenBanks({ fromAccountId, toAccountId, amount, notes }, req.user, req);
    return successResponse(res, result, 'Transfer between bank accounts completed successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Bank transfer failed', statusCode);
  }
};

/* ==========================================================================
   3. CUSTOMER & SUPPLIER PAYMENTS
   ========================================================================== */

export const recordCustomerPayment = async (req, res) => {
  try {
    const validatedData = customerPaymentSchema.parse(req.body);
    const result = await financeService.recordCustomerPayment(validatedData, req.user, req);
    return successResponse(res, result, 'Customer payment received successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to record customer payment', statusCode);
  }
};

export const recordSupplierPayment = async (req, res) => {
  try {
    const validatedData = supplierPaymentSchema.parse(req.body);
    const result = await financeService.recordSupplierPayment(validatedData, req.user, req);
    return successResponse(res, result, 'Supplier payment recorded successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to record supplier payment', statusCode);
  }
};

/* ==========================================================================
   4. JOURNAL ENTRIES & DOUBLE-ENTRY ACCOUNTING
   ========================================================================== */

export const createJournalEntry = async (req, res) => {
  try {
    const validatedData = journalEntrySchema.parse(req.body);
    const entry = await financeService.createJournalEntry(validatedData, req.user, req);
    return successResponse(res, { entry }, 'Journal entry posted successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create journal entry', statusCode);
  }
};

export const getJournalEntries = async (req, res) => {
  try {
    const result = await financeService.getJournalEntries(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Journal entries fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch journal entries', statusCode);
  }
};

/* ==========================================================================
   5. FINANCIAL REPORTS & DASHBOARDS
   ========================================================================== */

export const getFinanceDashboard = async (req, res) => {
  try {
    const dashboard = await financeService.getFinanceDashboard(req.query, req.user);
    return successResponse(res, { dashboard }, 'Finance dashboard metrics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch finance dashboard', statusCode);
  }
};

export const getProfitLossReport = async (req, res) => {
  try {
    const report = await financeService.getProfitLossReport(req.query, req.user);
    return successResponse(res, { report }, 'Profit & Loss report fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch P&L report', statusCode);
  }
};

export const getCashFlowReport = async (req, res) => {
  try {
    const report = await financeService.getCashFlowReport(req.query, req.user);
    return successResponse(res, { report }, 'Cash flow report fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch cash flow report', statusCode);
  }
};

export const getExpenseReport = async (req, res) => {
  try {
    const report = await financeService.getExpenseReport(req.query, req.user);
    return successResponse(res, { report }, 'Expense report fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch expense report', statusCode);
  }
};

export const getTreasuryReport = async (req, res) => {
  try {
    const result = await financeService.getTreasuryReport(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Treasury report fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch treasury report', statusCode);
  }
};

export const getBankReport = async (req, res) => {
  try {
    const report = await financeService.getBankReport(req.query, req.user);
    return successResponse(res, { report }, 'Bank report fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch bank report', statusCode);
  }
};
