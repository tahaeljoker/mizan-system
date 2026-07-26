import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authentication Middleware: Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
      token = req.cookies.accessToken || req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. Please provide a valid token.', 401);
    }

    const secret = process.env.JWT_SECRET || 'mizansecretkey123';
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Malformed or invalid JWT token.', 401);
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User associated with token no longer exists.', 404);
    }

    if (user.isDeleted || user.status === 'deleted') {
      return errorResponse(res, 'Account has been deleted. Access denied.', 403);
    }

    if (user.status === 'inactive') {
      return errorResponse(res, 'Account is inactive. Access denied.', 403);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication error: ' + error.message, 401);
  }
};

export const protect = authenticate;
