import { ZodError } from 'zod';
import * as notificationService from '../services/notification.service.js';
import * as approvalService from '../services/approval.service.js';
import * as auditService from '../services/audit.service.js';
import * as jobService from '../services/job.service.js';
import {
  createNotificationSchema,
  createApprovalSchema,
  processApprovalSchema,
  runJobSchema
} from '../validators/workflow.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

/* ==========================================================================
   1. NOTIFICATIONS CONTROLLER
   ========================================================================== */

export const getNotifications = async (req, res) => {
  try {
    const result = await notificationService.getNotifications(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch notifications', statusCode);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const result = await notificationService.getUnreadCount(req.user);
    return successResponse(res, result, 'Unread count fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch unread count', statusCode);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user);
    return successResponse(res, { notification }, 'Notification marked as read', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to mark notification as read', statusCode);
  }
};

export const markAllRead = async (req, res) => {
  try {
    const result = await notificationService.markAllRead(req.user);
    return successResponse(res, result, 'All notifications marked as read', 200);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to mark all as read', statusCode);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user);
    return successResponse(res, {}, 'Notification deleted successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete notification', statusCode);
  }
};

/* ==========================================================================
   2. APPROVAL WORKFLOW CONTROLLER
   ========================================================================== */

export const createApproval = async (req, res) => {
  try {
    const validatedData = createApprovalSchema.parse(req.body);
    const request = await approvalService.createApprovalRequest(validatedData, req.user);
    return successResponse(res, { request }, 'Approval request submitted successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create approval request', statusCode);
  }
};

export const approveRequest = async (req, res) => {
  try {
    const validatedData = processApprovalSchema.parse(req.body || {});
    const request = await approvalService.approveRequest(req.params.id, validatedData, req.user);
    return successResponse(res, { request }, 'Approval request approved', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to approve request', statusCode);
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const validatedData = processApprovalSchema.parse(req.body || {});
    const request = await approvalService.rejectRequest(req.params.id, validatedData, req.user);
    return successResponse(res, { request }, 'Approval request rejected', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to reject request', statusCode);
  }
};

export const cancelRequest = async (req, res) => {
  try {
    const request = await approvalService.cancelRequest(req.params.id, req.user);
    return successResponse(res, { request }, 'Approval request cancelled', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to cancel request', statusCode);
  }
};

export const getApprovals = async (req, res) => {
  try {
    const result = await approvalService.getApprovals(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Approval requests fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch approval requests', statusCode);
  }
};

export const getPendingApprovals = async (req, res) => {
  try {
    const result = await approvalService.getPendingApprovals(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Pending approval requests fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch pending requests', statusCode);
  }
};

export const getApprovalHistory = async (req, res) => {
  return getApprovals(req, res);
};

/* ==========================================================================
   3. AUDIT TRAIL CONTROLLER
   ========================================================================== */

export const getAuditTrail = async (req, res) => {
  try {
    const result = await auditService.getAuditTrail(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Audit trail records fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch audit trail', statusCode);
  }
};

export const getAuditById = async (req, res) => {
  try {
    const audit = await auditService.getAuditById(req.params.id, req.user);
    return successResponse(res, { audit }, 'Audit record details fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Audit record not found', statusCode);
  }
};

/* ==========================================================================
   4. BACKGROUND JOBS CONTROLLER
   ========================================================================== */

export const getJobsList = async (req, res) => {
  try {
    const jobs = jobService.getJobsList();
    return successResponse(res, { jobs }, 'Registered background jobs list fetched', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch jobs list', 500);
  }
};

export const runJob = async (req, res) => {
  try {
    const jobName = req.params.job;
    const validatedData = runJobSchema.parse({ jobName });
    const log = await jobService.runJob(validatedData.jobName, req.user);
    return successResponse(res, { jobLog: log }, `Background job '${jobName}' executed successfully`, 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Job execution failed', statusCode);
  }
};

export const getJobHistory = async (req, res) => {
  try {
    const history = await jobService.getJobHistory(req.user);
    return successResponse(res, { history }, 'Job execution history fetched successfully', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch job history', 500);
  }
};
