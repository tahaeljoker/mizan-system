import asyncHandler from './asyncHandler.js';

// Error Code Constants
export const LIMIT_ERROR_CODES = {
  INVALID_RESOURCE: 'INVALID_RESOURCE_TYPE',
  INVALID_CALLBACK: 'INVALID_COUNT_CALLBACK',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  LIMIT_COUNT_ERROR: 'LIMIT_COUNT_ERROR',
  LIMIT_REACHED: 'LIMIT_REACHED'
};

// Extensible Resource Map for Plan Limits Mapping
export const SUPPORTED_RESOURCES = {
  users: 'maxUsers',
  branches: 'maxBranches',
  products: 'maxProducts'
};

/**
 * Reusable Factory Middleware to enforce Plan resource limits (maxUsers, maxBranches, maxProducts).
 * Completely decoupled from database models via async callback getCurrentCount(req).
 * 
 * @param {string} resourceType The resource category ('users' | 'branches' | 'products')
 * @param {Function} getCurrentCount Async function receiving (req) and returning current resource count
 */
export const checkLimit = (resourceType, getCurrentCount) => {
  return asyncHandler(async (req, res, next) => {
    // 1. Edge Case: Validate resourceType against Resource Map
    const limitKey = SUPPORTED_RESOURCES[resourceType];
    if (!limitKey) {
      return res.status(400).json({
        success: false,
        code: LIMIT_ERROR_CODES.INVALID_RESOURCE,
        message: `نوع المورد التقييمي (${resourceType}) غير صالح أو غير معرّف بالمنظومة`
      });
    }

    // 2. Edge Case: Validate callback function
    if (typeof getCurrentCount !== 'function') {
      return res.status(400).json({
        success: false,
        code: LIMIT_ERROR_CODES.INVALID_CALLBACK,
        message: 'دالة حصر المورد غير متاحة أو غير صالحة'
      });
    }

    // 3. Edge Case: Check if req.plan exists
    if (!req.plan) {
      return res.status(403).json({
        success: false,
        code: LIMIT_ERROR_CODES.PLAN_NOT_FOUND,
        message: 'الباقة المرتبطة بالحساب غير محددة'
      });
    }

    // 4. Extract limit value from req.plan.limits
    const limits = req.plan.limits || {};
    const limitValue = limits[limitKey];

    // 5. Unlimited Rule: null or undefined limitValue means UNLIMITED (skip count execution completely)
    if (limitValue === null || limitValue === undefined) {
      return next();
    }

    // 6. Execute callback to obtain current count
    const rawCount = await getCurrentCount(req);

    // 7. Validate count result is a valid non-negative number
    if (typeof rawCount !== 'number' || Number.isNaN(rawCount)) {
      return res.status(500).json({
        success: false,
        code: LIMIT_ERROR_CODES.LIMIT_COUNT_ERROR,
        message: 'فشل في حساب العدد الحالي للمورد'
      });
    }

    const currentCount = Math.max(0, rawCount);

    // 8. Limit Enforcement
    if (currentCount >= limitValue) {
      return res.status(403).json({
        success: false,
        code: LIMIT_ERROR_CODES.LIMIT_REACHED,
        resource: resourceType,
        limit: limitValue,
        current: currentCount,
        message: `عذراً، لقد وصلت للحد الأقصى المسموح به في باقتك الحالية (${limitValue} ${resourceType}). يرجى الترقية لتفعيل المزيد.`
      });
    }

    next();
  });
};
