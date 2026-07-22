/**
 * Module Access Guard Middleware for Mizan ERP.
 * Enforces feature-based authorization based on the active Plan's allowedModules.
 * Reads strictly from memory (req.plan). Performs ZERO MongoDB queries.
 */

// Module Guard Error Codes Constants
export const MODULE_ERROR_CODES = {
  INVALID_CODE: 'INVALID_MODULE_CODE',
  NOT_INCLUDED: 'MODULE_NOT_INCLUDED',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND'
};

/**
 * Reusable Factory Middleware to restrict route access by Plan Module Code.
 * 
 * @param {string} moduleCode The required module code (e.g., 'accounting', 'multi_branch', 'e_invoicing')
 */
export const checkModule = (moduleCode) => {
  return (req, res, next) => {
    // 1. Edge Case: Validate moduleCode parameter
    if (!moduleCode || typeof moduleCode !== 'string' || !moduleCode.trim()) {
      return res.status(400).json({
        success: false,
        code: MODULE_ERROR_CODES.INVALID_CODE,
        message: 'كود الموديول غير صالح أو غير محدد في النظام'
      });
    }

    const targetModule = moduleCode.trim();

    // 2. Edge Case: Check if req.plan exists
    if (!req.plan) {
      return res.status(403).json({
        success: false,
        code: MODULE_ERROR_CODES.PLAN_NOT_FOUND,
        message: 'الباقة المرتبطة بالحساب غير محددة'
      });
    }

    // 3. Edge Case: Safely extract allowedModules array
    const allowedModules = Array.isArray(req.plan.allowedModules) ? req.plan.allowedModules : [];

    // 4. Authorize if targetModule is included in plan's allowedModules
    if (allowedModules.includes(targetModule)) {
      return next();
    }

    // 5. Deny access if module is not included in current plan
    return res.status(403).json({
      success: false,
      code: MODULE_ERROR_CODES.NOT_INCLUDED,
      message: `الموديول (${targetModule}) غير متاح في باقتك الحالية. يرجى ترقية الباقة لتفعيله.`
    });
  };
};
