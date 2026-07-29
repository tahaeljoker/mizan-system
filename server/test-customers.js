import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Customer from './models/Customer.js';
import CustomerTransaction from './models/CustomerTransaction.js';
import LoyaltyPoint from './models/LoyaltyPoint.js';

dotenv.config();

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Customers Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_CUST_ORG' });
    await User.deleteMany({ email: 'testcust@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_CUST_ORG',
      ownerName: 'Test Cust Owner',
      phone: '01011111111',
      plan: 'pro',
      status: 'active'
    });

    const branch = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });

    const user = await User.create({
      name: 'Test Cust Owner',
      email: 'testcust@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testcust@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testcust@mizan.com');

    await Customer.deleteMany({ orgId: org._id });

    // 1. Test POST /api/v1/customers
    console.log('\n--- 1. Testing POST /api/v1/customers ---');
    const createRes = await fetch(`${BASE_URL}/api/v1/customers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'عميل اختبار تجاري',
        phone: '01234567890',
        email: 'customer@test.com',
        barcode: 'CUST-001',
        nationalId: '29901011234567',
        creditLimit: 5000,
        openingBalance: 1000
      })
    });
    const createData = await createRes.json();
    console.log('Status:', createRes.status);
    console.log('Response:', JSON.stringify(createData, null, 2));

    if (!createData.success || !createData.customer?._id) {
      throw new Error('Create customer failed!');
    }
    const customerId = createData.customer._id;

    // 2. Test GET /api/v1/customers
    console.log('\n--- 2. Testing GET /api/v1/customers ---');
    const listRes = await fetch(`${BASE_URL}/api/v1/customers?search=عميل`, {
      method: 'GET',
      headers: authHeaders
    });
    const listData = await listRes.json();
    console.log('Status:', listRes.status);
    console.log('Response:', JSON.stringify(listData, null, 2));

    if (!listData.success || listData.data.length !== 1) {
      throw new Error('List customers failed!');
    }

    // 3. Test GET /api/v1/customers/:id
    console.log('\n--- 3. Testing GET /api/v1/customers/:id ---');
    const getRes = await fetch(`${BASE_URL}/api/v1/customers/${customerId}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getData = await getRes.json();
    console.log('Status:', getRes.status);
    console.log('Response:', JSON.stringify(getData, null, 2));

    if (!getData.success || getData.customer._id !== customerId) {
      throw new Error('Get customer by ID failed!');
    }

    // 4. Test PUT /api/v1/customers/:id
    console.log('\n--- 4. Testing PUT /api/v1/customers/:id ---');
    const updateRes = await fetch(`${BASE_URL}/api/v1/customers/${customerId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ name: 'عميل اختبار معدل' })
    });
    const updateData = await updateRes.json();
    console.log('Status:', updateRes.status);
    console.log('Response:', JSON.stringify(updateData, null, 2));

    if (!updateData.success || updateData.customer.name !== 'عميل اختبار معدل') {
      throw new Error('Update customer failed!');
    }

    // 5. Test POST /api/v1/customers/:id/settle (Settle debt)
    console.log('\n--- 5. Testing POST /api/v1/customers/:id/settle ---');
    const settleRes = await fetch(`${BASE_URL}/api/v1/customers/${customerId}/settle`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 400,
        type: 'PAYMENT',
        reference: 'REC-001',
        notes: 'سداد جزئي للحساب'
      })
    });
    const settleData = await settleRes.json();
    console.log('Status:', settleRes.status);
    console.log('Response:', JSON.stringify(settleData, null, 2));

    if (!settleData.success || settleData.customer.balance !== 600) {
      throw new Error('Settle customer debt failed!');
    }

    // 6. Test GET /api/v1/customers/:id/statement
    console.log('\n--- 6. Testing GET /api/v1/customers/:id/statement ---');
    const stmtRes = await fetch(`${BASE_URL}/api/v1/customers/${customerId}/statement`, {
      method: 'GET',
      headers: authHeaders
    });
    const stmtData = await stmtRes.json();
    console.log('Status:', stmtRes.status);
    console.log('Response:', JSON.stringify(stmtData, null, 2));

    if (!stmtData.success || stmtData.data.length < 2) {
      throw new Error('Customer statement failed!');
    }

    // 7. Test PATCH /api/v1/customers/:id/loyalty
    console.log('\n--- 7. Testing PATCH /api/v1/customers/:id/loyalty ---');
    const loyaltyRes = await fetch(`${BASE_URL}/api/v1/customers/${customerId}/loyalty`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        points: 50,
        type: 'EARN',
        description: 'مكافأة الشراء التجاري'
      })
    });
    const loyaltyData = await loyaltyRes.json();
    console.log('Status:', loyaltyRes.status);
    console.log('Response:', JSON.stringify(loyaltyData, null, 2));

    if (!loyaltyData.success || loyaltyData.customer.loyaltyPoints !== 50) {
      throw new Error('Customer loyalty update failed!');
    }

    // 8. Test DELETE /api/v1/customers/:id
    console.log('\n--- 8. Testing DELETE /api/v1/customers/:id ---');
    const deleteRes = await fetch(`${BASE_URL}/api/v1/customers/${customerId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteData = await deleteRes.json();
    console.log('Status:', deleteRes.status);
    console.log('Response:', JSON.stringify(deleteData, null, 2));

    if (!deleteData.success) {
      throw new Error('Delete customer failed!');
    }

    console.log('\nALL CUSTOMERS ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Customers Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
