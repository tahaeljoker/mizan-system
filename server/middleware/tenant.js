import asyncHandler from './asyncHandler.js';

/**
 * Middleware to sanitize request body by stripping sensitive or protected fields.
 * Prevents mass-assignment attacks where clients attempt to override tenant IDs or system fields.
 * 
 * @param {Array<string>} defaultFieldsToStrip List of fields to delete from req.body
 */
export const sanitizeBody = (fieldsToStrip = ['orgId', '_id', 'createdAt', 'updatedAt', '__v']) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      fieldsToStrip.forEach(field => {
        delete req.body[field];
      });
    }
    next();
  };
};

/**
 * Middleware to inject the authenticated user's orgId into req.body for POST/creation routes.
 * Ensures the tenant ID always comes directly from the verified JWT user session.
 */
export const injectOrgId = (req, res, next) => {
  if (req.user && req.user.orgId) {
    req.body.orgId = req.user.orgId;
  }
  next();
};

/**
 * Reusable ownership middleware.
 * Verifies that a resource exists and belongs to the authenticated user's organization.
 * Attaches the loaded Mongoose document to req.resource to prevent duplicate DB queries.
 * 
 * @param {Object} options Options containing { Model, param }
 * @param {Mongoose.Model} options.Model The Mongoose model to query
 * @param {string} [options.param='id'] The name of the route parameter containing the resource ID
 */
export const checkOwnership = ({ Model, param = 'id' }) => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[param];

    if (!resourceId) {
      return res.status(400).json({ success: false, message: 'معرف المورد غير محدد في الطلب' });
    }

    const resource = await Model.findOne({
      _id: resourceId,
      orgId: req.user.orgId
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'المورد غير موجود أو غير مصرح لك بالوصول إليه' });
    }

    // Attach loaded document to req.resource to eliminate redundant database queries
    req.resource = resource;
    next();
  });
};
