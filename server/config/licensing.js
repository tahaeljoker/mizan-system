/**
 * Centralized Licensing & Trial Configuration for Mizan ERP System.
 */
export const LICENSE_CONFIG = {
  DEFAULT_PLAN_CODE: 'trial',
  TRIAL_DURATION_DAYS: Number(process.env.TRIAL_DURATION_DAYS) || 14,
  AUTO_RENEW: false,
  DEFAULT_PROVIDER: 'manual',
  DEFAULT_ISSUER: 'SYSTEM_REGISTRATION'
};
