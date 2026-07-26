import { ZodError } from 'zod';
import * as supplierService from '../services/supplier.service.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierSettleSchema
} from '../validators/supplier.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

export const getSuppliers = async (req, res) => {
  try {
    const result = await supplierService.getSuppliers(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Suppliers fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch suppliers', statusCode);
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id, req.user);
    return successResponse(res, { supplier }, 'Supplier details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Supplier not found', statusCode);
  }
};

export const createSupplier = async (req, res) => {
  try {
    const validatedData = createSupplierSchema.parse(req.body);
    const supplier = await supplierService.createSupplier(validatedData, req.user, req);
    return successResponse(res, { supplier }, 'Supplier created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create supplier', statusCode);
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const validatedData = updateSupplierSchema.parse(req.body);
    const supplier = await supplierService.updateSupplier(req.params.id, validatedData, req.user, req);
    return successResponse(res, { supplier }, 'Supplier updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update supplier', statusCode);
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    await supplierService.deleteSupplier(req.params.id, req.user, req);
    return successResponse(res, {}, 'Supplier deleted successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete supplier', statusCode);
  }
};

export const settleDebt = async (req, res) => {
  try {
    const validatedData = supplierSettleSchema.parse(req.body);
    const result = await supplierService.settleDebt(req.params.id, validatedData, req.user, req);
    return successResponse(res, result, 'Supplier settlement processed successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Settlement failed', statusCode);
  }
};

export const getStatement = async (req, res) => {
  try {
    const result = await supplierService.getStatement(req.params.id, req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Supplier statement fetched successfully',
      supplier: result.supplier,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Failed to fetch supplier statement', statusCode);
  }
};
