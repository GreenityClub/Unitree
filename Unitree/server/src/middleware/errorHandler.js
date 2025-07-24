const logger = require('../utils/logger');
const { env } = require('../config/env');

// =================================================================
// ==                      CUSTOM ERROR CLASS                     ==
// =================================================================

/**
 * Custom error class for operational errors that are expected and can be shown to the client.
 * @param {string} message - The error message.
 * @param {number} statusCode - The HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// =================================================================
// ==                 SPECIFIC ERROR HANDLERS                   ==
// =================================================================

/** Handles Mongoose CastError (e.g., invalid ObjectId). */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/** Handles Mongoose duplicate field errors (e.g., unique index violation). */
const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

/** Handles Mongoose validation errors. */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join(' ')}`;
  return new AppError(message, 400);
};

/** Handles JWT verification errors. */
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);

/** Handles expired JWT errors. */
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

// =================================================================
// ==                 ENVIRONMENT-BASED SENDERS                 ==
// =================================================================

/** Sends detailed error response in development environment. */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/** Sends generic or operational error response in production environment. */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak details
  logger.error('UNHANDLED PROD ERROR:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

// =================================================================
// ==                   GLOBAL ERROR HANDLER                    ==
// =================================================================

/**
 * Global error handling middleware for Express.
 * Catches errors from `catchAsync` and formats them based on environment.
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else { // Production or other environments
    let error = { ...err, message: err.message, name: err.name };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// =================================================================
// ==                   ASYNC WRAPPER UTILITY                   ==
// =================================================================

/**
 * Wraps async route handlers to catch any unhandled promise rejections
 * and pass them to the global error handler.
 * @param {function} fn - The async route handler function.
 */
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
}; 