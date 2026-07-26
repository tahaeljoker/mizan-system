import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import Sale from './models/Sale.js';
import Shift from './models/Shift.js';
import Return from './models/Return.js';

dotenv.config();

const PORT = 5101;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Shift Management Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_SHIFT_ORG' });
    await User.deleteMany({ email: 'testshift@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_SHIFT_ORG',
      ownerName: 'Test Shift Owner',
      phone: '01044444444',
      plan: 'pro',
      status: 'active'
    });

    const branch = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });

    const user = await User.create({
      name: 'Test Shift Cashier',
      email: 'testshift@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testshift@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testshift@mizan.com');

    await Shift.deleteMany({ orgId: org._id });
    await Product.deleteMany({ orgId: org._id });
    await Customer.deleteMany({ orgId: org._id });
    await Sale.deleteMany({ orgId: org._id });
    await Return.deleteMany({ orgId: org._id });

    const testProduct = await Product.create({
      orgId: org._id,
      name: 'منتج الورديات',
      barcode: 'SHIFT-PROD-001',
      sku: 'SHIFT-SKU-001',
      category: 'عام',
      sellPrice: 100,
      costPrice: 60,
      stock: 200,
      branchId: branch._id
    });

    const testCustomer = await Customer.create({
      orgId: org._id,
      name: 'عميل النقدية',
      phone: '01099998888',
      balance: 0
    });

    // 1. Test POST /api/v1/shifts/open (Open Shift)
    console.log('\n--- 1. Testing POST /api/v1/shifts/open ---');
    const openRes = await fetch(`${BASE_URL}/api/v1/shifts/open`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        openingCash: 500,
        notes: 'بداية وردية الصباح'
      })
    });
    const openData = await openRes.json();
    console.log('Status:', openRes.status);
    console.log('Response:', JSON.stringify(openData, null, 2));

    if (!openData.success || !openData.shift?._id || openData.shift.status !== 'OPEN') {
      throw new Error('Open shift failed!');
    }
    const shiftId = openData.shift._id;
    console.log(`Opened Shift Number: ${openData.shift.shiftNumber}`);

    // 2. Test Duplicate Open Rejected
    console.log('\n--- 2. Testing Duplicate Open Shift Rejection ---');
    const dupOpenRes = await fetch(`${BASE_URL}/api/v1/shifts/open`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ openingCash: 200 })
    });
    const dupOpenData = await dupOpenRes.json();
    console.log('Status:', dupOpenRes.status);
    console.log('Response:', JSON.stringify(dupOpenData, null, 2));

    if (dupOpenRes.status !== 400 || dupOpenData.success !== false) {
      throw new Error('Duplicate open shift was not rejected!');
    }
    console.log('✅ Duplicate open shift correctly rejected (400)');

    // 3. Test GET /api/v1/shifts/current
    console.log('\n--- 3. Testing GET /api/v1/shifts/current ---');
    const currentRes = await fetch(`${BASE_URL}/api/v1/shifts/current`, {
      method: 'GET',
      headers: authHeaders
    });
    const currentData = await currentRes.json();
    console.log('Status:', currentRes.status);
    console.log('Response:', JSON.stringify(currentData, null, 2));

    if (!currentData.success || currentData.shift._id !== shiftId) {
      throw new Error('Get current shift failed!');
    }

    // 4. Create Sale and verify shift totals update
    console.log('\n--- 4. Testing Sale Completion & Shift Totals Update ---');
    const saleRes = await fetch(`${BASE_URL}/api/v1/sales`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: testCustomer._id,
        branchId: branch._id,
        shiftId: shiftId,
        items: [
          { productId: testProduct._id, quantity: 3, unitPrice: 100 } // Total 300
        ],
        payments: [
          { method: 'CASH', amount: 200 } // Cash 200, remaining 100 DEBT
        ]
      })
    });
    const saleData = await saleRes.json();
    console.log('Status:', saleRes.status);
    console.log('Sale Invoice:', saleData.sale.invoiceNumber);
    const saleId = saleData.sale._id;

    // Verify current shift updated totals (Expected cash: 500 opening + 200 cash = 700)
    const currentAfterSaleRes = await fetch(`${BASE_URL}/api/v1/shifts/current`, {
      method: 'GET',
      headers: authHeaders
    });
    const currentAfterSaleData = await currentAfterSaleRes.json();
    console.log('Current Shift after Sale:', JSON.stringify(currentAfterSaleData.shift, null, 2));

    if (
      currentAfterSaleData.shift.totalSales !== 300 ||
      currentAfterSaleData.shift.totalCash !== 200 ||
      currentAfterSaleData.shift.totalDebt !== 100 ||
      currentAfterSaleData.shift.expectedCash !== 700
    ) {
      throw new Error('Shift totals were not updated correctly after sale!');
    }

    // 5. Refund & verify shift totals update
    console.log('\n--- 5. Testing Refund & Shift Totals Update ---');
    const refundRes = await fetch(`${BASE_URL}/api/v1/sales/${saleId}/refund`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        items: [{ productId: testProduct._id, quantity: 1 }], // 100 EGP refund
        refundMethod: 'CASH',
        reason: 'استرجاع قطعه من الوردية'
      })
    });
    const refundData = await refundRes.json();
    console.log('Status:', refundRes.status);
    console.log('Refund Result:', JSON.stringify(refundData.returnRecord, null, 2));

    // Verify current shift after refund (Net cash: 200 - 100 = 100. Expected cash: 500 + 100 = 600)
    const currentAfterRefundRes = await fetch(`${BASE_URL}/api/v1/shifts/current`, {
      method: 'GET',
      headers: authHeaders
    });
    const currentAfterRefundData = await currentAfterRefundRes.json();
    console.log('Current Shift after Refund:', JSON.stringify(currentAfterRefundData.shift, null, 2));

    if (
      currentAfterRefundData.shift.totalReturns !== 100 ||
      currentAfterRefundData.shift.totalCash !== 100 ||
      currentAfterRefundData.shift.expectedCash !== 600
    ) {
      throw new Error('Shift totals were not updated correctly after refund!');
    }

    // 6. Test POST /api/v1/shifts/:id/close (Close Shift & Cash Reconciliation)
    console.log('\n--- 6. Testing POST /api/v1/shifts/:id/close ---');
    // Expected cash is 600. Let's submit actualCash = 620 (OVER by 20)
    const closeRes = await fetch(`${BASE_URL}/api/v1/shifts/${shiftId}/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        actualCash: 620,
        notes: 'إغلاق الوردية مع وجود زيادة 20 جنيه'
      })
    });
    const closeData = await closeRes.json();
    console.log('Status:', closeRes.status);
    console.log('Response:', JSON.stringify(closeData, null, 2));

    if (
      !closeData.success ||
      closeData.shift.status !== 'CLOSED' ||
      closeData.shift.expectedCash !== 600 ||
      closeData.shift.actualCash !== 620 ||
      closeData.shift.difference !== 20 ||
      closeData.shift.reconciliationStatus !== 'OVER'
    ) {
      throw new Error('Close shift reconciliation failed!');
    }

    // 7. Test Duplicate Close Shift Rejection
    console.log('\n--- 7. Testing Duplicate Close Shift Rejection ---');
    const dupCloseRes = await fetch(`${BASE_URL}/api/v1/shifts/${shiftId}/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ actualCash: 600 })
    });
    const dupCloseData = await dupCloseRes.json();
    console.log('Status:', dupCloseRes.status);
    console.log('Response:', JSON.stringify(dupCloseData, null, 2));

    if (dupCloseRes.status !== 400 || dupCloseData.success !== false) {
      throw new Error('Duplicate close shift was not rejected!');
    }
    console.log('✅ Duplicate close shift correctly rejected (400)');

    // 8. Test GET /api/v1/shifts/daily-report
    console.log('\n--- 8. Testing GET /api/v1/shifts/daily-report ---');
    const reportRes = await fetch(`${BASE_URL}/api/v1/shifts/daily-report`, {
      method: 'GET',
      headers: authHeaders
    });
    const reportData = await reportRes.json();
    console.log('Status:', reportRes.status);
    console.log('Response:', JSON.stringify(reportData, null, 2));

    if (!reportData.success || !reportData.report?.cashDifferenceSummary) {
      throw new Error('Get daily report failed!');
    }

    console.log('\nALL SHIFT MANAGEMENT ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Shifts Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
