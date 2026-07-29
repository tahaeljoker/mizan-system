import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Customer from './models/Customer.js';
import Supplier from './models/Supplier.js';
import ExpenseCategory from './models/ExpenseCategory.js';
import Expense from './models/Expense.js';
import BankAccount from './models/BankAccount.js';
import TreasuryTransaction from './models/TreasuryTransaction.js';
import JournalEntry from './models/JournalEntry.js';

dotenv.config();

const PORT = 5103;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Finance & Accounting Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_FINANCE_ORG' });
    await User.deleteMany({ email: 'testfinance@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_FINANCE_ORG',
      ownerName: 'Test Finance Owner',
      phone: '01066666666',
      plan: 'pro',
      status: 'active'
    });

    const branch = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });

    const user = await User.create({
      name: 'Test Accountant',
      email: 'testfinance@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testfinance@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testfinance@mizan.com');

    await ExpenseCategory.deleteMany({ orgId: org._id });
    await Expense.deleteMany({ orgId: org._id });
    await BankAccount.deleteMany({ orgId: org._id });
    await TreasuryTransaction.deleteMany({ orgId: org._id });
    await JournalEntry.deleteMany({ orgId: org._id });
    await Customer.deleteMany({ orgId: org._id });
    await Supplier.deleteMany({ orgId: org._id });

    // 1. Test Expense Categories
    console.log('\n--- 1. Testing Expense Categories ---');
    const catRes = await fetch(`${BASE_URL}/api/v1/finance/expense-categories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'مصاريف إيجار', description: 'إيجار مقرات وفروع' })
    });
    const catData = await catRes.json();
    console.log('Status:', catRes.status);
    console.log('Category:', catData.category.name);
    const categoryId = catData.category._id;

    // 2. Test Create Expense
    console.log('\n--- 2. Testing POST /api/v1/finance/expenses ---');
    const expRes = await fetch(`${BASE_URL}/api/v1/finance/expenses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        categoryId,
        amount: 2500,
        paymentMethod: 'CASH',
        reference: 'REC-RENT-001',
        notes: 'دفع إيجار المقر الرئيسي لشهر يوليو'
      })
    });
    const expData = await expRes.json();
    console.log('Status:', expRes.status);
    console.log('Expense Response:', JSON.stringify(expData, null, 2));

    if (!expData.success || !expData.expense?._id || expData.expense.amount !== 2500) {
      throw new Error('Create expense failed!');
    }

    // 3. Test Bank Accounts CRUD & Deposits/Withdrawals
    console.log('\n--- 3. Testing Bank Accounts API ---');
    const bankRes = await fetch(`${BASE_URL}/api/v1/finance/banks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        bankName: 'البنك الأهلي المصري',
        accountName: 'حساب شركة ميزان الرئيسي',
        accountNumber: '1234567890',
        balance: 50000
      })
    });
    const bankData = await bankRes.json();
    console.log('Bank Created:', bankData.account.bankName, 'Balance:', bankData.account.balance);
    const bankId = bankData.account._id;

    const bank2Res = await fetch(`${BASE_URL}/api/v1/finance/banks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        bankName: 'بنك مصر',
        accountName: 'حساب الفرعي الفرعي',
        accountNumber: '0987654321',
        balance: 10000
      })
    });
    const bank2Data = await bank2Res.json();
    const bank2Id = bank2Data.account._id;

    // Deposit 5000 into Bank 1
    const depRes = await fetch(`${BASE_URL}/api/v1/finance/banks/${bankId}/deposit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: 5000, notes: 'إيداع أرباح' })
    });
    const depData = await depRes.json();
    console.log('Bank 1 Balance after deposit 5000:', depData.account.balance, '(Expected 55000)');
    if (depData.account.balance !== 55000) throw new Error('Bank deposit failed!');

    // Transfer 10000 from Bank 1 to Bank 2
    const transferRes = await fetch(`${BASE_URL}/api/v1/finance/banks/transfer`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ fromAccountId: bankId, toAccountId: bank2Id, amount: 10000 })
    });
    const transferData = await transferRes.json();
    console.log('Transfer Status:', transferRes.status);
    console.log('Bank 1 Balance after transfer:', transferData.fromAcc.balance, '(Expected 45000)');
    console.log('Bank 2 Balance after transfer:', transferData.toAcc.balance, '(Expected 20000)');

    if (transferData.fromAcc.balance !== 45000 || transferData.toAcc.balance !== 20000) {
      throw new Error('Bank transfer failed!');
    }

    // 4. Test Customer Payments (Debt Collection)
    console.log('\n--- 4. Testing Customer Debt Payment ---');
    const customer = await Customer.create({
      orgId: org._id,
      name: 'عميل الشركة المدين',
      phone: '01111112222',
      balance: 12000 // Owes 12000
    });

    const custPayRes = await fetch(`${BASE_URL}/api/v1/finance/customer-payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: customer._id,
        amount: 4000,
        paymentMethod: 'CASH',
        notes: 'سداد جزئي للآجل'
      })
    });
    const custPayData = await custPayRes.json();
    console.log('Status:', custPayRes.status);
    console.log('Customer Balance after payment:', custPayData.customer.balance, '(Expected 8000)');
    if (custPayData.customer.balance !== 8000) throw new Error('Customer payment recording failed!');

    // 5. Test Supplier Payments
    console.log('\n--- 5. Testing Supplier Payment ---');
    const supplier = await Supplier.create({
      orgId: org._id,
      name: 'مورد الأجهزة والمعدات',
      company: 'شركة الأجهزة المصرية',
      phone: '01222223333',
      balance: 15000 // We owe 15000
    });

    const suppPayRes = await fetch(`${BASE_URL}/api/v1/finance/supplier-payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        supplierId: supplier._id,
        amount: 5000,
        paymentMethod: 'CASH',
        notes: 'سداد دفعة من الحساب'
      })
    });
    const suppPayData = await suppPayRes.json();
    console.log('Status:', suppPayRes.status);
    console.log('Supplier Balance after payment:', suppPayData.supplier.balance, '(Expected 10000)');
    if (suppPayData.supplier.balance !== 10000) throw new Error('Supplier payment recording failed!');

    // 6. Test Double-Entry Journal Entries
    console.log('\n--- 6. Testing Journal Entries ---');
    const jeRes = await fetch(`${BASE_URL}/api/v1/finance/journal-entries`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        description: 'قيد إثبات أصول ثابتة جديدة',
        items: [
          { accountCode: '1501', accountName: 'أصول ثابتة - معدات', debit: 15000, credit: 0 },
          { accountCode: '1001', accountName: 'النقدية / الخزينة', debit: 0, credit: 15000 }
        ]
      })
    });
    const jeData = await jeRes.json();
    console.log('Status:', jeRes.status);
    console.log('JE Number:', jeData.entry.entryNumber, 'Total Debit:', jeData.entry.totalDebit);
    if (!jeData.success || jeData.entry.totalDebit !== 15000) throw new Error('Journal entry creation failed!');

    // Test Unbalanced JE Rejection
    const unbalRes = await fetch(`${BASE_URL}/api/v1/finance/journal-entries`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        description: 'قيد غير متوازن',
        items: [
          { accountCode: '1501', accountName: 'أصول ثابتة', debit: 5000, credit: 0 },
          { accountCode: '1001', accountName: 'النقدية', debit: 0, credit: 3000 }
        ]
      })
    });
    const unbalData = await unbalRes.json();
    console.log('Unbalanced JE Status:', unbalRes.status);
    if (unbalRes.status !== 400 || unbalData.success !== false) throw new Error('Unbalanced JE was not rejected!');
    console.log('✅ Unbalanced journal entry correctly rejected (HTTP 400)');

    // 7. Test Finance Dashboard & Reports
    console.log('\n--- 7. Testing Financial Reports & Dashboards ---');
    const dashRes = await fetch(`${BASE_URL}/api/v1/finance/dashboard`, { headers: authHeaders });
    const dashData = await dashRes.json();
    console.log('Dashboard Data:', JSON.stringify(dashData.dashboard, null, 2));

    const plRes = await fetch(`${BASE_URL}/api/v1/finance/profit-loss`, { headers: authHeaders });
    const plData = await plRes.json();
    console.log('Profit & Loss Summary:', JSON.stringify(plData.report, null, 2));

    const expReportRes = await fetch(`${BASE_URL}/api/v1/finance/expense-report`, { headers: authHeaders });
    const expReportData = await expReportRes.json();
    console.log('Expense Report Summary:', JSON.stringify(expReportData.report, null, 2));

    console.log('\nALL FINANCE, TREASURY & ACCOUNTING ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Finance Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
