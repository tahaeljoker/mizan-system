/**
 * Production Logger & Audit Request Middleware
 */
export const logger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'production' && res.statusCode >= 400) {
      console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) - IP: ${req.ip}`);
    }
  });
  next();
};
