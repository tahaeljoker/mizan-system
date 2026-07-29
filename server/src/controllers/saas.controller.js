import { ZodError } from 'zod';
import * as saasService from '../services/saas.service.js';
import {
  companyRegisterSchema,
  subscriptionPlanSchema,
  updateCompanyStatusSchema,
  createSupportTicketSchema,
  replySupportTicketSchema,
  whiteLabelConfigSchema
} from '../validators/saas.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

/* ==========================================================================
   1. SUPER ADMIN CONTROLLER
   ========================================================================== */

export const getSuperAdminDashboard = async (req, res) => {
  try {
    const dashboard = await saasService.getSuperAdminDashboard();
    return successResponse(res, { dashboard }, 'Super Admin Dashboard metrics fetched successfully', 200);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch Super Admin dashboard', 500);
  }
};

export const listCompanies = async (req, res) => {
  try {
    const result = await saasService.listCompanies(req.query);
    return res.status(200).json({
      success: true,
      message: 'Companies list fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch companies list', 500);
  }
};

export const updateCompanyStatus = async (req, res) => {
  try {
    const validatedData = updateCompanyStatusSchema.parse(req.body);
    const company = await saasService.updateCompanyStatus(req.params.id, validatedData.status, req.user);
    return successResponse(res, { company }, 'Company status updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update company status', statusCode);
  }
};

export const deleteCompany = async (req, res) => {
  try {
    await saasService.deleteCompany(req.params.id, req.user);
    return successResponse(res, {}, 'Company deleted successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete company', statusCode);
  }
};

export const impersonateCompany = async (req, res) => {
  try {
    const ownerUser = await saasService.impersonateCompany(req.params.id, req.user);
    return successResponse(res, { ownerUser }, 'Impersonation successful', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to impersonate company', statusCode);
  }
};

/* ==========================================================================
   2. PUBLIC REGISTER & SAAS SUBSCRIPTION PLANS
   ========================================================================== */

export const registerCompany = async (req, res) => {
  try {
    const validatedData = companyRegisterSchema.parse(req.body);
    const result = await saasService.registerCompany(validatedData);
    return successResponse(res, result, 'تم تسجيل الشركة وإنشاء الفترة التجريبية بنجاح! 🎉', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'فشل في تسجيل الشركة', statusCode);
  }
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await saasService.getSubscriptionPlans();
    return successResponse(res, { plans }, 'Subscription plans fetched successfully', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch subscription plans', 500);
  }
};

export const createSubscriptionPlan = async (req, res) => {
  try {
    const validatedData = subscriptionPlanSchema.parse(req.body);
    const plan = await saasService.createSubscriptionPlan(validatedData);
    return successResponse(res, { plan }, 'Subscription plan created', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    return errorResponse(res, error.message || 'Failed to create subscription plan', 400);
  }
};

/* ==========================================================================
   3. SUPPORT TICKET CONTROLLER
   ========================================================================== */

export const createSupportTicket = async (req, res) => {
  try {
    const validatedData = createSupportTicketSchema.parse(req.body);
    const ticket = await saasService.createSupportTicket(validatedData, req.user);
    return successResponse(res, { ticket }, 'Support ticket created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    return errorResponse(res, error.message || 'Failed to create support ticket', 400);
  }
};

export const getSupportTickets = async (req, res) => {
  try {
    const result = await saasService.getSupportTickets(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Support tickets fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch tickets', 500);
  }
};

export const replySupportTicket = async (req, res) => {
  try {
    const validatedData = replySupportTicketSchema.parse(req.body);
    const ticket = await saasService.replySupportTicket(req.params.id, validatedData.message, req.user);
    return successResponse(res, { ticket }, 'Reply added to ticket', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    return errorResponse(res, error.message || 'Failed to reply to ticket', 400);
  }
};

/* ==========================================================================
   4. SYSTEM BACKUPS & WHITE LABEL
   ========================================================================== */

export const getSystemBackups = async (req, res) => {
  try {
    const backups = await saasService.getSystemBackups();
    return successResponse(res, { backups }, 'System backups list fetched', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch system backups', 500);
  }
};

export const triggerSystemBackup = async (req, res) => {
  try {
    const backup = await saasService.triggerSystemBackup(req.user);
    return successResponse(res, { backup }, 'System backup triggered successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to trigger backup', 500);
  }
};

export const getWhiteLabelConfig = async (req, res) => {
  try {
    const config = await saasService.getWhiteLabelConfig(req.user);
    return successResponse(res, { config }, 'White label config fetched', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch white label config', 500);
  }
};

export const updateWhiteLabelConfig = async (req, res) => {
  try {
    const validatedData = whiteLabelConfigSchema.parse(req.body);
    const config = await saasService.updateWhiteLabelConfig(validatedData, req.user);
    return successResponse(res, { config }, 'White label config updated', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    return errorResponse(res, 'Failed to update white label config', 400);
  }
};
