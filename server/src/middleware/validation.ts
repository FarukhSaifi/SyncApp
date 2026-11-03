import type { NextFunction, Request, Response } from "express";
import { type ZodSchema, ZodError } from "zod";

import { HTTP_STATUS } from "@constants/httpStatus";

function validationErrorPayload(error: ZodError, fallbackPath: string): { success: false; error: string } {
  const issues = error.issues
    .map((i) => `${i.path.join(".") || fallbackPath}: ${i.message}`)
    .join("; ");
  return {
    success: false,
    error: `Validation error: ${issues}`,
  };
}

/**
 * Middleware factory to validate request body using a Zod schema.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(validationErrorPayload(result.error as ZodError, "body"));
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory to validate request query using a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(validationErrorPayload(result.error as ZodError, "query"));
      return;
    }
    req.query = result.data as Request["query"];
    next();
  };
}
