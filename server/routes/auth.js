import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sanitizeBody } from '../middleware/tenant.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mizansecretkey123', {
    expiresIn: '30d'
  });
};

// @route   POST api/auth/register
// @desc    Register a new shop (Organization) and its owner atomically
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
      // 1. Create Organization (Tenant) inside transaction session
      const [org] = await Organization.create(
        [{
          name: shopName,
          ownerName,
          phone,
          plan: 'trial',
          status: 'active'
        }],
        { session }
      );

      // 2. Create Owner User inside transaction session
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
        shopName: registeredOrg.name
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
    organization: req.org
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
