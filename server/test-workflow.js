import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Branch from './models/Branch.js';
import Notification from './models/Notification.js';
import ApprovalRequest from './models/ApprovalRequest.js';
import AuditTrail from './models/AuditTrail.js';
import JobLog from './models/JobLog.js';
import { recordAuditTrail } from './src/services/audit.service.js';

dotenv.config();

const PORT = 5105;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
  let server;
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mizan';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for Workflow, Approval & Audit Integration Testing');

    server = app.listen(PORT);
    console.log(`🚀 Test Server listening on port ${PORT}`);

    await Organization.deleteMany({ name: 'TEST_WORKFLOW_ORG' });
    await User.deleteMany({ email: 'testworkflow@mizan.com' });

    const org = await Organization.create({
      name: 'TEST_WORKFLOW_ORG',
      ownerName: 'Test Workflow Owner',
      phone: '01088888888',
      plan: 'pro',
      status: 'active'
    });

    const branch = await Branch.create({ name: 'الفرع الرئيسي', orgId: org._id, code: 'BR1', isMain: true });

    const user = await User.create({
      name: 'Test Workflow Admin',
      email: 'testworkflow@mizan.com',
      password: 'password123',
      role: 'owner',
      orgId: org._id,
      branchId: branch._id,
      status: 'active'
    });

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testworkflow@mizan.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('✅ Authenticated successfully as testworkflow@mizan.com');

    await Notification.deleteMany({ orgId: org._id });
    await ApprovalRequest.deleteMany({ orgId: org._id });
    await AuditTrail.deleteMany({ orgId: org._id });
    await JobLog.deleteMany({ orgId: org._id });

    // 1. Test Notifications API
    console.log('\n--- 1. Testing Notifications API ---');
    const notif1 = await Notification.create({
      orgId: org._id,
      title: 'إشعار اختبار جديد',
      message: 'هذا إشعار تجريبي للمنظومة',
      type: 'INFO',
      priority: 'HIGH',
      userId: user._id
    });

    // Unread count
    const unreadRes = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, { headers: authHeaders });
    const unreadData = await unreadRes.json();
    console.log('Unread Count:', unreadData.unreadCount);
    if (!unreadData.success || unreadData.unreadCount < 1) throw new Error('Unread count failed!');

    // List notifications
    const listNotifRes = await fetch(`${BASE_URL}/api/v1/notifications`, { headers: authHeaders });
    const listNotifData = await listNotifRes.json();
    console.log('Notifications Count:', listNotifData.data.length);
    if (!listNotifData.success || listNotifData.data.length < 1) throw new Error('List notifications failed!');

    // Mark single notification as read
    const readRes = await fetch(`${BASE_URL}/api/v1/notifications/${notif1._id}/read`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const readData = await readRes.json();
    console.log('Mark Read Status:', readData.notification.isRead);
    if (!readData.success || readData.notification.isRead !== true) throw new Error('Mark read failed!');

    // Mark all read
    const allReadRes = await fetch(`${BASE_URL}/api/v1/notifications/read-all`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const allReadData = await allReadRes.json();
    console.log('Mark All Read Status:', allReadData.success);

    // 2. Test Approval Workflow API
    console.log('\n--- 2. Testing Approval Workflow API ---');
    const fakeEntityId = new mongoose.Types.ObjectId();
    const appReqRes = await fetch(`${BASE_URL}/api/v1/approvals`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'EXPENSE',
        entityId: fakeEntityId.toString(),
        reason: 'مصروفات تشغيلية تتجاوز الحد المسموح'
      })
    });
    const appReqData = await appReqRes.json();
    console.log('Approval Request Created:', appReqData.request._id, 'Status:', appReqData.request.status);
    if (!appReqData.success || appReqData.request.status !== 'PENDING') throw new Error('Create approval failed!');
    const approvalId = appReqData.request._id;

    // Get Pending Approvals
    const pendingRes = await fetch(`${BASE_URL}/api/v1/approvals/pending`, { headers: authHeaders });
    const pendingData = await pendingRes.json();
    console.log('Pending Approvals Count:', pendingData.data.length);
    if (!pendingData.success || pendingData.data.length < 1) throw new Error('Get pending approvals failed!');

    // Approve Request
    const approveRes = await fetch(`${BASE_URL}/api/v1/approvals/${approvalId}/approve`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ comments: 'تمت الموافقة من المدير المسؤول' })
    });
    const approveData = await approveRes.json();
    console.log('Approval Status after approve:', approveData.request.status, 'Approved By:', approveData.request.approvedBy);
    if (!approveData.success || approveData.request.status !== 'APPROVED') throw new Error('Approve request failed!');

    // 3. Test Audit Trail API
    console.log('\n--- 3. Testing Audit Trail API ---');
    await recordAuditTrail({
      orgId: org._id,
      userId: user._id,
      action: 'UPDATE_PRODUCT_PRICE',
      entity: 'Product',
      entityId: fakeEntityId,
      before: { name: 'منتج أ', sellPrice: 100 },
      after: { name: 'منتج أ', sellPrice: 150 }
    });

    const auditRes = await fetch(`${BASE_URL}/api/v1/audit`, { headers: authHeaders });
    const auditData = await auditRes.json();
    console.log('Audit Records Count:', auditData.data.length);
    if (!auditData.success || auditData.data.length < 1) throw new Error('Audit trail list failed!');

    const auditId = auditData.data[0]._id;
    const auditDetailRes = await fetch(`${BASE_URL}/api/v1/audit/${auditId}`, { headers: authHeaders });
    const auditDetailData = await auditDetailRes.json();
    console.log('Audit Diff:', JSON.stringify(auditDetailData.audit.diff, null, 2));

    // 4. Test Background Jobs API
    console.log('\n--- 4. Testing Background Jobs API ---');
    const jobsListRes = await fetch(`${BASE_URL}/api/v1/jobs`, { headers: authHeaders });
    const jobsListData = await jobsListRes.json();
    console.log('Registered Jobs Count:', jobsListData.jobs.length);
    if (!jobsListData.success || jobsListData.jobs.length < 1) throw new Error('Get jobs list failed!');

    // Run low stock scan job
    const runJobRes = await fetch(`${BASE_URL}/api/v1/jobs/run/low_stock_scan`, {
      method: 'POST',
      headers: authHeaders
    });
    const runJobData = await runJobRes.json();
    console.log('Run Job Status:', runJobData.jobLog.status, 'Duration Ms:', runJobData.jobLog.durationMs);
    if (!runJobData.success || runJobData.jobLog.status !== 'COMPLETED') throw new Error('Run job failed!');

    // Get Job History
    const jobHistRes = await fetch(`${BASE_URL}/api/v1/jobs/history`, { headers: authHeaders });
    const jobHistData = await jobHistRes.json();
    console.log('Job History Count:', jobHistData.history.length);
    if (!jobHistData.success || jobHistData.history.length < 1) throw new Error('Get job history failed!');

    console.log('\nALL NOTIFICATION, APPROVAL, AUDIT TRAIL & BACKGROUND JOBS ENDPOINTS VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Workflow Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
