import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Plan from '../models/Plan.js';
import License from '../models/License.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sanitizeBody } from '../middleware/tenant.js';
import { LICENSE_CONFIG } from '../config/licensing.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mizansecretkey123', {
    expiresIn: '30d'
  });
};

// @route   POST api/auth/register
// @desc    Register a new shop (Organization), provision active Trial License, and create Owner User atomically
// @access  Public
router.post('/register', sanitizeBody(['orgId', '_id', '__v']), asyncHandler(async (req, res) => {
  const { shopName, ownerName, email, password, phone } = req.body;

  if (!shopName || !ownerName || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'من فضلك أدخل كافة الحقول المطلوبة' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
  }

  const session = await mongoose.startSession();
  let registeredUser = null;
  let registeredOrg = null;

  try {
    await session.withTransaction(async () => {
      // 1. Create Organization (Tenant)
      const [org] = await Organization.create(
        [{
          name: shopName,
          ownerName,
          phone,
          plan: LICENSE_CONFIG.DEFAULT_PLAN_CODE,
          status: 'active'
        }],
        { session }
      );

      // 2. Find Trial Plan by code
      const trialPlan = await Plan.findOne({ code: LICENSE_CONFIG.DEFAULT_PLAN_CODE }).session(session);
      if (!trialPlan) {
        const error = new Error('باقة التجربة الافتراضية غير معرفة في المنظومة. يرجى التواصل مع الإدارة.');
        error.statusCode = 500;
        throw error;
      }

      // 3. Create Trial License calculated from LICENSE_CONFIG.TRIAL_DURATION_DAYS
      const trialDurationMs = LICENSE_CONFIG.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
      const trialEndsAt = new Date(Date.now() + trialDurationMs);

      const [license] = await License.create(
        [{
          orgId: org._id,
          planId: trialPlan._id,
          type: 'trial',
          status: 'active',
          startsAt: new Date(),
          trialEndsAt,
          expiresAt: trialEndsAt,
          issuedBy: LICENSE_CONFIG.DEFAULT_ISSUER,
          provider: LICENSE_CONFIG.DEFAULT_PROVIDER,
          autoRenew: LICENSE_CONFIG.AUTO_RENEW
        }],
        { session }
      );

      // 4. Update Organization activeLicenseId
      await Organization.updateOne(
        { _id: org._id },
        { $set: { activeLicenseId: license._id } },
        { session }
      );
      org.activeLicenseId = license._id;

      // 5. Create Owner User
      const [user] = await User.create(
        [{
          name: ownerName,
          email,
          password,
          role: 'owner',
          orgId: org._id,
          branchName: 'الكل'
        }],
        { session }
      );

      registeredUser = user;
      registeredOrg = org;
    });

    const token = generateToken(registeredUser._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: registeredUser._id,
        name: registeredUser.name,
        email: registeredUser.email,
        role: registeredUser.role,
        shopName: registeredOrg.name,
        activeLicenseId: registeredOrg.activeLicenseId
      }
    });
  } finally {
    // Always release session resources
    await session.endSession();
  }
}));

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'من فضلك ادخل البريد الإلكتروني وكلمة المرور' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  const org = await Organization.findById(user.orgId);
  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopName: org?.name || 'ميزان'
    }
  });
}));

// @route   GET api/auth/me
// @desc    Get current user profile and organization details
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
    organization: req.organization || req.org,
    license: req.license,
    plan: req.plan
  });
}));

// @route   POST api/auth/report-payment
// @desc    Submit payment receipt screenshot / ID for manual approval
// @access  Private (Owner only)
router.post('/report-payment', protect, sanitizeBody(['status', 'orgId', '_id']), asyncHandler(async (req, res) => {
  const { amount, planRequested, transactionId } = req.body;

  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'غير مسموح إلا لمالك المحل برفع إثبات الدفع' });
  }

  const org = await Organization.findById(req.user.orgId);
  if (!org) {
    return res.status(404).json({ success: false, message: 'المؤسسة غير موجودة' });
  }

  org.billingLogs.push({
    amount,
    planRequested,
    transactionId,
    status: 'pending'
  });

  await org.save();

  res.json({
    success: true,
    message: 'تم إرسال إيصال الدفع بنجاح، وسيتم التفعيل ومراجعة التحويل خلال ساعة.',
    organization: org
  });
}));

export default router;
