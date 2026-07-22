import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { loadOrganization, loadActiveLicense } from './licenseLoader.js';

export { loadOrganization, loadActiveLicense };

/**
 * Middleware: protectUser
 * Responsibility: ONLY authenticates the user via JWT token and attaches req.user.
 */
export const protectUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'غير مصرح بالدخول، يرجى تقديم توكن صالح' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mizansecretkey123');
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'تم إيقاف حساب المستخدم الخاص بك' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'توكن غير صالح أو منتهي الصلاحية' });
  }
};

/**
 * Middleware: protect (Composite Chain for 100% Backward Compatibility)
 * Runs: protectUser -> loadOrganization -> loadActiveLicense
 */
export const protect = [
  protectUser,
  loadOrganization,
  loadActiveLicense
];

/**
 * Legacy checkSubscription middleware (retained for backward compatibility)
 */
export const checkSubscription = (req, res, next) => {
  const org = req.organization || req.org;
  if (org && org.status !== 'active') {
    return res.status(403).json({ 
      success: false, 
      message: 'الاشتراك الخاص بك غير نشط أو معلق. يرجى مراجعة الدفع أو التجديد عبر InstaPay.' 
    });
  }

  const license = req.license;
  if (license && license.type !== 'lifetime') {
    const expiresAt = license.expiresAt || org?.subscriptionExpiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(403).json({ 
        success: false, 
        message: 'انتهت صلاحية اشتراكك. يرجى التجديد وتأكيد الدفع للاستمرار في استخدام ميزان.' 
      });
    }
  }

  next();
};

/**
 * Role authorization helper
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `المستخدم بالدور (${req.user.role}) غير مصرح له بالقيام بهذا الإجراء.` 
      });
    }
    next();
  };
};
