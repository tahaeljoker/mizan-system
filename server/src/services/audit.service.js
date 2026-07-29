import mongoose from 'mongoose';
import AuditTrail from '../../models/AuditTrail.js';

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

const calculateDiff = (before = {}, after = {}) => {
  if (!before && !after) return null;
  const diff = {};
  const bKeys = Object.keys(before || {});
  const aKeys = Object.keys(after || {});
  const allKeys = Array.from(new Set([...bKeys, ...aKeys]));

  allKeys.forEach(key => {
    if (['createdAt', 'updatedAt', '__v'].includes(key)) return;
    const bVal = before ? before[key] : undefined;
    const aVal = after ? after[key] : undefined;
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diff[key] = { before: bVal, after: aVal };
    }
  });

  return diff;
};

export const recordAuditTrail = async ({ orgId, userId, action, entity, entityId, before, after, req = {} }) => {
  try {
    const diff = calculateDiff(before, after);
    const userAgent = req.headers ? (req.headers['user-agent'] || '') : '';
    const ipAddress = req.ip || (req.headers ? (req.headers['x-forwarded-for'] || '') : '');

    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    else if (/tablet/i.test(userAgent)) device = 'Tablet';

    return await AuditTrail.create({
      orgId,
      userId,
      action,
      entity,
      entityId: entityId || null,
      before: before || null,
      after: after || null,
      diff,
      ipAddress,
      userAgent,
      device
    });
  } catch (err) {
    // Non-blocking audit log error
  }
};

export const getAuditTrail = async (queryParams, user) => {
  const { entity, entityId, action, searchUser, dateFrom, dateTo, page = 1, limit = 20, sort = '-createdAt' } = queryParams;
  const orgId = user.orgId;
  const filter = { orgId };

  if (entity) filter.entity = entity;
  if (entityId && mongoose.Types.ObjectId.isValid(entityId)) filter.entityId = entityId;
  if (action) filter.action = action;
  if (searchUser && mongoose.Types.ObjectId.isValid(searchUser)) filter.userId = searchUser;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [audits, totalItems] = await Promise.all([
    AuditTrail.find(filter)
      .populate('userId', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditTrail.countDocuments(filter)
  ]);

  return buildPaginationResponse(audits, pageNum, limitNum, totalItems);
};

export const getAuditById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid audit record ID');
    error.statusCode = 400;
    throw error;
  }

  const audit = await AuditTrail.findOne({ _id: id, orgId: user.orgId })
    .populate('userId', 'name email role')
    .lean();

  if (!audit) {
    const error = new Error('سجل التدقيق غير موجود');
    error.statusCode = 404;
    throw error;
  }

  return audit;
};
