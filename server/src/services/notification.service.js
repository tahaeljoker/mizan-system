import mongoose from 'mongoose';
import Notification from '../../models/Notification.js';

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

export const createNotification = async (data, user = {}) => {
  return Notification.create({
    orgId: data.orgId || user.orgId,
    title: data.title,
    message: data.message,
    type: data.type || 'INFO',
    priority: data.priority || 'MEDIUM',
    userId: data.userId || null,
    role: data.role || null,
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    action: data.action || null,
    metadata: data.metadata || {},
    createdBy: user._id || null
  });
};

export const broadcastNotification = async ({ orgId, title, message, type = 'INFO', priority = 'MEDIUM', entityType, entityId }) => {
  return Notification.create({
    orgId,
    title,
    message,
    type,
    priority,
    entityType,
    entityId
  });
};

export const notifyUser = async ({ orgId, userId, title, message, type = 'INFO', priority = 'MEDIUM', entityType, entityId }) => {
  return Notification.create({
    orgId,
    userId,
    title,
    message,
    type,
    priority,
    entityType,
    entityId
  });
};

export const notifyRole = async ({ orgId, role, title, message, type = 'INFO', priority = 'MEDIUM', entityType, entityId }) => {
  return Notification.create({
    orgId,
    role,
    title,
    message,
    type,
    priority,
    entityType,
    entityId
  });
};

export const getUnreadCount = async (user) => {
  const orgId = user.orgId;
  const count = await Notification.countDocuments({
    orgId,
    isRead: false,
    $or: [
      { userId: user._id },
      { role: user.role },
      { userId: null, role: null }
    ]
  });
  return { unreadCount: count };
};

export const markAsRead = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid notification ID');
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findOne({ _id: id, orgId: user.orgId });
  if (!notification) {
    const error = new Error('الإشعار غير موجود');
    error.statusCode = 404;
    throw error;
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

export const markAllRead = async (user) => {
  const orgId = user.orgId;
  await Notification.updateMany(
    {
      orgId,
      isRead: false,
      $or: [
        { userId: user._id },
        { role: user.role },
        { userId: null, role: null }
      ]
    },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return { success: true };
};

export const deleteNotification = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid notification ID');
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findOneAndDelete({ _id: id, orgId: user.orgId });
  if (!notification) {
    const error = new Error('الإشعار غير موجود');
    error.statusCode = 404;
    throw error;
  }

  return true;
};

export const getNotifications = async (queryParams, user) => {
  const { search, type, priority, isRead, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = {
    orgId,
    $or: [
      { userId: user._id },
      { role: user.role },
      { userId: null, role: null }
    ]
  };

  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (isRead !== undefined && isRead !== null) filter.isRead = isRead === 'true' || isRead === true;

  if (search && search.trim()) {
    filter.$and = filter.$and || [];
    const sRegex = new RegExp(search.trim(), 'i');
    filter.$and.push({
      $or: [{ title: sRegex }, { message: sRegex }]
    });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, totalItems] = await Promise.all([
    Notification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter)
  ]);

  return buildPaginationResponse(notifications, pageNum, limitNum, totalItems);
};
