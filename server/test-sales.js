import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import Sale from './models/Sale.js';
import Return from './models/Return.js';

dotenv.config();

const PORT = 5100;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Sales & POS Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_SALE_ORG' });
    await User.deleteMany({ email: 'testsale@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_SALE_ORG',
      ownerName: 'Test Sale Owner',
      phone: '01033333333',
      plan: 'pro',
      status: 'active'
    });

    const branch = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });

    const user = await User.create({
      name: 'Test Sale Cashier',
      email: 'testsale@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testsale@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testsale@mizan.com');

    await Product.deleteMany({ orgId: org._id });
    await Customer.deleteMany({ orgId: org._id });
    await Sale.deleteMany({ orgId: org._id });
    await Return.deleteMany({ orgId: org._id });

    const product1 = await Product.create({
      orgId: org._id,
      name: 'منتج مبيعات 1',
      barcode: 'SALE-BAR-001',
      sku: 'SALE-SKU-001',
      category: 'إلكترونيات',
      sellPrice: 500,
      costPrice: 350,
      stock: 100,
      minStock: 10,
      branchId: branch._id
    });

    const product2 = await Product.create({
      orgId: org._id,
      name: 'منتج مبيعات 2',
      barcode: 'SALE-BAR-002',
      sku: 'SALE-SKU-002',
      category: 'إلكترونيات',
      sellPrice: 200,
      costPrice: 120,
      stock: 50,
      minStock: 5,
      branchId: branch._id
    });

    const customer = await Customer.create({
      orgId: org._id,
      name: 'عميل آجل ممتاز',
      phone: '01555555555',
      balance: 0,
      loyaltyPoints: 0
    });

    // 1. Test POST /api/v1/sales (Create Completed Sale with Cash + Debt + Loyalty)
    console.log('\n--- 1. Testing POST /api/v1/sales ---');
    const createSaleRes = await fetch(`${BASE_URL}/api/v1/sales`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: customer._id,
        branchId: branch._id,
        items: [
          { productId: product1._id, quantity: 2, unitPrice: 500 }, // Total 1000
          { productId: product2._id, quantity: 1, unitPrice: 200 }  // Total 200 => Subtotal 1200
        ],
        payments: [
          { method: 'CASH', amount: 700 }
          // Remaining 500 automatically converted to DEBT
        ],
        discount: 0,
        notes: 'فاتورة مبيعات POS جديدة'
      })
    });
    const createSaleData = await createSaleRes.json();
    console.log('Status:', createSaleRes.status);
    console.log('Response:', JSON.stringify(createSaleData, null, 2));

    if (!createSaleData.success || !createSaleData.sale?._id) {
      throw new Error('Create sale failed!');
    }
    const saleId = createSaleData.sale._id;
    const invoiceNumber = createSaleData.sale.invoiceNumber;
    console.log(`Generated Invoice Number: ${invoiceNumber}`);

    // Verify stock decrease (Prod 1: 100 -> 98, Prod 2: 50 -> 49)
    const updatedProd1 = await Product.findById(product1._id);
    const updatedProd2 = await Product.findById(product2._id);
    console.log(`Product 1 new stock: ${updatedProd1.stock} (Expected 98)`);
    console.log(`Product 2 new stock: ${updatedProd2.stock} (Expected 49)`);
    if (updatedProd1.stock !== 98 || updatedProd2.stock !== 49) {
      throw new Error('Product stock was not decreased properly after sale!');
    }

    // Verify Customer balance (0 -> 500) and Loyalty points earned (1200 / 10 = 120 points)
    const updatedCust = await Customer.findById(customer._id);
    console.log(`Customer new balance: ${updatedCust.balance} (Expected 500)`);
    console.log(`Customer loyalty points: ${updatedCust.loyaltyPoints} (Expected 120)`);
    if (updatedCust.balance !== 500 || updatedCust.loyaltyPoints !== 120) {
      throw new Error('Customer balance or loyalty points not updated after sale!');
    }

    // 2. Test GET /api/v1/sales
    console.log('\n--- 2. Testing GET /api/v1/sales ---');
    const listSalesRes = await fetch(`${BASE_URL}/api/v1/sales`, {
      method: 'GET',
      headers: authHeaders
    });
    const listSalesData = await listSalesRes.json();
    console.log('Status:', listSalesRes.status);
    console.log('Response:', JSON.stringify(listSalesData, null, 2));

    if (!listSalesData.success || listSalesData.data.length !== 1) {
      throw new Error('List sales failed!');
    }

    // 3. Test GET /api/v1/sales/:id
    console.log('\n--- 3. Testing GET /api/v1/sales/:id ---');
    const getSaleRes = await fetch(`${BASE_URL}/api/v1/sales/${saleId}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getSaleData = await getSaleRes.json();
    console.log('Status:', getSaleRes.status);
    console.log('Response:', JSON.stringify(getSaleData, null, 2));

    if (!getSaleData.success || getSaleData.sale._id !== saleId) {
      throw new Error('Get sale by ID failed!');
    }

    // 4. Test GET /api/v1/sales/invoice/:invoiceNumber
    console.log('\n--- 4. Testing GET /api/v1/sales/invoice/:invoiceNumber ---');
    const getByInvRes = await fetch(`${BASE_URL}/api/v1/sales/invoice/${invoiceNumber}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getByInvData = await getByInvRes.json();
    console.log('Status:', getByInvRes.status);
    console.log('Response:', JSON.stringify(getByInvData, null, 2));

    if (!getByInvData.success || getByInvData.sale.invoiceNumber !== invoiceNumber) {
      throw new Error('Get sale by invoice number failed!');
    }

    // 5. Test POST /api/v1/sales/hold (Hold Sale)
    console.log('\n--- 5. Testing POST /api/v1/sales/hold ---');
    const holdRes = await fetch(`${BASE_URL}/api/v1/sales/hold`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: customer._id,
        items: [
          { productId: product1._id, quantity: 1, unitPrice: 500 }
        ],
        notes: 'فاتورة مؤجلة مؤقتاً'
      })
    });
    const holdData = await holdRes.json();
    console.log('Status:', holdRes.status);
    console.log('Response:', JSON.stringify(holdData, null, 2));

    if (!holdData.success || holdData.sale.status !== 'HELD') {
      throw new Error('Hold sale failed!');
    }
    const heldSaleId = holdData.sale._id;

    // 6. Test POST /api/v1/sales/:id/resume (Resume Sale)
    console.log('\n--- 6. Testing POST /api/v1/sales/:id/resume ---');
    const resumeRes = await fetch(`${BASE_URL}/api/v1/sales/${heldSaleId}/resume`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: customer._id,
        items: [
          { productId: product1._id, quantity: 1, unitPrice: 500 }
        ],
        payments: [
          { method: 'CASH', amount: 500 }
        ]
      })
    });
    const resumeData = await resumeRes.json();
    console.log('Status:', resumeRes.status);
    console.log('Response:', JSON.stringify(resumeData, null, 2));

    if (!resumeData.success || resumeData.sale.status !== 'COMPLETED') {
      throw new Error('Resume sale failed!');
    }

    // 7. Test POST /api/v1/sales/:id/refund (Refund Sale)
    console.log('\n--- 7. Testing POST /api/v1/sales/:id/refund ---');
    const refundRes = await fetch(`${BASE_URL}/api/v1/sales/${saleId}/refund`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        items: [
          { productId: product2._id, quantity: 1 } // Refund product2 (200 EGP)
        ],
        refundMethod: 'CUSTOMER_BALANCE',
        reason: 'منتج غير مطابق'
      })
    });
    const refundData = await refundRes.json();
    console.log('Status:', refundRes.status);
    console.log('Response:', JSON.stringify(refundData, null, 2));

    if (!refundData.success || refundData.sale.status !== 'PARTIAL_REFUND') {
      throw new Error('Refund sale failed!');
    }

    // Product 2 stock restored (49 -> 50)
    const restoredProd2 = await Product.findById(product2._id);
    console.log(`Product 2 stock after refund: ${restoredProd2.stock} (Expected 50)`);
    if (restoredProd2.stock !== 50) {
      throw new Error('Product stock was not restored after refund!');
    }

    // 8. Test PATCH /api/v1/sales/:id/cancel (Cancel Sale)
    console.log('\n--- 8. Testing PATCH /api/v1/sales/:id/cancel ---');
    const cancelRes = await fetch(`${BASE_URL}/api/v1/sales/${saleId}/cancel`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        reason: 'إلغاء الفاتورة بالكامل بنا على طلب العميل'
      })
    });
    const cancelData = await cancelRes.json();
    console.log('Status:', cancelRes.status);
    console.log('Response:', JSON.stringify(cancelData, null, 2));

    if (!cancelData.success || cancelData.sale.status !== 'CANCELLED') {
      throw new Error('Cancel sale failed!');
    }

    // 9. Test GET /api/v1/sales/history
    console.log('\n--- 9. Testing GET /api/v1/sales/history ---');
    const historyRes = await fetch(`${BASE_URL}/api/v1/sales/history`, {
      method: 'GET',
      headers: authHeaders
    });
    const historyData = await historyRes.json();
    console.log('Status:', historyRes.status);
    console.log('Response:', JSON.stringify(historyData, null, 2));

    if (!historyData.success) {
      throw new Error('Get sales history failed!');
    }

    // 10. Test GET /api/v1/sales/daily-summary
    console.log('\n--- 10. Testing GET /api/v1/sales/daily-summary ---');
    const summaryRes = await fetch(`${BASE_URL}/api/v1/sales/daily-summary`, {
      method: 'GET',
      headers: authHeaders
    });
    const summaryData = await summaryRes.json();
    console.log('Status:', summaryRes.status);
    console.log('Response:', JSON.stringify(summaryData, null, 2));

    if (!summaryData.success || summaryData.summary?.salesCount === undefined) {
      throw new Error('Get daily summary failed!');
    }

    console.log('\nALL SALES & POS ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Sales Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
