/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging
 */

import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { config } from "../config";
import { DEFAULT_VALUES, ERROR_MESSAGES, HTTP_STATUS } from "../constants";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  details: unknown;
  isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: unknown = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.RESOURCE_NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED_ACCESS) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.ACCESS_DENIED) {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

import { AxiosErrorLike, MongoCastError, MongoDuplicateKeyError, MongoValidationError } from "../types";

function handleMongoError(error: Error & { code?: number; keyPattern?: Record<string, unknown> }): AppError {
  if (error.name === "ValidationError") {
    const mongoErr = error as unknown as MongoValidationError;
    const errors = Object.values(mongoErr.errors).map((err) => err.message);
    return new ValidationError(ERROR_MESSAGES.VALIDATION_FAILED_ERROR, errors);
  }

  if (error.name === "CastError") {
    const castErr = error as unknown as MongoCastError;
    return new ValidationError(ERROR_MESSAGES.INVALID_FIELD(castErr.path, castErr.value));
  }

  if (error.code === 11000) {
    const dupErr = error as unknown as MongoDuplicateKeyError;
    const field = Object.keys(dupErr.keyPattern)[0];
    return new ValidationError(`${field} ${ERROR_MESSAGES.FIELD_ALREADY_EXISTS}`);
  }

  return error as unknown as AppError;
}

function handleAxiosError(error: AxiosErrorLike): AppError {
  if (error.response) {
    const data = error.response.data;
    const message =
      (typeof data === "object" && data !== null
        ? (data as { message?: string; error?: string; errors?: Array<{ message?: string }> }).message ||
          (data as { error?: string }).error ||
          (data as { errors?: Array<{ message?: string }> }).errors?.[0]?.message
        : undefined) ||
      (typeof data === "string" ? data : undefined) ||
      error.message;
    return new AppError(message, error.response.status, data);
  }

  if (error.request) {
    return new AppError(ERROR_MESSAGES.EXTERNAL_SERVICE_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  return new AppError(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

export const errorHandler: ErrorRequestHandler = (
  err: Error & {
    statusCode?: number;
    status?: number;
    code?: number;
    details?: unknown;
    isAxiosError?: boolean;
    keyPattern?: Record<string, unknown>;
  },
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  if (err.name === "ValidationError" || err.name === "CastError" || err.code === 11000) {
    error = handleMongoError(err);
  } else if (err.isAxiosError) {
    error = handleAxiosError(err as unknown as AxiosErrorLike);
  }

  const statusCode = error.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  logger.error(message, error instanceof Error ? error : null, {
    method: req.method,
    path: req.path,
    statusCode,
    ...(error.details != null ? { details: error.details } : {}),
  });

  const response: Record<string, unknown> = {
    success: false,
    error: message,
  };

  if (error.details) {
    response["details"] = error.details;
  }

  if (config.nodeEnv === DEFAULT_VALUES.NODE_ENV_DEVELOPMENT) {
    response["stack"] = err.stack;
  }

  res.status(statusCode).json(response);
};

export function asyncHandler<T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new NotFoundError(`${ERROR_MESSAGES.ROUTE_NOT_FOUND}: ${req.originalUrl}`));
}
