import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../constants";
import { ERROR_MESSAGES } from "../constants/messages";
import connectDB from "../database/connection";

/**
 * Ensures MongoDB is connected before handling the request.
 * Required on Vercel serverless where connect at module load may not finish in time.
 */
export async function ensureDb(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    next();
  } catch {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      error: ERROR_MESSAGES.DATABASE_UNAVAILABLE,
    });
  }
}
