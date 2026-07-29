import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Product from './models/Product.js';
import StockCountSession from './models/StockCountSession.js';
import StockTransfer from './models/StockTransfer.js';

dotenv.config();

const PORT = 5102;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Advanced Inventory Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_INV_ORG' });
    await User.deleteMany({ email: 'testinv@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_INV_ORG',
      ownerName: 'Test Inv Owner',
      phone: '01055555555',
      plan: 'pro',
      status: 'active'
    });

    const branchA = await Branch.create({ name: 'الفرع الرئيسي A', orgId: org._id, code: 'BRA', isMain: true });
    const branchB = await Branch.create({ name: 'فرع المعادي B', orgId: org._id, code: 'BRB', isMain: false });

    const user = await User.create({
      name: 'Test Inv Admin',
      email: 'testinv@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branchA._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testinv@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testinv@mizan.com');

    await Product.deleteMany({ orgId: org._id });
    await StockCountSession.deleteMany({ orgId: org._id });
    await StockTransfer.deleteMany({ orgId: org._id });

    const prod1 = await Product.create({
      orgId: org._id,
      name: 'منتج أجهزة كهربائية A',
      sku: 'INV-SKU-001',
      barcode: 'INV-BAR-001',
      category: 'أجهزة',
      sellPrice: 1500,
      costPrice: 1000,
      stock: 50,
      minStock: 10,
      branchId: branchA._id
    });

    const prod2 = await Product.create({
      orgId: org._id,
      name: 'منتج إلكترونيات B',
      sku: 'INV-SKU-002',
      barcode: 'INV-BAR-002',
      category: 'إلكترونيات',
      sellPrice: 200,
      costPrice: 120,
      stock: 5,
      minStock: 10, // Low stock
      branchId: branchA._id
    });

    const prodOut = await Product.create({
      orgId: org._id,
      name: 'منتج نفد مخزونه C',
      sku: 'INV-SKU-003',
      barcode: 'INV-BAR-003',
      category: 'إلكترونيات',
      sellPrice: 50,
      costPrice: 30,
      stock: 0, // Out of stock
      minStock: 5,
      branchId: branchA._id
    });

    // 1. Test POST /api/v1/inventory/transfers (Create Transfer)
    console.log('\n--- 1. Testing POST /api/v1/inventory/transfers ---');
    const transferRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fromBranchId: branchA._id,
        toBranchId: branchB._id,
        items: [{ productId: prod1._id, quantity: 10 }],
        notes: 'تحويل 10 قطع إلى فرع المعادي'
      })
    });
    const transferData = await transferRes.json();
    console.log('Status:', transferRes.status);
    console.log('Response:', JSON.stringify(transferData, null, 2));

    if (!transferData.success || !transferData.transfer?._id || transferData.transfer.transferNumber !== 'TRANSFER-000001') {
      throw new Error('Create transfer failed!');
    }
    const transferId = transferData.transfer._id;
    console.log(`Generated Transfer Number: ${transferData.transfer.transferNumber}`);

    // 2. Test Dispatch Transfer
    console.log('\n--- 2. Testing POST /api/v1/inventory/transfers/:id/dispatch ---');
    const dispatchRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers/${transferId}/dispatch`, {
      method: 'POST',
      headers: authHeaders
    });
    const dispatchData = await dispatchRes.json();
    console.log('Status:', dispatchRes.status);
    console.log('Response:', JSON.stringify(dispatchData, null, 2));

    if (!dispatchData.success || dispatchData.transfer.status !== 'IN_TRANSIT') {
      throw new Error('Dispatch transfer failed!');
    }

    // Verify source product stock decreased from 50 to 40
    const updatedProd1AfterDispatch = await Product.findById(prod1._id);
    console.log(`Prod 1 stock after dispatch: ${updatedProd1AfterDispatch.stock} (Expected 40)`);
    if (updatedProd1AfterDispatch.stock !== 40) throw new Error('Stock deduction on dispatch failed!');

    // 3. Test Receive Transfer
    console.log('\n--- 3. Testing POST /api/v1/inventory/transfers/:id/receive ---');
    const receiveRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers/${transferId}/receive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ notes: 'تم استلام الشحنة بحالة جيدة' })
    });
    const receiveData = await receiveRes.json();
    console.log('Status:', receiveRes.status);
    console.log('Response:', JSON.stringify(receiveData, null, 2));

    if (!receiveData.success || receiveData.transfer.status !== 'RECEIVED') {
      throw new Error('Receive transfer failed!');
    }

    // 4. Test Stock Count Session Lifecycle
    console.log('\n--- 4. Testing Stock Count Session Lifecycle ---');
    // 4a. Create Stock Count Session (status: OPEN)
    const countRes = await fetch(`${BASE_URL}/api/v1/inventory/stock-count`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'جرد نهاية الشهر', branchId: branchA._id })
    });
    const countData = await countRes.json();
    console.log('Stock Count Created:', countData.session.sessionNumber, 'Status:', countData.session.status);
    if (countData.session.sessionNumber !== 'COUNT-000001' || countData.session.status !== 'OPEN') {
      throw new Error('Create stock count failed!');
    }
    const countId = countData.session._id;

    // 4b. Start Counting (status: COUNTING)
    const startRes = await fetch(`${BASE_URL}/api/v1/inventory/stock-count/${countId}/start`, {
      method: 'POST',
      headers: authHeaders
    });
    const startData = await startRes.json();
    console.log('Stock Count Start Status:', startData.session.status);
    if (startData.session.status !== 'COUNTING') throw new Error('Start counting failed!');

    // 4c. Submit Count (status: REVIEW)
    const submitRes = await fetch(`${BASE_URL}/api/v1/inventory/stock-count/${countId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        items: [
          { productId: prod1._id, countedQuantity: 42 } // System was 40, variance +2
        ]
      })
    });
    const submitData = await submitRes.json();
    console.log('Stock Count Submit Status:', submitData.session.status);
    if (submitData.session.status !== 'REVIEW') throw new Error('Submit count failed!');

    // 4d. Approve Count (Owner Approval, updates stock to 42)
    const approveRes = await fetch(`${BASE_URL}/api/v1/inventory/stock-count/${countId}/approve`, {
      method: 'POST',
      headers: authHeaders
    });
    const approveData = await approveRes.json();
    console.log('Stock Count Approve Status:', approveData.session.status);
    if (approveData.session.status !== 'APPROVED') throw new Error('Approve count failed!');

    const prod1AfterStocktake = await Product.findById(prod1._id);
    console.log(`Prod 1 stock after stocktake approval: ${prod1AfterStocktake.stock} (Expected 42)`);
    if (prod1AfterStocktake.stock !== 42) throw new Error('Stock adjustment after stocktake failed!');

    // 5. Test PATCH /api/v1/inventory/bulk-adjust
    console.log('\n--- 5. Testing PATCH /api/v1/inventory/bulk-adjust ---');
    const bulkRes = await fetch(`${BASE_URL}/api/v1/inventory/bulk-adjust`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify([
        { productId: prod1._id, quantity: 8, reason: 'تعديل تالف' } // 42 + 8 = 50
      ])
    });
    const bulkData = await bulkRes.json();
    console.log('Status:', bulkRes.status);
    console.log('Response:', JSON.stringify(bulkData, null, 2));

    const prod1AfterBulk = await Product.findById(prod1._id);
    console.log(`Prod 1 stock after bulk adjust: ${prod1AfterBulk.stock} (Expected 50)`);

    // 6. Test Negative Stock Protection
    console.log('\n--- 6. Testing Negative Stock Protection ---');
    const negRes = await fetch(`${BASE_URL}/api/v1/inventory/adjust`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        productId: prod1._id,
        quantity: 100,
        type: 'SALE',
        reason: 'محاولة الخصم أكثر من المتاح'
      })
    });
    const negData = await negRes.json();
    console.log('Status:', negRes.status);
    console.log('Response:', JSON.stringify(negData, null, 2));

    if (negRes.status !== 400 || negData.success !== false) {
      throw new Error('Negative stock protection failed to reject invalid request!');
    }
    console.log('✅ Negative stock protection correctly rejected request with HTTP 400');

    // 7. Test Low Stock & Out of Stock Reports
    console.log('\n--- 7. Testing Low Stock & Out of Stock Endpoints ---');
    const lowRes = await fetch(`${BASE_URL}/api/v1/inventory/low-stock`, { headers: authHeaders });
    const lowData = await lowRes.json();
    console.log(`Low stock products count: ${lowData.data.length}`);

    const outRes = await fetch(`${BASE_URL}/api/v1/inventory/out-of-stock`, { headers: authHeaders });
    const outData = await outRes.json();
    console.log(`Out of stock products count: ${outData.data.length}`);

    // 8. Test Inventory Summary Report
    console.log('\n--- 8. Testing GET /api/v1/inventory/report ---');
    const reportRes = await fetch(`${BASE_URL}/api/v1/inventory/report`, { headers: authHeaders });
    const reportData = await reportRes.json();
    console.log('Status:', reportRes.status);
    console.log('Response:', JSON.stringify(reportData, null, 2));

    if (!reportData.success || !reportData.report?.stockSellingValue) {
      throw new Error('Get inventory report failed!');
    }

    console.log('\nALL WAREHOUSE & INVENTORY MANAGEMENT ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Inventory Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
