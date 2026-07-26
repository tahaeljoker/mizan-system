import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Session from './models/Session.js';
import RefreshToken from './models/RefreshToken.js';

dotenv.config();

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    // Seed test organization & user
    await Organization.deleteMany({ name: 'TEST_AUTH_ORG' });
    await User.deleteMany({ email: 'testauth@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_AUTH_ORG',
      ownerName: 'Test Owner',
      phone: '01000000000',
      plan: 'pro',
      status: 'active'
    });

    const user = await User.create({
      name: 'Test Auth User',
      email: 'testauth@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchName: 'Main',
      status: 'active'
    });

    console.log('✅ Test user created: testauth@mizan.com / password123');

    // 1. Test POST /api/v1/auth/login
    console.log('\n--- 1. Testing POST /api/v1/auth/login ---');
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testauth@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success || !loginData.token || !loginData.refreshToken) {
      throw new Error('Login failed!');
    }
    const token = loginData.token;
    const refreshToken = loginData.refreshToken;

    // 2. Test GET /api/v1/auth/me
    console.log('\n--- 2. Testing GET /api/v1/auth/me ---');
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const meData = await meRes.json();
    console.log('Status:', meRes.status);
    console.log('Response:', JSON.stringify(meData, null, 2));

    if (!meData.success || !meData.user || meData.user.email !== 'testauth@mizan.com') {
      throw new Error('GET /me failed!');
    }

    // 3. Test POST /api/v1/auth/refresh
    console.log('\n--- 3. Testing POST /api/v1/auth/refresh ---');
    const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const refreshData = await refreshRes.json();
    console.log('Status:', refreshRes.status);
    console.log('Response:', JSON.stringify(refreshData, null, 2));

    if (!refreshData.success || !refreshData.token || !refreshData.refreshToken) {
      throw new Error('Token refresh failed!');
    }
    const newAccessToken = refreshData.token;

    // 4. Test POST /api/v1/auth/change-password
    console.log('\n--- 4. Testing POST /api/v1/auth/change-password ---');
    const changePassRes = await fetch(`${BASE_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newAccessToken}`
      },
      body: JSON.stringify({ currentPassword: 'password123', newPassword: 'newpassword123' })
    });
    const changePassData = await changePassRes.json();
    console.log('Status:', changePassRes.status);
    console.log('Response:', JSON.stringify(changePassData, null, 2));

    if (!changePassData.success) {
      throw new Error('Change password failed!');
    }

    // Login with new password
    console.log('\n--- Logging in with new password ---');
    const newLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testauth@mizan.com', password: 'newpassword123' })
    });
    const newLoginData = await newLoginRes.json();
    if (!newLoginData.success) {
      throw new Error('Login with new password failed!');
    }

    // 5. Test POST /api/v1/auth/logout
    console.log('\n--- 5. Testing POST /api/v1/auth/logout ---');
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newLoginData.token}`
      },
      body: JSON.stringify({ refreshToken: newLoginData.refreshToken })
    });
    const logoutData = await logoutRes.json();
    console.log('Status:', logoutRes.status);
    console.log('Response:', JSON.stringify(logoutData, null, 2));

    if (!logoutData.success) {
      throw new Error('Logout failed!');
    }

    console.log('\n🎉 ALL 5 AUTH ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
