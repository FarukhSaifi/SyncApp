/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging
 */

const { config } = require("../config");

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
    return new ValidationError("Validation failed", errors);
  }

  if (error.name === "CastError") {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new ValidationError(`${field} already exists`);
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
    return new AppError("External service unavailable", 503);
  }

  return new AppError(error.message, 500);
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
  const statusCode = error.statusCode || err.status || 500;
  const message = error.message || "Internal server error";

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
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
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
