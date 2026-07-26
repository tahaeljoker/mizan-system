import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Product from './models/Product.js';
import Branch from './models/Branch.js';
import InventoryTransaction from './models/InventoryTransaction.js';
import ActivityLog from './models/ActivityLog.js';
import StockCountSession from './models/StockCountSession.js';
import StockTransfer from './models/StockTransfer.js';

dotenv.config();

const PORT = 5097;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Inventory Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    // Seed test org, branches, users & products
    await Organization.deleteMany({ name: 'TEST_INV_ORG' });
    await User.deleteMany({ email: 'testinv@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_INV_ORG',
      ownerName: 'Test Inv Owner',
      phone: '01000000000',
      plan: 'pro',
      status: 'active'
    });

    const branch1 = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });
    const branch2 = await Branch.create({ name: 'فرع المعادي', orgId: org._id, code: 'BR2', isMain: false });

    const user = await User.create({
      name: 'Test Inv Owner',
      email: 'testinv@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch1._id,
      branchName: branch1.name,
      status: 'active'
    });

    // Obtain JWT token
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

    // Create test products
    await Product.deleteMany({ orgId: org._id });
    const prod1 = await Product.create({
      orgId: org._id,
      name: 'منتج اختبار 1',
      barcode: 'INV-BAR-001',
      sku: 'INV-SKU-001',
      category: 'عام',
      sellPrice: 100,
      stock: 50,
      minStock: 10,
      branchId: branch1._id
    });

    const prod2 = await Product.create({
      orgId: org._id,
      name: 'منتج اختبار 2',
      barcode: 'INV-BAR-002',
      sku: 'INV-SKU-002',
      category: 'عام',
      sellPrice: 200,
      stock: 5,
      minStock: 10,
      branchId: branch1._id
    });

    const prod3 = await Product.create({
      orgId: org._id,
      name: 'منتج نفد مخزونه',
      barcode: 'INV-BAR-003',
      sku: 'INV-SKU-003',
      category: 'عام',
      sellPrice: 300,
      stock: 0,
      minStock: 5,
      branchId: branch1._id
    });

    // 1. Test POST /api/v1/inventory/sessions (Create Session)
    console.log('\n--- 1. Testing POST /api/v1/inventory/sessions ---');
    const createSessionRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'جرد نهاية الشهر',
        branchId: branch1._id,
        items: [
          { productId: prod1._id, systemQuantity: 50 },
          { productId: prod2._id, systemQuantity: 5 }
        ]
      })
    });
    const createSessionData = await createSessionRes.json();
    console.log('Status:', createSessionRes.status);
    console.log('Response:', JSON.stringify(createSessionData, null, 2));

    if (!createSessionData.success || !createSessionData.session?._id) {
      throw new Error('Create session failed!');
    }
    const sessionId = createSessionData.session._id;

    // 2. Test GET /api/v1/inventory/sessions (List Sessions)
    console.log('\n--- 2. Testing GET /api/v1/inventory/sessions ---');
    const listSessionsRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions?page=1&limit=10`, {
      method: 'GET',
      headers: authHeaders
    });
    const listSessionsData = await listSessionsRes.json();
    console.log('Status:', listSessionsRes.status);
    console.log('Response:', JSON.stringify(listSessionsData, null, 2));

    if (!listSessionsData.success || listSessionsData.data.length !== 1) {
      throw new Error('List sessions failed!');
    }

    // 3. Test GET /api/v1/inventory/sessions/:id
    console.log('\n--- 3. Testing GET /api/v1/inventory/sessions/:id ---');
    const getSessionRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions/${sessionId}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getSessionData = await getSessionRes.json();
    console.log('Status:', getSessionRes.status);
    console.log('Response:', JSON.stringify(getSessionData, null, 2));

    if (!getSessionData.success || getSessionData.session._id !== sessionId) {
      throw new Error('Get session by ID failed!');
    }

    // 4. Test PUT /api/v1/inventory/sessions/:id
    console.log('\n--- 4. Testing PUT /api/v1/inventory/sessions/:id ---');
    const updateSessionRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions/${sessionId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ title: 'جرد ربع سنوي معدل' })
    });
    const updateSessionData = await updateSessionRes.json();
    console.log('Status:', updateSessionRes.status);
    console.log('Response:', JSON.stringify(updateSessionData, null, 2));

    if (!updateSessionData.success || updateSessionData.session.title !== 'جرد ربع سنوي معدل') {
      throw new Error('Update session failed!');
    }

    // 5. Test POST /api/v1/inventory/sessions/:id/count (Blind Count Submission)
    console.log('\n--- 5. Testing POST /api/v1/inventory/sessions/:id/count ---');
    const countRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions/${sessionId}/count`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        items: [
          { productId: prod1._id, countedQuantity: 48 }, // 2 missing
          { productId: prod2._id, countedQuantity: 6 }   // 1 extra
        ]
      })
    });
    const countData = await countRes.json();
    console.log('Status:', countRes.status);
    console.log('Response:', JSON.stringify(countData, null, 2));

    if (!countData.success || countData.session.status !== 'UNDER_REVIEW') {
      throw new Error('Submit blind count failed!');
    }

    // 6. Test POST /api/v1/inventory/sessions/:id/review (Manager Review)
    console.log('\n--- 6. Testing POST /api/v1/inventory/sessions/:id/review ---');
    const reviewRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions/${sessionId}/review`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'APPROVE',
        notes: 'تمت مراجعة الفروقات من قبل مدير الفرع'
      })
    });
    const reviewData = await reviewRes.json();
    console.log('Status:', reviewRes.status);
    console.log('Response:', JSON.stringify(reviewData, null, 2));

    if (!reviewData.success) {
      throw new Error('Manager review failed!');
    }

    // 7. Test POST /api/v1/inventory/sessions/:id/approve (Owner Approval & Product Stock Update)
    console.log('\n--- 7. Testing POST /api/v1/inventory/sessions/:id/approve ---');
    const approveRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions/${sessionId}/approve`, {
      method: 'POST',
      headers: authHeaders
    });
    const approveData = await approveRes.json();
    console.log('Status:', approveRes.status);
    console.log('Response:', JSON.stringify(approveData, null, 2));

    if (!approveData.success || approveData.session.status !== 'APPROVED') {
      throw new Error('Owner approval failed!');
    }

    // Check product stock updated to 48 and 6
    const updatedProd1 = await Product.findById(prod1._id);
    const updatedProd2 = await Product.findById(prod2._id);
    console.log(`Product 1 new stock: ${updatedProd1.stock} (Expected 48)`);
    console.log(`Product 2 new stock: ${updatedProd2.stock} (Expected 6)`);
    if (updatedProd1.stock !== 48 || updatedProd2.stock !== 6) {
      throw new Error('Product stock update after owner approval failed!');
    }

    // 8. Test PATCH /api/v1/inventory/adjust (Manual Stock Adjustment)
    console.log('\n--- 8. Testing PATCH /api/v1/inventory/adjust ---');
    const adjustRes = await fetch(`${BASE_URL}/api/v1/inventory/adjust`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        productId: prod1._id,
        branchId: branch1._id,
        quantity: 10,
        type: 'PURCHASE',
        reason: 'شراء بضاعة إضافية'
      })
    });
    const adjustData = await adjustRes.json();
    console.log('Status:', adjustRes.status);
    console.log('Response:', JSON.stringify(adjustData, null, 2));

    if (!adjustData.success || adjustData.product.stock !== 58) {
      throw new Error('Manual stock adjustment failed!');
    }

    // 9. Test GET /api/v1/inventory/history (Inventory History)
    console.log('\n--- 9. Testing GET /api/v1/inventory/history ---');
    const historyRes = await fetch(`${BASE_URL}/api/v1/inventory/history?page=1&limit=10`, {
      method: 'GET',
      headers: authHeaders
    });
    const historyData = await historyRes.json();
    console.log('Status:', historyRes.status);
    console.log('Response:', JSON.stringify(historyData, null, 2));

    if (!historyData.success || historyData.data.length < 1) {
      throw new Error('Get inventory history failed!');
    }

    // 10. Test GET /api/v1/inventory/low-stock
    console.log('\n--- 10. Testing GET /api/v1/inventory/low-stock ---');
    const lowStockRes = await fetch(`${BASE_URL}/api/v1/inventory/low-stock`, {
      method: 'GET',
      headers: authHeaders
    });
    const lowStockData = await lowStockRes.json();
    console.log('Status:', lowStockRes.status);
    console.log('Response:', JSON.stringify(lowStockData, null, 2));

    if (!lowStockData.success || lowStockData.data.length < 1) {
      throw new Error('Get low stock failed!');
    }

    // 11. Test GET /api/v1/inventory/out-of-stock
    console.log('\n--- 11. Testing GET /api/v1/inventory/out-of-stock ---');
    const outOfStockRes = await fetch(`${BASE_URL}/api/v1/inventory/out-of-stock`, {
      method: 'GET',
      headers: authHeaders
    });
    const outOfStockData = await outOfStockRes.json();
    console.log('Status:', outOfStockRes.status);
    console.log('Response:', JSON.stringify(outOfStockData, null, 2));

    if (!outOfStockData.success || outOfStockData.data.length < 1) {
      throw new Error('Get out of stock failed!');
    }

    // 12. Test POST /api/v1/inventory/transfers (Create Transfer)
    console.log('\n--- 12. Testing POST /api/v1/inventory/transfers ---');
    const createTransferRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fromBranchId: branch1._id,
        toBranchId: branch2._id,
        notes: 'تحويل بين الفروع',
        items: [
          { productId: prod1._id, quantity: 5 }
        ]
      })
    });
    const createTransferData = await createTransferRes.json();
    console.log('Status:', createTransferRes.status);
    console.log('Response:', JSON.stringify(createTransferData, null, 2));

    if (!createTransferData.success || !createTransferData.transfer?._id) {
      throw new Error('Create transfer failed!');
    }
    const transferId = createTransferData.transfer._id;

    // 13. Test GET /api/v1/inventory/transfers
    console.log('\n--- 13. Testing GET /api/v1/inventory/transfers ---');
    const listTransfersRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers`, {
      method: 'GET',
      headers: authHeaders
    });
    const listTransfersData = await listTransfersRes.json();
    console.log('Status:', listTransfersRes.status);
    console.log('Response:', JSON.stringify(listTransfersData, null, 2));

    if (!listTransfersData.success || listTransfersData.data.length !== 1) {
      throw new Error('List transfers failed!');
    }

    // 14. Test GET /api/v1/inventory/transfers/:id
    console.log('\n--- 14. Testing GET /api/v1/inventory/transfers/:id ---');
    const getTransferRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers/${transferId}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getTransferData = await getTransferRes.json();
    console.log('Status:', getTransferRes.status);
    console.log('Response:', JSON.stringify(getTransferData, null, 2));

    if (!getTransferData.success || getTransferData.transfer._id !== transferId) {
      throw new Error('Get transfer by ID failed!');
    }

    // 15. Test POST /api/v1/inventory/transfers/:id/approve
    console.log('\n--- 15. Testing POST /api/v1/inventory/transfers/:id/approve ---');
    const approveTransferRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers/${transferId}/approve`, {
      method: 'POST',
      headers: authHeaders
    });
    const approveTransferData = await approveTransferRes.json();
    console.log('Status:', approveTransferRes.status);
    console.log('Response:', JSON.stringify(approveTransferData, null, 2));

    if (!approveTransferData.success || approveTransferData.transfer.status !== 'APPROVED') {
      throw new Error('Approve transfer failed!');
    }

    // 16. Test POST /api/v1/inventory/transfers/:id/receive (Receive & Stock Transactions)
    console.log('\n--- 16. Testing POST /api/v1/inventory/transfers/:id/receive ---');
    const receiveTransferRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers/${transferId}/receive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        notes: 'تم استلام الشحنة كاملة بالفرع الآخر'
      })
    });
    const receiveTransferData = await receiveTransferRes.json();
    console.log('Status:', receiveTransferRes.status);
    console.log('Response:', JSON.stringify(receiveTransferData, null, 2));

    if (!receiveTransferData.success || receiveTransferData.transfer.status !== 'RECEIVED') {
      throw new Error('Receive transfer failed!');
    }

    // 17. Test POST /api/v1/inventory/sessions/:id/reject & POST /api/v1/inventory/transfers/:id/reject
    console.log('\n--- 17. Testing Reject Endpoints ---');
    // Create draft session to reject
    const draftSession = await StockCountSession.create({
      orgId: org._id,
      sessionNumber: `CNT-REJ-${Date.now()}`,
      status: 'DRAFT',
      createdBy: user._id
    });
    const rejSessionRes = await fetch(`${BASE_URL}/api/v1/inventory/sessions/${draftSession._id}/reject`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'إلغاء الجرد بسبب تغيير الخطة' })
    });
    const rejSessionData = await rejSessionRes.json();

    // Create draft transfer to reject
    const draftTransfer = await StockTransfer.create({
      orgId: org._id,
      transferNumber: `TRF-REJ-${Date.now()}`,
      fromBranchId: branch1._id,
      toBranchId: branch2._id,
      status: 'CREATED',
      createdBy: user._id
    });
    const rejTransferRes = await fetch(`${BASE_URL}/api/v1/inventory/transfers/${draftTransfer._id}/reject`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'عدم توفر وسائل النقل' })
    });
    const rejTransferData = await rejTransferRes.json();

    if (!rejSessionData.success || !rejTransferData.success) {
      throw new Error('Reject session or transfer failed!');
    }

    console.log('\nALL INVENTORY ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
