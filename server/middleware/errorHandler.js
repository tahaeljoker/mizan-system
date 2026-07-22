/**
 * Centralized Error Handling Middleware for Mizan ERP Server.
 * Ensures consistent JSON responses, appropriate HTTP status codes,
 * and hides sensitive stack traces in production environment.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = err.statusCode || 500;

  // Log error for server diagnostics
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔴 [Error Log]:', err);
  }

  // Mongoose Invalid ObjectId (CastError) -> 404
  if (err.name === 'CastError') {
    error.message = 'المورد غير موجود بالمعرف المحدد';
    statusCode = 404;
  }

  // Mongoose Duplicate Key Error (Code 11000) -> 409
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    const field = keys.length > 0 ? keys[0] : '';
    error.message = `بيانات مُكررة: القيمة المدخلة لحقل (${field}) مسجلة بالفعل بالمنظومة`;
    statusCode = 409;
  }

  // Mongoose Validation Error -> 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join('، ');
    statusCode = 400;
  }

  // JWT Errors -> 401
  if (err.name === 'JsonWebTokenError') {
    error.message = 'توكن غير صالح، يرجى إعادة تسجيل الدخول';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'حدث خطأ غير متوقع في الخادم',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

export default errorHandler;
