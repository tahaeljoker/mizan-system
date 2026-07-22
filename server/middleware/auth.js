import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'غير مصرح بالدخول، يرجى تقديم توكن صالح' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mizansecretkey123');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // Load user's organization and check subscription
    const org = await Organization.findById(req.user.orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'المؤسسة غير مسجلة' });
    }

    req.org = org;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'توكن غير صالح أو منتهي الصلاحية' });
  }
};

// Check if tenant subscription is active
export const checkSubscription = (req, res, next) => {
  if (req.org.status !== 'active') {
    return res.status(403).json({ 
      success: false, 
      message: 'الاشتراك الخاص بك غير نشط أو معلق. يرجى مراجعة الدفع أو التجديد عبر InstaPay.' 
    });
  }

  const now = new Date();
  if (new Date(req.org.subscriptionExpiresAt) < now) {
    return res.status(403).json({ 
      success: false, 
      message: 'انتهت صلاحية اشتراكك. يرجى التجديد وتأكيد الدفع للاستمرار في استخدام ميزان.' 
    });
  }

  next();
};

// Role authorization helper
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
