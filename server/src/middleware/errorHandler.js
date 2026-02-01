/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging
 */

const { config } = require("../config");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../constants");

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types for common scenarios
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
  }
}

// MongoDB error handler
function handleMongoError(error) {
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => err.message);
    return new ValidationError(ERROR_MESSAGES.VALIDATION_FAILED_ERROR, errors);
  }

  if (error.name === "CastError") {
    return new ValidationError(ERROR_MESSAGES.INVALID_FIELD(error.path, error.value));
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new ValidationError(`${field} ${ERROR_MESSAGES.FIELD_ALREADY_EXISTS}`);
  }

  return error;
}

// Axios error handler
function handleAxiosError(error) {
  if (error.response) {
    const message = error.response.data?.message || error.response.data?.error || error.message;
    return new AppError(message, error.response.status, error.response.data);
  }

  if (error.request) {
    return new AppError(ERROR_MESSAGES.EXTERNAL_SERVICE_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  return new AppError(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

// Main error handler middleware
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === "ValidationError" || err.name === "CastError" || err.code === 11000) {
    error = handleMongoError(err);
  } else if (err.isAxiosError) {
    error = handleAxiosError(err);
  }

  // Set default values
  const statusCode = error.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  // Log errors
  if (config.nodeEnv === "development") {
    console.error("❌ Error:", {
      method: req.method,
      path: req.path,
      statusCode,
      message,
      stack: err.stack,
    });
  } else {
    console.error("❌ Error:", {
      method: req.method,
      path: req.path,
      statusCode,
      message,
    });
  }

  // Send error response
  const response = {
    success: false,
    error: message,
  };

  if (error.details) {
    response.details = error.details;
  }

  if (config.nodeEnv === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// Async handler wrapper - eliminates try-catch boilerplate
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`${ERROR_MESSAGES.ROUTE_NOT_FOUND}: ${req.originalUrl}`));
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
