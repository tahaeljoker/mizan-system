/**
 * Reusable async handler wrapper for Express routes.
 * Catches rejected promises and forwards errors to the centralized errorHandler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
