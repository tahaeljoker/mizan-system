import Organization from '../models/Organization.js';
import License from '../models/License.js';
import Plan from '../models/Plan.js';
import asyncHandler from './asyncHandler.js';

/**
 * Middleware: loadOrganization
 * Responsibility: Loads the tenant Organization object by req.user.orgId using .lean() for maximum performance.
 * Attaches req.organization and req.org (legacy alias).
 */
export const loadOrganization = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.orgId) {
    return res.status(401).json({ success: false, message: 'غير مصرح، يرجى تسجيل الدخول' });
  }

  // If organization is already attached, skip query
  if (req.organization) {
    return next();
  }

  const org = await Organization.findById(req.user.orgId).lean();
  if (!org) {
    return res.status(404).json({ success: false, message: 'المؤسسة غير مسجلة' });
  }

  req.organization = org;
  req.org = org; // Legacy alias for 100% backward compatibility
  next();
});

/**
 * Middleware: loadActiveLicense
 * Responsibility: Loads the active License and populated Plan for the tenant organization using .lean().
 * Attaches req.license and req.plan.
 */
export const loadActiveLicense = asyncHandler(async (req, res, next) => {
  // If license and plan are already loaded, skip query
  if (req.license && req.plan) {
    return next();
  }

  const org = req.organization || req.org;
  if (!org) {
    return res.status(404).json({ success: false, message: 'المؤسسة غير مسجلة' });
  }

  // Load from activeLicenseId if present
  if (org.activeLicenseId) {
    const license = await License.findById(org.activeLicenseId)
      .populate({ path: 'planId', select: 'code name version monthlyPrice yearlyPrice allowedModules limits isActive' })
      .lean();

    if (license) {
      req.license = license;
      req.plan = license.planId;
      return next();
    }
  }

  // TODO: Remove legacy fallback after all organizations are migrated.
  req.license = {
    type: org.plan === 'trial' ? 'trial' : 'subscription',
    status: org.status || 'active',
    startsAt: org.createdAt,
    expiresAt: org.subscriptionExpiresAt,
    trialEndsAt: org.trialEndsAt,
    offlineAllowed: false,
    autoRenew: false,
    provider: 'manual'
  };

  req.plan = {
    code: org.plan || 'trial',
    name: org.plan === 'trial' ? 'الفترة التجريبية' : 'باقة ميزان',
    version: '1.0',
    limits: {
      maxUsers: 3,
      maxBranches: 1,
      maxProducts: 500
    },
    allowedModules: ['pos', 'inventory', 'reports']
  };

  next();
});
