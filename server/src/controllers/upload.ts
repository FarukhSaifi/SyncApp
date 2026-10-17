
import { generatePresignedUploadUrl } from "@services/storage";
import type { PresignedUrlRequest } from "@types";
import { logger } from "@utils/logger";
import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "@constants/httpStatus";

/**
 * Generates a signed V4 PUT URL for client-side direct upload to Google Cloud Storage
 * (`GCS_BUCKET_NAME` / syncapp-ai-covers via `@google-cloud/storage`).
 * Not Firestore. Bypasses Vercel's 4.5MB serverless payload limit.
 */
export async function getPresignedUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { filename, contentType, size } = req.body as PresignedUrlRequest;

    logger.debug("Generating presigned upload URL:", { filename, contentType, size });

    const result = await generatePresignedUploadUrl(filename, contentType, size);

    res.status(HTTP_STATUS["OK"]).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
