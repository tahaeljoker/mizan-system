import express from 'express';
import * as financeController from '../controllers/finance.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

/* ==========================================================================
   1. DASHBOARDS & REPORTS
   ========================================================================== */
router.get('/dashboard', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getFinanceDashboard);
router.get('/profit-loss', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getProfitLossReport);
router.get('/cash-flow', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getCashFlowReport);
router.get('/expense-report', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getExpenseReport);
router.get('/treasury-report', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getTreasuryReport);
router.get('/bank-report', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getBankReport);

/* ==========================================================================
   2. EXPENSES & CATEGORIES
   ========================================================================== */
router.get('/expense-categories', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier', 'staff'), financeController.getExpenseCategories);
router.post('/expense-categories', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.createExpenseCategory);

router.get('/expenses', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier', 'staff'), financeController.getExpenses);
router.get('/expenses/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier', 'staff'), financeController.getExpenseById);
router.post('/expenses', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), financeController.createExpense);
router.put('/expenses/:id', authorizeRoles('owner', 'admin', 'accountant'), financeController.updateExpense);
router.delete('/expenses/:id', authorizeRoles('owner', 'admin', 'accountant'), financeController.deleteExpense);

/* ==========================================================================
   3. TREASURY & CASH MOVEMENTS
   ========================================================================== */
router.get('/treasury/balance', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), financeController.getTreasuryBalance);
router.get('/treasury/transactions', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getTreasuryTransactions);
router.post('/treasury/cash-in', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), financeController.recordCashIn);
router.post('/treasury/cash-out', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), financeController.recordCashOut);

/* ==========================================================================
   4. BANK ACCOUNTS
   ========================================================================== */
router.get('/banks', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getBankAccounts);
router.get('/banks/:id', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.getBankAccountById);
router.post('/banks', authorizeRoles('owner', 'admin', 'accountant'), financeController.createBankAccount);
router.post('/banks/:id/deposit', authorizeRoles('owner', 'admin', 'accountant'), financeController.depositBank);
router.post('/banks/:id/withdraw', authorizeRoles('owner', 'admin', 'accountant'), financeController.withdrawBank);
router.post('/banks/transfer', authorizeRoles('owner', 'admin', 'accountant'), financeController.transferBetweenBanks);

/* ==========================================================================
   5. CUSTOMER & SUPPLIER PAYMENTS
   ========================================================================== */
router.post('/customer-payments', authorizeRoles('owner', 'admin', 'manager', 'accountant', 'cashier'), financeController.recordCustomerPayment);
router.post('/supplier-payments', authorizeRoles('owner', 'admin', 'manager', 'accountant'), financeController.recordSupplierPayment);

/* ==========================================================================
   6. JOURNAL ENTRIES & DOUBLE-ENTRY ACCOUNTING
   ========================================================================== */
router.get('/journal-entries', authorizeRoles('owner', 'admin', 'accountant'), financeController.getJournalEntries);
router.post('/journal-entries', authorizeRoles('owner', 'admin', 'accountant'), financeController.createJournalEntry);

router.get('/ledger', authorizeRoles('owner', 'admin', 'accountant'), financeController.getGeneralLedger);
router.get('/trial-balance', authorizeRoles('owner', 'admin', 'accountant'), financeController.getTrialBalance);
router.get('/chart-of-accounts', authorizeRoles('owner', 'admin', 'accountant'), financeController.getChartOfAccounts);

export default router;
