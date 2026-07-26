import { errorResponse } from '../utils/response.js';

const attemptsMap = new Map();

// Periodically clean up old rate limiter records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of attemptsMap.entries()) {
    if (now > record.resetTime) {
      attemptsMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Simple in-memory Rate Limiter Middleware for Auth Endpoints
 */
export const loginRateLimiter = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    const record = attemptsMap.get(ip);

    if (!record || now > record.resetTime) {
      attemptsMap.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (record.count >= maxAttempts) {
      const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
      return errorResponse(
        res,
        `Too many login attempts. Please try again in ${remainingSeconds} seconds.`,
        429
      );
    }

    record.count += 1;
    attemptsMap.set(ip, record);
    next();
  };
};
