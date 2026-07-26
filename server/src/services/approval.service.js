import mongoose from 'mongoose';
import ApprovalRequest from '../../models/ApprovalRequest.js';
import * as notificationService from './notification.service.js';

const buildPaginationResponse = (data, page, limit, totalItems) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
};

export const createApprovalRequest = async (data, user) => {
  const orgId = user.orgId;
  const request = await ApprovalRequest.create({
    orgId,
    type: data.type,
    entityId: data.entityId,
    requestedBy: user._id,
    reason: data.reason || '',
    metadata: data.metadata || {},
    status: 'PENDING'
  });

  // Notify Admins & Managers
  await notificationService.notifyRole({
    orgId,
    role: 'admin',
    title: 'طلب موافقة جديد',
    message: `تم إنشاء طلب موافقة جديد لـ (${data.type}) بواسطة ${user.name}`,
    type: 'SYSTEM',
    priority: 'HIGH',
    entityType: 'ApprovalRequest',
    entityId: request._id
  });

  return request;
};

export const approveRequest = async (id, { comments }, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid approval request ID');
    error.statusCode = 400;
    throw error;
  }

  const request = await ApprovalRequest.findOne({ _id: id, orgId: user.orgId });
  if (!request) {
    const error = new Error('طلب الموافقة غير موجود');
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== 'PENDING') {
    const error = new Error(`طلب الموافقة حالته ${request.status} ومحسوم بالفعل`);
    error.statusCode = 400;
    throw error;
  }

  request.status = 'APPROVED';
  request.approvedBy = user._id;
  request.approvedAt = new Date();
  if (comments) request.comments = comments;
  await request.save();

  // Notify requester
  await notificationService.notifyUser({
    orgId: user.orgId,
    userId: request.requestedBy,
    title: 'تمت الموافقة على طلبك',
    message: `تمت الموافقة على طلب (${request.type}) بواسطة ${user.name}`,
    type: 'SUCCESS',
    priority: 'HIGH',
    entityType: 'ApprovalRequest',
    entityId: request._id
  });

  return request;
};

export const rejectRequest = async (id, { comments }, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid approval request ID');
    error.statusCode = 400;
    throw error;
  }

  const request = await ApprovalRequest.findOne({ _id: id, orgId: user.orgId });
  if (!request) {
    const error = new Error('طلب الموافقة غير موجود');
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== 'PENDING') {
    const error = new Error(`طلب الموافقة حالته ${request.status} ومحسوم بالفعل`);
    error.statusCode = 400;
    throw error;
  }

  request.status = 'REJECTED';
  request.rejectedBy = user._id;
  if (comments) request.comments = comments;
  await request.save();

  // Notify requester
  await notificationService.notifyUser({
    orgId: user.orgId,
    userId: request.requestedBy,
    title: 'تم رفض طلبك',
    message: `تم رفض طلب (${request.type}) بواسطة ${user.name}`,
    type: 'ERROR',
    priority: 'HIGH',
    entityType: 'ApprovalRequest',
    entityId: request._id
  });

  return request;
};

export const cancelRequest = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid approval request ID');
    error.statusCode = 400;
    throw error;
  }

  const request = await ApprovalRequest.findOne({ _id: id, orgId: user.orgId, requestedBy: user._id });
  if (!request) {
    const error = new Error('طلب الموافقة غير موجود أو غير مصرّح بإلغائه');
    error.statusCode = 404;
    throw error;
  }

  request.status = 'CANCELLED';
  await request.save();
  return request;
};

export const getApprovals = async (queryParams, user) => {
  const { type, status, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (type) filter.type = type;
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [requests, totalItems] = await Promise.all([
    ApprovalRequest.find(filter)
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ApprovalRequest.countDocuments(filter)
  ]);

  return buildPaginationResponse(requests, pageNum, limitNum, totalItems);
};

export const getPendingApprovals = async (queryParams, user) => {
  return getApprovals({ ...queryParams, status: 'PENDING' }, user);
};

export const getMyRequests = async (queryParams, user) => {
  const { status, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId, requestedBy: user._id };

  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [requests, totalItems] = await Promise.all([
    ApprovalRequest.find(filter)
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ApprovalRequest.countDocuments(filter)
  ]);

  return buildPaginationResponse(requests, pageNum, limitNum, totalItems);
};

export const getApprovalStats = async (user) => {
  const orgId = user.orgId;
  const pending = await ApprovalRequest.countDocuments({ orgId, status: 'PENDING' });
  const approved = await ApprovalRequest.countDocuments({ orgId, status: 'APPROVED' });
  const rejected = await ApprovalRequest.countDocuments({ orgId, status: 'REJECTED' });
  const cancelled = await ApprovalRequest.countDocuments({ orgId, status: 'CANCELLED' });

  return { pending, approved, rejected, cancelled, total: pending + approved + rejected + cancelled };
};
