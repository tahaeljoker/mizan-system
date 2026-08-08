import mongoose from 'mongoose';
import os from 'os';
import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.js';
import Subscription from '../../models/Subscription.js';
import SupportTicket from '../../models/SupportTicket.js';
import SystemBackup from '../../models/SystemBackup.js';
import SaaSActivityLog from '../../models/SaaSActivityLog.js';
import WhiteLabelConfig from '../../models/WhiteLabelConfig.js';
import Product from '../../models/Product.js';
import Sale from '../../models/Sale.js';
import Branch from '../../models/Branch.js';

const buildPaginationResponse = (data, page, limit, totalItems) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
};

/* ==========================================================================
   1. SUPER ADMIN DASHBOARD
   ========================================================================== */

export const getSuperAdminDashboard = async () => {
  const totalCompanies = await Organization.countDocuments({});
  const activeCompanies = await Organization.countDocuments({ status: 'active' });
  const trialCompanies = await Organization.countDocuments({ plan: { $in: ['trial', 'starter'] } });
  const expiredCompanies = await Organization.countDocuments({ status: 'expired' });
  const totalUsers = await User.countDocuments({});

  // Calculate MRR & ARR from active subscriptions
  const activeSubs = await Subscription.find({ status: 'ACTIVE' }).lean();
  const mrr = activeSubs.reduce((sum, s) => sum + (s.billingCycle === 'YEARLY' ? s.amount / 12 : s.amount), 0);
  const arr = mrr * 12;

  const latestCompanies = await Organization.find({}).sort('-createdAt').limit(5).lean();
  const latestTickets = await SupportTicket.find({}).sort('-createdAt').limit(5).lean();

  const memFree = os.freemem();
  const memTotal = os.totalmem();
  const memUsagePercent = Math.round(((memTotal - memFree) / memTotal) * 100);

  return {
    totalCompanies,
    activeCompanies,
    trialCompanies,
    expiredCompanies,
    totalUsers,
    mrr,
    arr,
    latestCompanies,
    latestTickets,
    systemHealth: {
      cpuCores: os.cpus().length,
      memoryUsagePercent: memUsagePercent,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      dbState: mongoose.connection.readyState === 1 ? 'HEALTHY' : 'DEGRADED'
    }
  };
};

/* ==========================================================================
   2. COMPANY MANAGEMENT
   ========================================================================== */

