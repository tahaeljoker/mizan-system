import { ZodError } from 'zod';
import * as saleService from '../services/sale.service.js';
import {
  createSaleSchema,
  holdSaleSchema,
  refundSaleSchema
} from '../validators/sale.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

export const getSales = async (req, res) => {
  try {
    const result = await saleService.getSales(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Sales fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch sales', statusCode);
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await saleService.getSaleById(req.params.id, req.user);
    return successResponse(res, { sale }, 'Sale details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Sale invoice not found', statusCode);
  }
};

export const getSaleByInvoiceNumber = async (req, res) => {
  try {
    const sale = await saleService.getSaleByInvoiceNumber(req.params.invoiceNumber, req.user);
    return successResponse(res, { sale }, 'Invoice details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Invoice not found', statusCode);
  }
};

export const createSale = async (req, res) => {
  try {
    const validatedData = createSaleSchema.parse(req.body);
    const sale = await saleService.createSale(validatedData, req.user, req);
    return successResponse(res, { sale }, 'Sale invoice completed successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to complete sale', statusCode);
  }
};

export const holdSale = async (req, res) => {
  try {
    const validatedData = holdSaleSchema.parse(req.body);
    const sale = await saleService.holdSale(validatedData, req.user, req);
    return successResponse(res, { sale }, 'Sale invoice held successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to hold sale', statusCode);
  }
};

export const resumeSale = async (req, res) => {
  try {
    const validatedData = createSaleSchema.parse(req.body);
    const sale = await saleService.resumeSale(req.params.id, validatedData, req.user, req);
    return successResponse(res, { sale }, 'Held sale invoice resumed and completed successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to resume sale', statusCode);
  }
};

export const refundSale = async (req, res) => {
  try {
    const validatedData = refundSaleSchema.parse(req.body);
    const result = await saleService.refundSale(req.params.id, validatedData, req.user, req);
    return successResponse(res, result, 'Sale refund processed successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to process refund', statusCode);
  }
};

export const cancelSale = async (req, res) => {
  try {
    const sale = await saleService.cancelSale(req.params.id, req.body?.reason || '', req.user, req);
    return successResponse(res, { sale }, 'Sale invoice cancelled successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to cancel sale', statusCode);
  }
};

export const getHistory = async (req, res) => {
  try {
    const result = await saleService.getHistory(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Sales history fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch sales history', statusCode);
  }
};

export const getDailySummary = async (req, res) => {
  try {
    const summary = await saleService.getDailySummary(req.query, req.user);
    return successResponse(res, { summary }, 'Daily sales summary fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch daily summary', statusCode);
  }
};
