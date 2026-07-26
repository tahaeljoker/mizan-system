/**
 * NoSQL Injection Protection Middleware
 * Strips keys containing '$' or '.' from req.body, req.query, and req.params
 */
const sanitize = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (/^\$|\./.test(key)) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  }
  return obj;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};
