import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import Organization from '../../models/Organization.js';
import Session from '../../models/Session.js';
import RefreshToken from '../../models/RefreshToken.js';
import Role from '../../models/Role.js';
import Permission from '../../models/Permission.js';
import Branch from '../../models/Branch.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'mizansecretkey123';
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || getJwtSecret();

/**
 * Get default permissions list for standard roles
 */
const getDefaultPermissionsByRole = (role) => {
  switch (role) {
    case 'owner':
    case 'admin':
      return [
        'pos:read', 'pos:write',
        'inventory:read', 'inventory:write',
        'reports:read', 'reports:write',
        'users:manage', 'settings:manage',
        'billing:manage'
      ];
    case 'manager':
      return [
        'pos:read', 'pos:write',
        'inventory:read', 'inventory:write',
        'reports:read'
      ];
    case 'warehouse':
      return [
        'inventory:read', 'inventory:write'
      ];
    case 'cashier':
    default:
      return [
        'pos:read', 'pos:write'
      ];
  }
};

/**
 * Service: Login User
 */
export const loginUser = async ({ email, password }, req = {}) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    const error = new Error('البريد الإلكتروني غير مسجل في النظام');
    error.statusCode = 401;
    throw error;
  }

  if (user.isDeleted || user.status === 'deleted') {
    const error = new Error('الحساب محذوف. يرجى التواصل مع الدعم الفني.');
    error.statusCode = 403;
    throw error;
  }

  if (user.status === 'inactive') {
    const error = new Error('الحساب غير مفعل حالياً.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(cleanPassword);
  if (!isMatch) {
    const error = new Error('كلمة المرور غير صحيحة!');
    error.statusCode = 401;
    throw error;
  }

  // 1. Generate Access Token (15 minutes)
  const accessToken = jwt.sign(
    { id: user._id, role: user.role, orgId: user.orgId },
    getJwtSecret(),
    { expiresIn: '15m' }
  );

  // 2. Generate Refresh Token (30 days)
  const refreshToken = jwt.sign(
    { id: user._id, type: 'refresh' },
    getJwtRefreshSecret(),
    { expiresIn: '30d' }
  );

  // 3. Store Session
  const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const session = await Session.create({
    userId: user._id,
    token: accessToken,
    ipAddress: req.ip || req.socket?.remoteAddress || '',
    userAgent: req.headers?.['user-agent'] || '',
    isRevoked: false,
    expiresAt: sessionExpiresAt
  });

  // 4. Store Refresh Token
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    sessionId: session._id,
    isRevoked: false,
    expiresAt: sessionExpiresAt
  });

  // 5. Fetch Tenant Organization
  const tenantOrg = await Organization.findById(user.orgId);
  const tenant = tenantOrg ? {
    id: tenantOrg._id,
    name: tenantOrg.name,
    ownerName: tenantOrg.ownerName,
    plan: tenantOrg.plan,
    status: tenantOrg.status
  } : { id: user.orgId, name: 'ميزان', status: 'active' };

  // 6. Role & Permissions
  let roleData = { name: user.role, code: user.role };
  let permissionsList = getDefaultPermissionsByRole(user.role);

  if (user.roleId) {
    const customRole = await Role.findById(user.roleId).populate('permissions');
    if (customRole) {
      roleData = { id: customRole._id, name: customRole.name, code: customRole.code };
      if (customRole.permissions && customRole.permissions.length > 0) {
        permissionsList = customRole.permissions.map(p => p.code || p.name);
      }
    }
  }

  // 7. Sanitized User
  const sanitizedUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchName: user.branchName,
    status: user.status
  };

  return {
    token: accessToken,
    refreshToken,
    user: sanitizedUser,
    role: roleData,
    permissions: permissionsList,
    tenant
  };
};

/**
 * Service: Get Authenticated User Profile
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user || user.isDeleted || user.status === 'deleted') {
    const error = new Error('User not found or deleted');
    error.statusCode = 404;
    throw error;
  }

  if (user.status === 'inactive') {
    const error = new Error('User account is inactive');
    error.statusCode = 403;
    throw error;
  }

  // Fetch Tenant
  const tenantOrg = await Organization.findById(user.orgId);
  const tenant = tenantOrg ? {
    id: tenantOrg._id,
    name: tenantOrg.name,
    ownerName: tenantOrg.ownerName,
    plan: tenantOrg.plan,
    status: tenantOrg.status
  } : { id: user.orgId, name: 'ميزان', status: 'active' };

  // Fetch Branch
  let branchData = { name: user.branchName || 'الرئيسي' };
  if (user.branchId) {
    const branchDoc = await Branch.findById(user.branchId);
    if (branchDoc) {
      branchData = { id: branchDoc._id, name: branchDoc.name, code: branchDoc.code };
    }
  }

  // Role & Permissions
  let roleData = { name: user.role, code: user.role };
  let permissionsList = getDefaultPermissionsByRole(user.role);

  if (user.roleId) {
    const customRole = await Role.findById(user.roleId).populate('permissions');
    if (customRole) {
      roleData = { id: customRole._id, name: customRole.name, code: customRole.code };
      if (customRole.permissions && customRole.permissions.length > 0) {
        permissionsList = customRole.permissions.map(p => p.code || p.name);
      }
    }
  }

  const sanitizedUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchName: user.branchName,
    status: user.status,
    createdAt: user.createdAt
  };

  return {
    user: sanitizedUser,
    role: roleData,
    permissions: permissionsList,
    branch: branchData,
    company: tenant,
    tenant
  };
};

/**
 * Service: Refresh Access Token
 */
export const refreshAccessToken = async (refreshTokenString, req = {}) => {
  if (!refreshTokenString) {
    const error = new Error('Refresh token is required');
    error.statusCode = 400;
    throw error;
  }

  const tokenDoc = await RefreshToken.findOne({ token: refreshTokenString, isRevoked: false });
  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenString, getJwtRefreshSecret());
  } catch (err) {
    const error = new Error('Malformed or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user || user.isDeleted || user.status === 'deleted' || user.status === 'inactive') {
    const error = new Error('Account inactive or deleted');
    error.statusCode = 403;
    throw error;
  }

  // Rotate Refresh Token: Revoke current refresh token
  tokenDoc.isRevoked = true;
  await tokenDoc.save();

  // Issue new Access Token (15m) & Refresh Token (30d)
  const newAccessToken = jwt.sign(
    { id: user._id, role: user.role, orgId: user.orgId },
    getJwtSecret(),
    { expiresIn: '15m' }
  );

  const newRefreshToken = jwt.sign(
    { id: user._id, type: 'refresh' },
    getJwtRefreshSecret(),
    { expiresIn: '30d' }
  );

  const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    token: newRefreshToken,
    sessionId: tokenDoc.sessionId,
    isRevoked: false,
    expiresAt: sessionExpiresAt
  });

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * Service: Logout User
 */
export const logoutUser = async ({ userId, refreshTokenString }) => {
  if (refreshTokenString) {
    await RefreshToken.updateOne({ token: refreshTokenString }, { $set: { isRevoked: true } });
  }

  if (userId) {
    await Session.updateMany({ userId }, { $set: { isRevoked: true } });
    await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } });
  }

  return true;
};

/**
 * Service: Change User Password
 */
export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted || user.status === 'deleted') {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  await user.save();

  // Revoke all sessions & refresh tokens to force re-login on all devices
  await Session.updateMany({ userId: user._id }, { $set: { isRevoked: true } });
  await RefreshToken.updateMany({ userId: user._id }, { $set: { isRevoked: true } });

  return true;
};
