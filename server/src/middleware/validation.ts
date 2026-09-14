import type { NextFunction, Request, Response } from "express";
import { type ZodSchema, ZodError } from "zod";

import { HTTP_STATUS } from "../constants/httpStatus";

/**
 * Middleware factory to validate request body using a Zod schema.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = (result.error as ZodError).issues
        .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
        .join("; ");
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `Validation error: ${issues}`,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
