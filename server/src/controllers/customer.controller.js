import { ZodError } from 'zod';
import * as customerService from '../services/customer.service.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSettleSchema,
  updateLoyaltySchema
} from '../validators/customer.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

export const getCustomers = async (req, res) => {
  try {
    const result = await customerService.getCustomers(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Customers fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch customers', statusCode);
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id, req.user);
    return successResponse(res, { customer }, 'Customer details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Customer not found', statusCode);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const validatedData = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(validatedData, req.user, req);
    return successResponse(res, { customer }, 'Customer created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create customer', statusCode);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const validatedData = updateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(req.params.id, validatedData, req.user, req);
    return successResponse(res, { customer }, 'Customer updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update customer', statusCode);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    await customerService.deleteCustomer(req.params.id, req.user, req);
    return successResponse(res, {}, 'Customer deleted successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete customer', statusCode);
  }
};

export const settleDebt = async (req, res) => {
  try {
    const validatedData = customerSettleSchema.parse(req.body);
    const result = await customerService.settleDebt(req.params.id, validatedData, req.user, req);
    return successResponse(res, result, 'Customer debt settlement applied successfully', 200);
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
    const result = await customerService.getStatement(req.params.id, req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Customer statement fetched successfully',
      customer: result.customer,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Failed to fetch customer statement', statusCode);
  }
};

export const updateLoyalty = async (req, res) => {
  try {
    const validatedData = updateLoyaltySchema.parse(req.body);
    const result = await customerService.updateLoyalty(req.params.id, validatedData, req.user, req);
    return successResponse(res, result, 'Customer loyalty points updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update loyalty points', statusCode);
  }
};