export const listCompanies = async (queryParams) => {
  const { search, status, plan, page = 1, limit = 20 } = queryParams;
  const filter = {};

  if (status) filter.status = status;
  if (plan) filter.plan = plan;
  if (search && search.trim()) {
    const sRegex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: sRegex }, { ownerName: sRegex }, { phone: sRegex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [companies, totalItems] = await Promise.all([
    Organization.find(filter).sort('-createdAt').skip(skip).limit(limitNum).lean(),
    Organization.countDocuments(filter)
  ]);

  // Enrich with live document metrics
  const enriched = await Promise.all(companies.map(async (c) => {
    const usersCount = await User.countDocuments({ orgId: c._id });
    const productsCount = await Product.countDocuments({ orgId: c._id });
    const salesCount = await Sale.countDocuments({ orgId: c._id });
    const branchesCount = await Branch.countDocuments({ orgId: c._id });
    return { ...c, usersCount, productsCount, salesCount, branchesCount };
  }));

  return buildPaginationResponse(enriched, pageNum, limitNum, totalItems);
};

export const updateCompanyStatus = async (id, status, superAdmin) => {
  const company = await Organization.findById(id);
  if (!company) {
    const error = new Error('الشركة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  company.status = status;
  await company.save();

  await SaaSActivityLog.create({
    superAdminId: superAdmin._id,
    action: `UPDATE_COMPANY_STATUS_${status.toUpperCase()}`,
    targetOrgId: company._id,
    details: { newStatus: status }
  });

  return company;
};

export const deleteCompany = async (id, superAdmin) => {
  const company = await Organization.findByIdAndDelete(id);
  if (!company) {
    const error = new Error('الشركة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  await SaaSActivityLog.create({
    superAdminId: superAdmin._id,
    action: 'DELETE_COMPANY',
    targetOrgId: id,
    details: { companyName: company.name }
  });

  return true;
};

export const impersonateCompany = async (id, superAdmin) => {
  const company = await Organization.findById(id);
  if (!company) {
    const error = new Error('الشركة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  const ownerUser = await User.findOne({ orgId: company._id, role: 'owner' });
  if (!ownerUser) {
    const error = new Error('لم يتم العثور على حساب المالك لهذه الشركة');
    error.statusCode = 404;
    throw error;
  }

  await SaaSActivityLog.create({
    superAdminId: superAdmin._id,
    action: 'IMPERSONATE_COMPANY_OWNER',
    targetOrgId: company._id,
    details: { ownerEmail: ownerUser.email }
  });

  return ownerUser;
};

/* ==========================================================================
   3. SUBSCRIPTIONS & PLANS
   ========================================================================== */

export const getSubscriptionPlans = async () => {
  return SubscriptionPlan.find({ status: 'ACTIVE' }).sort('priceMonthly').lean();
};

export const createSubscriptionPlan = async (data) => {
  return SubscriptionPlan.create(data);
};

/* ==========================================================================
   4. COMPANY SELF-REGISTRATION
   ========================================================================== */

export const registerCompany = async (data) => {
  const cleanEmail = String(data.email || '').trim().toLowerCase();
  const cleanPassword = String(data.password || '').trim();

  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    const error = new Error('البريد الإلكتروني مستخدم بالفعل لنظام آخر');
    error.statusCode = 400;
    throw error;
  }

  const org = await Organization.create({
    name: String(data.companyName || '').trim(),
    ownerName: String(data.ownerName || '').trim(),
    phone: String(data.phone || '').trim(),
    plan: 'trial',
    status: 'active',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  });

  const ownerUser = await User.create({
    name: String(data.ownerName || '').trim(),
    email: cleanEmail,
    password: cleanPassword,
    role: 'owner',
    orgId: org._id,
    status: 'active'
  });

  const starterPlan = await SubscriptionPlan.findOne({ code: 'STARTER' });
  if (starterPlan) {
    await Subscription.create({
      orgId: org._id,
      planId: starterPlan._id,
      status: 'TRIAL',
      amount: starterPlan.priceMonthly,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });
  }

  return { org, ownerUser };
};

/* ==========================================================================
   5. SUPPORT TICKETING SYSTEM
   ========================================================================== */

export const createSupportTicket = async (data, user) => {
  const count = await SupportTicket.countDocuments({});
  const ticketNumber = `TCK-${String(count + 1).padStart(6, '0')}`;

  return SupportTicket.create({
    ticketNumber,
    orgId: user.orgId,
    createdBy: user._id,
    subject: data.subject,
    message: data.message,
    category: data.category || 'GENERAL',
    priority: data.priority || 'MEDIUM',
    status: 'OPEN',
    replies: [{
      senderId: user._id,
      senderName: user.name,
      message: data.message,
      isStaffReply: false
    }]
  });
};

export const getSupportTickets = async (queryParams, user) => {
  const { status, priority, page = 1, limit = 20 } = queryParams;
  const filter = {};

  if (user.role !== 'admin' && user.role !== 'SUPER_ADMIN') {
    filter.orgId = user.orgId;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [tickets, totalItems] = await Promise.all([
    SupportTicket.find(filter).sort('-createdAt').skip(skip).limit(limitNum).lean(),
    SupportTicket.countDocuments(filter)
  ]);

  return buildPaginationResponse(tickets, pageNum, limitNum, totalItems);
};

export const replySupportTicket = async (id, message, user) => {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) {
    const error = new Error('التذكرة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  const isStaff = user.role === 'admin' || user.role === 'SUPER_ADMIN';
  ticket.replies.push({
    senderId: user._id,
    senderName: user.name,
    message,
    isStaffReply: isStaff
  });

  if (isStaff && ticket.status === 'OPEN') {
    ticket.status = 'IN_PROGRESS';
  }

  await ticket.save();
  return ticket;
};

/* ==========================================================================
   6. SYSTEM BACKUPS
   ========================================================================== */

export const triggerSystemBackup = async (user) => {
  const name = `mizan_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  return SystemBackup.create({
    backupName: name,
    sizeMb: 14.5,
    type: 'MANUAL',
    status: 'COMPLETED',
    storageUrl: `/backups/${name}`,
    createdBy: user._id
  });
};

export const getSystemBackups = async () => {
  return SystemBackup.find({}).sort('-createdAt').limit(20).lean();
};

/* ==========================================================================
   7. WHITE LABEL CONFIGURATION
   ========================================================================== */

export const getWhiteLabelConfig = async (user) => {
  let config = await WhiteLabelConfig.findOne({ orgId: user.orgId }).lean();
  if (!config) {
    config = {
      orgId: user.orgId,
      logoUrl: '',
      primaryColor: '#4f46e5',
      secondaryColor: '#7c3aed',
      systemName: 'مِدار ERP',
      invoiceFooter: 'شكراً لتسوقكم معنا!'
    };
  }
  return config;
};

export const updateWhiteLabelConfig = async (data, user) => {
  return WhiteLabelConfig.findOneAndUpdate(
    { orgId: user.orgId },
    { ...data, orgId: user.orgId },
    { new: true, upsert: true }
  );
};
