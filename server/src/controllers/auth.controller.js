import { ZodError } from 'zod';
import * as authService from '../services/auth.service.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from '../validators/auth.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Format Zod validation errors cleanly
 */
const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

/**
 * Controller: Login
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData, req);

    // Set HTTP-Only Cookies
    if (res.cookie) {
      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    return successResponse(res, result, 'Login successful', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Login failed', statusCode);
  }
};

/**
 * Controller: Get Authenticated User Profile
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await authService.getUserProfile(userId);
    return successResponse(res, result, 'Authenticated user profile fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch user profile', statusCode);
  }
};

/**
 * Controller: Refresh Access Token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    const refreshTokenInput = req.body?.refreshToken || req.cookies?.refreshToken;
    const validatedData = refreshTokenSchema.parse({ refreshToken: refreshTokenInput });

    const result = await authService.refreshAccessToken(validatedData.refreshToken, req);

    // Set updated Cookies
    if (res.cookie) {
      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }

    return successResponse(res, result, 'Token refreshed successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 401;
    return errorResponse(res, error.message || 'Token refresh failed', statusCode);
  }
};

/**
 * Controller: Logout
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const refreshTokenInput = req.body?.refreshToken || req.cookies?.refreshToken;
    const userId = req.user?._id || req.user?.id;

    await authService.logoutUser({ userId, refreshTokenString: refreshTokenInput });

    // Clear Cookies
    if (res.clearCookie) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('token');
    }

    return successResponse(res, {}, 'Logged out successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Logout failed', statusCode);
  }
};

/**
 * Controller: Change Password
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const validatedData = changePasswordSchema.parse(req.body);

    await authService.changePassword({
      userId,
      currentPassword: validatedData.currentPassword,
      newPassword: validatedData.newPassword
    });

    // Clear Cookies forcing re-login
    if (res.clearCookie) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('token');
    }

    return successResponse(
      res,
      {},
      'Password changed successfully. All active sessions have been revoked. Please log in again.',
      200
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Change password failed', statusCode);
  }
};
