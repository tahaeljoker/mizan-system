import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Product from './models/Product.js';
import Supplier from './models/Supplier.js';
import SupplierTransaction from './models/SupplierTransaction.js';
import PurchaseOrder from './models/PurchaseOrder.js';

dotenv.config();

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Suppliers & PO Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_SUPP_ORG' });
    await User.deleteMany({ email: 'testsupp@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_SUPP_ORG',
      ownerName: 'Test Supp Owner',
      phone: '01022222222',
      plan: 'pro',
      status: 'active'
    });

    const branch = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });

    const user = await User.create({
      name: 'Test Supp Owner',
      email: 'testsupp@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testsupp@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testsupp@mizan.com');

    await Supplier.deleteMany({ orgId: org._id });
    await Product.deleteMany({ orgId: org._id });
    await PurchaseOrder.deleteMany({ orgId: org._id });

    const testProduct = await Product.create({
      orgId: org._id,
      name: 'منتج توريد تجاري',
      barcode: 'SUPP-BAR-001',
      sku: 'SUPP-SKU-001',
      category: 'توريدات',
      sellPrice: 150,
      costPrice: 80,
      stock: 10,
      minStock: 5,
      branchId: branch._id
    });

    // 1. Test POST /api/v1/suppliers
    console.log('\n--- 1. Testing POST /api/v1/suppliers ---');
    const createSuppRes = await fetch(`${BASE_URL}/api/v1/suppliers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        company: 'شركة التوريدات الحديثة',
        contactPerson: 'المهندس أحمد',
        phone: '01122334455',
        email: 'supplier@company.com',
        taxNumber: '123456789',
        address: 'القاهرة - مصر',
        openingBalance: 500
      })
    });
    const createSuppData = await createSuppRes.json();
    console.log('Status:', createSuppRes.status);
    console.log('Response:', JSON.stringify(createSuppData, null, 2));

    if (!createSuppData.success || !createSuppData.supplier?._id) {
      throw new Error('Create supplier failed!');
    }
    const supplierId = createSuppData.supplier._id;

    // 2. Test GET /api/v1/suppliers
    console.log('\n--- 2. Testing GET /api/v1/suppliers ---');
    const listSuppRes = await fetch(`${BASE_URL}/api/v1/suppliers?search=حديثة`, {
      method: 'GET',
      headers: authHeaders
    });
    const listSuppData = await listSuppRes.json();
    console.log('Status:', listSuppRes.status);
    console.log('Response:', JSON.stringify(listSuppData, null, 2));

    if (!listSuppData.success || listSuppData.data.length !== 1) {
      throw new Error('List suppliers failed!');
    }

    // 3. Test GET /api/v1/suppliers/:id
    console.log('\n--- 3. Testing GET /api/v1/suppliers/:id ---');
    const getSuppRes = await fetch(`${BASE_URL}/api/v1/suppliers/${supplierId}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getSuppData = await getSuppRes.json();
    console.log('Status:', getSuppRes.status);
    console.log('Response:', JSON.stringify(getSuppData, null, 2));

    if (!getSuppData.success || getSuppData.supplier._id !== supplierId) {
      throw new Error('Get supplier by ID failed!');
    }

    // 4. Test PUT /api/v1/suppliers/:id
    console.log('\n--- 4. Testing PUT /api/v1/suppliers/:id ---');
    const updateSuppRes = await fetch(`${BASE_URL}/api/v1/suppliers/${supplierId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ company: 'شركة التوريدات العالمية' })
    });
    const updateSuppData = await updateSuppRes.json();
    console.log('Status:', updateSuppRes.status);
    console.log('Response:', JSON.stringify(updateSuppData, null, 2));

    if (!updateSuppData.success || updateSuppData.supplier.company !== 'شركة التوريدات العالمية') {
      throw new Error('Update supplier failed!');
    }

    // 5. Test POST /api/v1/purchase-orders (Create PO)
    console.log('\n--- 5. Testing POST /api/v1/purchase-orders ---');
    const createPORes = await fetch(`${BASE_URL}/api/v1/purchase-orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        supplierId,
        branchId: branch._id,
        notes: 'شراء كمية إضافية للمخزن الرئيسي',
        items: [
          { productId: testProduct._id, quantity: 20, costPrice: 80 }
        ]
      })
    });
    const createPOData = await createPORes.json();
    console.log('Status:', createPORes.status);
    console.log('Response:', JSON.stringify(createPOData, null, 2));

    if (!createPOData.success || !createPOData.purchaseOrder?._id) {
      throw new Error('Create purchase order failed!');
    }
    const poId = createPOData.purchaseOrder._id;

    // 6. Test GET /api/v1/purchase-orders
    console.log('\n--- 6. Testing GET /api/v1/purchase-orders ---');
    const listPORes = await fetch(`${BASE_URL}/api/v1/purchase-orders`, {
      method: 'GET',
      headers: authHeaders
    });
    const listPOData = await listPORes.json();
    console.log('Status:', listPORes.status);
    console.log('Response:', JSON.stringify(listPOData, null, 2));

    if (!listPOData.success || listPOData.data.length !== 1) {
      throw new Error('List purchase orders failed!');
    }

    // 7. Test POST /api/v1/purchase-orders/:id/receive (Receive PO & update stock/ledger)
    console.log('\n--- 7. Testing POST /api/v1/purchase-orders/:id/receive ---');
    const receivePORes = await fetch(`${BASE_URL}/api/v1/purchase-orders/${poId}/receive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        notes: 'تم استلام البضاعة بالفحص الجيد'
      })
    });
    const receivePOData = await receivePORes.json();
    console.log('Status:', receivePORes.status);
    console.log('Response:', JSON.stringify(receivePOData, null, 2));

    if (!receivePOData.success || receivePOData.purchaseOrder.status !== 'RECEIVED') {
      throw new Error('Receive purchase order failed!');
    }

    // Check Product stock updated from 10 to 30
    const updatedProd = await Product.findById(testProduct._id);
    console.log(`Updated Product stock: ${updatedProd.stock} (Expected 30)`);
    if (updatedProd.stock !== 30) {
      throw new Error('Product stock was not increased upon receiving PO!');
    }

    // Check Supplier balance updated (500 + (20 * 80) = 2100)
    const updatedSupp = await Supplier.findById(supplierId);
    console.log(`Updated Supplier balance: ${updatedSupp.balance} (Expected 2100)`);
    if (updatedSupp.balance !== 2100) {
      throw new Error('Supplier balance was not updated upon receiving PO!');
    }

    // 8. Test POST /api/v1/suppliers/:id/settle (Supplier Settle)
    console.log('\n--- 8. Testing POST /api/v1/suppliers/:id/settle ---');
    const settleSuppRes = await fetch(`${BASE_URL}/api/v1/suppliers/${supplierId}/settle`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 1000,
        type: 'PAYMENT',
        reference: 'PAY-PO-001',
        notes: 'دفعة سداد حساب المورد'
      })
    });
    const settleSuppData = await settleSuppRes.json();
    console.log('Status:', settleSuppRes.status);
    console.log('Response:', JSON.stringify(settleSuppData, null, 2));

    if (!settleSuppData.success || settleSuppData.supplier.balance !== 1100) {
      throw new Error('Supplier debt settlement failed!');
    }

    // 9. Test GET /api/v1/suppliers/:id/statement
    console.log('\n--- 9. Testing GET /api/v1/suppliers/:id/statement ---');
    const stmtSuppRes = await fetch(`${BASE_URL}/api/v1/suppliers/${supplierId}/statement`, {
      method: 'GET',
      headers: authHeaders
    });
    const stmtSuppData = await stmtSuppRes.json();
    console.log('Status:', stmtSuppRes.status);
    console.log('Response:', JSON.stringify(stmtSuppData, null, 2));

    if (!stmtSuppData.success || stmtSuppData.data.length < 3) {
      throw new Error('Supplier statement failed!');
    }

    // 10. Test DELETE /api/v1/suppliers/:id
    console.log('\n--- 10. Testing DELETE /api/v1/suppliers/:id ---');
    const deleteSuppRes = await fetch(`${BASE_URL}/api/v1/suppliers/${supplierId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteSuppData = await deleteSuppRes.json();
    console.log('Status:', deleteSuppRes.status);
    console.log('Response:', JSON.stringify(deleteSuppData, null, 2));

    if (!deleteSuppData.success) {
      throw new Error('Delete supplier failed!');
    }

    console.log('\nALL SUPPLIERS & PURCHASE ORDERS ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Suppliers Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
