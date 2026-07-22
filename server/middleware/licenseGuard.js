/**
 * Universal License Enforcement Middleware for Mizan ERP.
 * Strictly independent, zero DB queries, Open/Closed Principle compliant.
 */

// Error Code Constants
export const LICENSE_ERROR_CODES = {
  NOT_FOUND: 'LICENSE_NOT_FOUND',
  SUSPENDED: 'LICENSE_SUSPENDED',
  CANCELLED: 'LICENSE_CANCELLED',
  EXPIRED: 'LICENSE_EXPIRED'
};

/**
 * Pure internal helper function to evaluate if a license is expired based on current timestamp.
 * 
 * @param {Object} license The license document/object
 * @param {number} now Current timestamp in milliseconds
 * @returns {boolean} True if license is expired, false otherwise
 */
export const isLicenseExpired = (license, now) => {
  if (!license) return true;

  // 1. Lifetime License: Never expires
  if (license.type === 'lifetime') {
    return false;
  }

  // 2. Enterprise License: Only expires if explicit expiresAt is defined
  if (license.type === 'enterprise') {
    if (!license.expiresAt) return false;
    return new Date(license.expiresAt).getTime() < now;
  }

  // 3. Trial License: Check trialEndsAt or expiresAt
  if (license.type === 'trial') {
    const trialEnd = license.trialEndsAt || license.expiresAt;
    if (!trialEnd) return false;
    return new Date(trialEnd).getTime() < now;
  }

  // 4. Subscription License: Check expiresAt
  if (license.type === 'subscription') {
    if (!license.expiresAt) return false;
    return new Date(license.expiresAt).getTime() < now;
  }

  // Default fallback for any other license type
  if (license.expiresAt && new Date(license.expiresAt).getTime() < now) {
    return true;
  }

  return false;
};

/**
 * Reusable Express Middleware to enforce active license status.
 */
export const checkLicense = (req, res, next) => {
  const license = req.license;
  const now = Date.now(); // Evaluated ONCE to avoid time drift during request processing

  // 1. Check if License exists
  if (!license) {
    return res.status(404).json({
      success: false,
      code: LICENSE_ERROR_CODES.NOT_FOUND,
      message: 'الترخيص غير موجود أو غير مرتبط بهذه المؤسسة'
    });
  }

  // 2. Evaluate Status FIRST (Suspended/Cancelled override any expiration)
  if (license.status === 'suspended') {
    return res.status(403).json({
      success: false,
      code: LICENSE_ERROR_CODES.SUSPENDED,
      message: 'تم إيقاف ترخيص المؤسسة. يرجى التواصل مع الدعم الفني لميزان.'
    });
  }

  if (license.status === 'cancelled') {
    return res.status(403).json({
      success: false,
      code: LICENSE_ERROR_CODES.CANCELLED,
      message: 'تم إلغاء ترخيص المؤسسة.'
    });
  }

  if (license.status === 'expired') {
    return res.status(403).json({
      success: false,
      code: LICENSE_ERROR_CODES.EXPIRED,
      message: 'انتهت صلاحية ترخيص الحساب.'
    });
  }

  if (license.status !== 'active') {
    return res.status(403).json({
      success: false,
      code: LICENSE_ERROR_CODES.EXPIRED,
      message: 'ترخيص الحساب غير نشط حالياً.'
    });
  }

  // 3. Evaluate Date Expiration based on License Type
  if (isLicenseExpired(license, now)) {
    return res.status(403).json({
      success: false,
      code: LICENSE_ERROR_CODES.EXPIRED,
      message: license.type === 'trial'
        ? 'انتهت الفترة التجريبية المجانية. يرجى اختيار باقة وتأكيد الاشتراك للاستمرار.'
        : 'انتهت صلاحية الاشتراك الخاص بك. يرجى التجديد للاستمرار في استخدام ميزان.'
    });
  }

  next();
};
