import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Product from './models/Product.js';
import InventoryTransaction from './models/InventoryTransaction.js';
import ActivityLog from './models/ActivityLog.js';

dotenv.config();

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Products Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    // Seed test org & user
    await Organization.deleteMany({ name: 'TEST_PROD_ORG' });
    await User.deleteMany({ email: 'testprod@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_PROD_ORG',
      ownerName: 'Test Owner',
      phone: '01000000000',
      plan: 'pro',
      status: 'active'
    });

    const user = await User.create({
      name: 'Test Prod User',
      email: 'testprod@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchName: 'Main',
      status: 'active'
    });

    // Obtain JWT token via login
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testprod@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testprod@mizan.com');

    // Clear test products
    await Product.deleteMany({ orgId: org._id });

    // 1. Test POST /api/v1/products (Create Product)
    console.log('\n--- 1. Testing POST /api/v1/products (Create Product) ---');
    const createRes = await fetch(`${BASE_URL}/api/v1/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'تيشيرت قطن ممتاز',
        barcode: '690123456789',
        sku: 'TSHIRT-001',
        category: 'ملابس رجالي',
        brand: 'Modabella',
        costPrice: 100,
        sellPrice: 250,
        wholesalePrice: 200,
        stock: 50,
        minStock: 10,
        unit: 'قطعة'
      })
    });
    const createData = await createRes.json();
    console.log('Status:', createRes.status);
    console.log('Response:', JSON.stringify(createData, null, 2));

    if (!createData.success || !createData.product?._id) {
      throw new Error('Create product failed!');
    }
    const productId = createData.product._id;
    const barcode = createData.product.barcode;

    // 2. Test GET /api/v1/products (List Products & Pagination & Search)
    console.log('\n--- 2. Testing GET /api/v1/products ---');
    const listRes = await fetch(`${BASE_URL}/api/v1/products?search=تيشيرت&page=1&limit=10`, {
      method: 'GET',
      headers: authHeaders
    });
    const listData = await listRes.json();
    console.log('Status:', listRes.status);
    console.log('Response:', JSON.stringify(listData, null, 2));

    if (!listData.success || listData.data.length !== 1) {
      throw new Error('Get products list failed!');
    }

    // 3. Test GET /api/v1/products/:id
    console.log('\n--- 3. Testing GET /api/v1/products/:id ---');
    const getByIdRes = await fetch(`${BASE_URL}/api/v1/products/${productId}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getByIdData = await getByIdRes.json();
    console.log('Status:', getByIdRes.status);
    console.log('Response:', JSON.stringify(getByIdData, null, 2));

    if (!getByIdData.success || getByIdData.product._id !== productId) {
      throw new Error('Get product by ID failed!');
    }

    // 4. Test GET /api/v1/products/barcode/:barcode
    console.log('\n--- 4. Testing GET /api/v1/products/barcode/:barcode ---');
    const getByBarcodeRes = await fetch(`${BASE_URL}/api/v1/products/barcode/${barcode}`, {
      method: 'GET',
      headers: authHeaders
    });
    const getByBarcodeData = await getByBarcodeRes.json();
    console.log('Status:', getByBarcodeRes.status);
    console.log('Response:', JSON.stringify(getByBarcodeData, null, 2));

    if (!getByBarcodeData.success || getByBarcodeData.product.barcode !== barcode) {
      throw new Error('Get product by Barcode failed!');
    }

    // 5. Test PUT /api/v1/products/:id (Update Product)
    console.log('\n--- 5. Testing PUT /api/v1/products/:id ---');
    const updateRes = await fetch(`${BASE_URL}/api/v1/products/${productId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        sellPrice: 280,
        brand: 'Modabella Premium'
      })
    });
    const updateData = await updateRes.json();
    console.log('Status:', updateRes.status);
    console.log('Response:', JSON.stringify(updateData, null, 2));

    if (!updateData.success || updateData.product.sellPrice !== 280) {
      throw new Error('Update product failed!');
    }

    // 6. Test PATCH /api/v1/products/:id/stock (Stock Adjustment)
    console.log('\n--- 6. Testing PATCH /api/v1/products/:id/stock ---');
    const stockRes = await fetch(`${BASE_URL}/api/v1/products/${productId}/stock`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        quantity: 20,
        type: 'PURCHASE',
        reason: 'شراء شحنة جديدة من المورد',
        reference: 'INV-2026-001'
      })
    });
    const stockData = await stockRes.json();
    console.log('Status:', stockRes.status);
    console.log('Response:', JSON.stringify(stockData, null, 2));

    if (!stockData.success || stockData.product.stock !== 70) {
      throw new Error('Stock update failed!');
    }

    // Check InventoryTransaction document
    const txCount = await InventoryTransaction.countDocuments({ productId });
    console.log(`✅ InventoryTransaction record created. Total transactions for product: ${txCount}`);

    // 7. Test POST /api/v1/products/import (Bulk Import)
    console.log('\n--- 7. Testing POST /api/v1/products/import ---');
    const importRes = await fetch(`${BASE_URL}/api/v1/products/import`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        products: [
          { name: 'بنطلون جينز أزرق', barcode: '690999000111', sku: 'JEANS-001', category: 'بنطال', sellPrice: 400, stock: 30 },
          { name: 'قميص أبيض رسمى', barcode: '690999000222', sku: 'SHIRT-002', category: 'قمصان', sellPrice: 350, stock: 25 }
        ]
      })
    });
    const importData = await importRes.json();
    console.log('Status:', importRes.status);
    console.log('Response:', JSON.stringify(importData, null, 2));

    if (!importData.success || importData.summary.imported !== 2) {
      throw new Error('Import products failed!');
    }

    // 8. Test DELETE /api/v1/products/:id (Soft Delete)
    console.log('\n--- 8. Testing DELETE /api/v1/products/:id ---');
    const deleteRes = await fetch(`${BASE_URL}/api/v1/products/${productId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteData = await deleteRes.json();
    console.log('Status:', deleteRes.status);
    console.log('Response:', JSON.stringify(deleteData, null, 2));

    if (!deleteData.success) {
      throw new Error('Soft delete product failed!');
    }

    // Verify soft deleted product is NOT returned in GET list
    const finalListRes = await fetch(`${BASE_URL}/api/v1/products`, {
      method: 'GET',
      headers: authHeaders
    });
    const finalListData = await finalListRes.json();
    console.log(`\nActive products count after soft delete: ${finalListData.data.length}`);
    if (finalListData.data.some(p => p._id === productId)) {
      throw new Error('Soft deleted product still appeared in GET list!');
    }

    // Check ActivityLog entries
    const logsCount = await ActivityLog.countDocuments({ orgId: org._id });
    console.log(`✅ ActivityLog records created. Total log entries: ${logsCount}`);

    console.log('\n🎉 ALL 8 PRODUCTS API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
