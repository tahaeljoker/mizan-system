import { ZodError } from 'zod';
import * as purchaseOrderService from '../services/purchaseOrder.service.js';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  receivePurchaseOrderSchema
} from '../validators/purchaseOrder.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

export const getPurchaseOrders = async (req, res) => {
  try {
    const result = await purchaseOrderService.getPurchaseOrders(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Purchase orders fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch purchase orders', statusCode);
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await purchaseOrderService.getPurchaseOrderById(req.params.id, req.user);
    return successResponse(res, { purchaseOrder: order }, 'Purchase order details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Purchase order not found', statusCode);
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const validatedData = createPurchaseOrderSchema.parse(req.body);
    const order = await purchaseOrderService.createPurchaseOrder(validatedData, req.user, req);
    return successResponse(res, { purchaseOrder: order }, 'Purchase order created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create purchase order', statusCode);
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const validatedData = updatePurchaseOrderSchema.parse(req.body);
    const order = await purchaseOrderService.updatePurchaseOrder(req.params.id, validatedData, req.user, req);
    return successResponse(res, { purchaseOrder: order }, 'Purchase order updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update purchase order', statusCode);
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    await purchaseOrderService.deletePurchaseOrder(req.params.id, req.user, req);
    return successResponse(res, {}, 'Purchase order cancelled successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete purchase order', statusCode);
  }
};

export const receivePurchaseOrder = async (req, res) => {
  try {
    const validatedData = receivePurchaseOrderSchema.parse(req.body || {});
    const order = await purchaseOrderService.receivePurchaseOrder(req.params.id, validatedData, req.user, req);
    return successResponse(res, { purchaseOrder: order }, 'Purchase order received and inventory/supplier ledger updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to receive purchase order', statusCode);
  }
};

export const cancelPurchaseOrder = async (req, res) => {
  try {
    const order = await purchaseOrderService.cancelPurchaseOrder(req.params.id, req.body?.reason || '', req.user, req);
    return successResponse(res, { purchaseOrder: order }, 'Purchase order cancelled successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to cancel purchase order', statusCode);
  }
};
