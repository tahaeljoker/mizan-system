import { ZodError } from 'zod';
import * as inventoryService from '../services/inventory.service.js';
import {
  createSessionSchema,
  updateSessionSchema,
  blindCountSchema,
  managerReviewSchema,
  manualAdjustmentSchema,
  createTransferSchema,
  receiveTransferSchema
} from '../validators/inventory.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

/* ==========================================================================
   1. INVENTORY SESSIONS (STOCK COUNT)
   ========================================================================== */

export const getSessions = async (req, res) => {
  try {
    const result = await inventoryService.getSessions(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Inventory count sessions fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch sessions', statusCode);
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await inventoryService.getSessionById(req.params.id, req.user);
    return successResponse(res, { session }, 'Session details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Session not found', statusCode);
  }
};

export const createSession = async (req, res) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    const session = await inventoryService.createSession(validatedData, req.user, req);
    return successResponse(res, { session }, 'Inventory count session created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create session', statusCode);
  }
};

export const updateSession = async (req, res) => {
  try {
    const validatedData = updateSessionSchema.parse(req.body);
    const session = await inventoryService.updateSession(req.params.id, validatedData, req.user, req);
    return successResponse(res, { session }, 'Inventory session updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update session', statusCode);
  }
};

export const deleteSession = async (req, res) => {
  try {
    await inventoryService.deleteSession(req.params.id, req.user, req);
    return successResponse(res, {}, 'Inventory session deleted successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete session', statusCode);
  }
};

export const submitBlindCount = async (req, res) => {
  try {
    const validatedData = blindCountSchema.parse(req.body);
    const session = await inventoryService.submitBlindCount(req.params.id, validatedData.items, req.user, req);
    return successResponse(res, { session }, 'Blind count submitted successfully for manager review', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to submit blind count', statusCode);
  }
};

export const managerReview = async (req, res) => {
  try {
    const validatedData = managerReviewSchema.parse(req.body);
    const session = await inventoryService.managerReview(req.params.id, validatedData, req.user, req);
    return successResponse(res, { session }, 'Manager review processed successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to process manager review', statusCode);
  }
};

export const ownerApproval = async (req, res) => {
  try {
    const session = await inventoryService.ownerApproval(req.params.id, req.user, req);
    return successResponse(res, { session }, 'Inventory count approved and product stock updated successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Owner approval failed', statusCode);
  }
};

export const rejectSession = async (req, res) => {
  try {
    const session = await inventoryService.rejectSession(req.params.id, req.body?.reason || '', req.user, req);
    return successResponse(res, { session }, 'Inventory session rejected', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to reject session', statusCode);
  }
};

/* ==========================================================================
   2. MANUAL STOCK ADJUSTMENT & REPORTS
   ========================================================================== */

export const manualAdjustment = async (req, res) => {
  try {
    const validatedData = manualAdjustmentSchema.parse(req.body);
    const result = await inventoryService.manualAdjustment(validatedData, req.user, req);
    return successResponse(res, result, 'Manual stock adjustment applied successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Stock adjustment failed', statusCode);
  }
};

export const getHistory = async (req, res) => {
  try {
    const result = await inventoryService.getHistory(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Inventory history fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch inventory history', statusCode);
  }
};

export const getLowStock = async (req, res) => {
  try {
    const result = await inventoryService.getLowStock(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Low stock products fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch low stock products', statusCode);
  }
};

export const getOutOfStock = async (req, res) => {
  try {
    const result = await inventoryService.getOutOfStock(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Out of stock products fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch out of stock products', statusCode);
  }
};

/* ==========================================================================
   3. BRANCH STOCK TRANSFERS
   ========================================================================== */

export const getTransfers = async (req, res) => {
  try {
    const result = await inventoryService.getTransfers(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Stock transfers fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch transfers', statusCode);
  }
};

export const getTransferById = async (req, res) => {
  try {
    const transfer = await inventoryService.getTransferById(req.params.id, req.user);
    return successResponse(res, { transfer }, 'Transfer details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Stock transfer not found', statusCode);
  }
};

export const createTransfer = async (req, res) => {
  try {
    const validatedData = createTransferSchema.parse(req.body);
    const transfer = await inventoryService.createTransfer(validatedData, req.user, req);
    return successResponse(res, { transfer }, 'Stock transfer created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create transfer', statusCode);
  }
};

export const approveTransfer = async (req, res) => {
  try {
    const transfer = await inventoryService.approveTransfer(req.params.id, req.user, req);
    return successResponse(res, { transfer }, 'Stock transfer approved', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to approve transfer', statusCode);
  }
};

export const receiveTransfer = async (req, res) => {
  try {
    const validatedData = receiveTransferSchema.parse(req.body || {});
    const transfer = await inventoryService.receiveTransfer(req.params.id, validatedData, req.user, req);
    return successResponse(res, { transfer }, 'Stock transfer received and inventory updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to receive transfer', statusCode);
  }
};

export const rejectTransfer = async (req, res) => {
  try {
    const transfer = await inventoryService.rejectTransfer(req.params.id, req.body?.reason || '', req.user, req);
    return successResponse(res, { transfer }, 'Stock transfer rejected', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to reject transfer', statusCode);
  }
};
