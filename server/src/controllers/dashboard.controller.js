import { ZodError } from 'zod';
import * as dashboardService from '../services/dashboard.service.js';
import * as financeService from '../services/finance.service.js';
import { dashboardFilterSchema } from '../validators/dashboard.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import ActivityLog from '../../models/ActivityLog.js';

const logDashboardView = async (req, actionName) => {
  try {
    await ActivityLog.create({
      orgId: req.user.orgId,
      userId: req.user._id,
      action: actionName,
      entity: 'ExecutiveDashboard',
      details: { query: req.query },
      ipAddress: req.ip || ''
    });
  } catch (err) {
    // Non-blocking log failure
  }
};

export const getExecutiveOverview = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const overview = await dashboardService.getExecutiveOverview(validatedQuery, req.user);
    await logDashboardView(req, 'DASHBOARD_VIEWED');
    return successResponse(res, { overview }, 'Executive overview metrics fetched successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Invalid query filters', 400);
    }
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch executive overview', statusCode);
  }
};

export const getSalesAnalytics = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const sales = await dashboardService.getSalesAnalytics(validatedQuery, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { sales }, 'Sales analytics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch sales analytics', statusCode);
  }
};

export const getProductAnalytics = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const products = await dashboardService.getProductAnalytics(validatedQuery, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { products }, 'Product analytics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch product analytics', statusCode);
  }
};

export const getInventoryAnalytics = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const inventory = await dashboardService.getInventoryAnalytics(validatedQuery, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { inventory }, 'Inventory analytics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch inventory analytics', statusCode);
  }
};

export const getCustomerAnalytics = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const customers = await dashboardService.getCustomerAnalytics(validatedQuery, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { customers }, 'Customer analytics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch customer analytics', statusCode);
  }
};

export const getFinanceAnalytics = async (req, res) => {
  try {
    const finance = await financeService.getFinanceDashboard(req.query, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { finance }, 'Finance analytics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch finance analytics', statusCode);
  }
};

export const getCashierAnalytics = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const cashiers = await dashboardService.getCashierAnalytics(validatedQuery, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { cashiers }, 'Cashier performance analytics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch cashier analytics', statusCode);
  }
};

export const getBranchAnalytics = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const branches = await dashboardService.getBranchAnalytics(validatedQuery, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { branches }, 'Branch performance analytics fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch branch analytics', statusCode);
  }
};

export const getChartsData = async (req, res) => {
  try {
    const validatedQuery = dashboardFilterSchema.parse(req.query);
    const charts = await dashboardService.getChartsData(validatedQuery, req.user);
    await logDashboardView(req, 'REPORT_VIEWED');
    return successResponse(res, { charts }, 'Charts JSON dataset fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch charts dataset', statusCode);
  }
};
