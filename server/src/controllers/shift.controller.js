import { ZodError } from 'zod';
import * as shiftService from '../services/shift.service.js';
import { openShiftSchema, closeShiftSchema } from '../validators/shift.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

export const getShifts = async (req, res) => {
  try {
    const result = await shiftService.getShifts(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Shifts history fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch shifts', statusCode);
  }
};

export const getCurrentShift = async (req, res) => {
  try {
    const shift = await shiftService.getCurrentShift(req.user);
    return successResponse(res, { shift }, 'Current active shift fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'No active shift found', statusCode);
  }
};

export const getShiftById = async (req, res) => {
  try {
    const shift = await shiftService.getShiftById(req.params.id, req.user);
    return successResponse(res, { shift }, 'Shift details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Shift not found', statusCode);
  }
};

export const openShift = async (req, res) => {
  try {
    const validatedData = openShiftSchema.parse(req.body);
    const shift = await shiftService.openShift(validatedData, req.user, req);
    return successResponse(res, { shift }, 'Shift opened successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to open shift', statusCode);
  }
};

export const closeShift = async (req, res) => {
  try {
    const validatedData = closeShiftSchema.parse(req.body);
    const shift = await shiftService.closeShift(req.params.id, validatedData, req.user, req);
    return successResponse(res, { shift }, 'Shift closed successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to close shift', statusCode);
  }
};

export const getHistory = async (req, res) => {
  return getShifts(req, res);
};

export const getDailyReport = async (req, res) => {
  try {
    const report = await shiftService.getDailyReport(req.query, req.user, req);
    return successResponse(res, { report }, 'Daily shift report fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch daily report', statusCode);
  }
};
