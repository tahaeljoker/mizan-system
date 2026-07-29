import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Product from './models/Product.js';
import Sale from './models/Sale.js';
import Customer from './models/Customer.js';
import Expense from './models/Expense.js';

dotenv.config();

const PORT = 5104;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Executive Dashboard & Analytics Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_DASHBOARD_ORG' });
    await User.deleteMany({ email: 'testdashboard@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_DASHBOARD_ORG',
      ownerName: 'Test Dashboard Owner',
      phone: '01077777777',
      plan: 'pro',
      status: 'active'
    });

    const branch = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });

    const user = await User.create({
      name: 'Test CEO',
      email: 'testdashboard@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testdashboard@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testdashboard@mizan.com');

    // Create sample data for analytics
    await Product.deleteMany({ orgId: org._id });
    await Sale.deleteMany({ orgId: org._id });
    await Customer.deleteMany({ orgId: org._id });
    await Expense.deleteMany({ orgId: org._id });

    const p1 = await Product.create({
      orgId: org._id,
      name: 'لابتوب أبل ماك بوك',
      sku: 'DASH-PROD-01',
      barcode: 'DASH-BAR-01',
      category: 'إلكترونيات',
      sellPrice: 45000,
      costPrice: 38000,
      stock: 12,
      minStock: 3,
      branchId: branch._id
    });

    const cust = await Customer.create({
      orgId: org._id,
      name: 'عميل كبير مميز',
      phone: '01555111222',
      balance: 5000,
      loyaltyPoints: 450
    });

    await Sale.create({
      orgId: org._id,
      invoiceNumber: 'INV-DASH-001',
      branchId: branch._id,
      customerId: cust._id,
      items: [
        { productId: p1._id, name: p1.name, unit: 'قطعة', quantity: 2, unitPrice: 45000, discount: 0, total: 90000 }
      ],
      payments: [{ method: 'CASH', amount: 85000 }, { method: 'DEBT', amount: 5000 }],
      subtotal: 90000,
      discount: 0,
      tax: 0,
      totalAmount: 90000,
      paidAmount: 85000,
      dueAmount: 5000,
      status: 'COMPLETED',
      cashierId: user._id,
      createdBy: user._id
    });

    // 1. GET /api/v1/dashboard/overview
    console.log('\n--- 1. Testing GET /api/v1/dashboard/overview ---');
    const ovRes = await fetch(`${BASE_URL}/api/v1/dashboard/overview?period=today`, { headers: authHeaders });
    const ovData = await ovRes.json();
    console.log('Status:', ovRes.status);
    console.log('Overview:', JSON.stringify(ovData.overview, null, 2));
    if (!ovData.success || ovData.overview.todayRevenue !== 90000) throw new Error('Overview metrics failed!');

    // 2. GET /api/v1/dashboard/sales
    console.log('\n--- 2. Testing GET /api/v1/dashboard/sales ---');
    const salesRes = await fetch(`${BASE_URL}/api/v1/dashboard/sales?period=today`, { headers: authHeaders });
    const salesData = await salesRes.json();
    console.log('Status:', salesRes.status);
    console.log('Sales Analytics:', JSON.stringify(salesData.sales, null, 2));
    if (!salesData.success || salesData.sales.invoicesCount !== 1) throw new Error('Sales analytics failed!');

    // 3. GET /api/v1/dashboard/products
    console.log('\n--- 3. Testing GET /api/v1/dashboard/products ---');
    const prodRes = await fetch(`${BASE_URL}/api/v1/dashboard/products?period=today`, { headers: authHeaders });
    const prodData = await prodRes.json();
    console.log('Status:', prodRes.status);
    console.log('Top Selling:', JSON.stringify(prodData.products.topSellingProducts, null, 2));
    if (!prodData.success || prodData.products.topSellingProducts.length !== 1) throw new Error('Product analytics failed!');

    // 4. GET /api/v1/dashboard/customers
    console.log('\n--- 4. Testing GET /api/v1/dashboard/customers ---');
    const custRes = await fetch(`${BASE_URL}/api/v1/dashboard/customers?period=today`, { headers: authHeaders });
    const custData = await custRes.json();
    console.log('Status:', custRes.status);
    console.log('Top Customers:', JSON.stringify(custData.customers.topCustomers, null, 2));
    if (!custData.success || custData.customers.topCustomers.length !== 1) throw new Error('Customer analytics failed!');

    // 5. GET /api/v1/dashboard/inventory
    console.log('\n--- 5. Testing GET /api/v1/dashboard/inventory ---');
    const invRes = await fetch(`${BASE_URL}/api/v1/dashboard/inventory`, { headers: authHeaders });
    const invData = await invRes.json();
    console.log('Status:', invRes.status);
    console.log('Inventory Value:', invData.inventory.stockValue);
    if (!invData.success || invData.inventory.stockValue !== (12 * 45000)) throw new Error('Inventory analytics failed!');

    // 6. GET /api/v1/dashboard/finance
    console.log('\n--- 6. Testing GET /api/v1/dashboard/finance ---');
    const finRes = await fetch(`${BASE_URL}/api/v1/dashboard/finance`, { headers: authHeaders });
    const finData = await finRes.json();
    console.log('Status:', finRes.status);
    console.log('Finance Analytics:', JSON.stringify(finData.finance, null, 2));
    if (!finData.success) throw new Error('Finance analytics failed!');

    // 7. GET /api/v1/dashboard/cashiers
    console.log('\n--- 7. Testing GET /api/v1/dashboard/cashiers ---');
    const cashierRes = await fetch(`${BASE_URL}/api/v1/dashboard/cashiers?period=today`, { headers: authHeaders });
    const cashierData = await cashierRes.json();
    console.log('Status:', cashierRes.status);
    console.log('Cashier Performance:', JSON.stringify(cashierData.cashiers, null, 2));
    if (!cashierData.success || cashierData.cashiers.length !== 1) throw new Error('Cashier analytics failed!');

    // 8. GET /api/v1/dashboard/branches
    console.log('\n--- 8. Testing GET /api/v1/dashboard/branches ---');
    const branchRes = await fetch(`${BASE_URL}/api/v1/dashboard/branches?period=today`, { headers: authHeaders });
    const branchData = await branchRes.json();
    console.log('Status:', branchRes.status);
    console.log('Branch Performance:', JSON.stringify(branchData.branches, null, 2));
    if (!branchData.success || branchData.branches.length !== 1) throw new Error('Branch analytics failed!');

    // 9. GET /api/v1/dashboard/charts
    console.log('\n--- 9. Testing GET /api/v1/dashboard/charts ---');
    const chartsRes = await fetch(`${BASE_URL}/api/v1/dashboard/charts?period=today`, { headers: authHeaders });
    const chartsData = await chartsRes.json();
    console.log('Status:', chartsRes.status);
    console.log('Charts Dataset:', JSON.stringify(chartsData.charts, null, 2));
    if (!chartsData.success || !chartsData.charts.topProductsBarChart) throw new Error('Charts dataset failed!');

    console.log('\nALL EXECUTIVE DASHBOARD, ANALYTICS & KPI ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Dashboard Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
