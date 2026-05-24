import { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES, HTTP_STATUS } from "../constants";
import { AppError } from "../middleware/errorHandler";
import { uploadToGCS } from "../services/storage";
import { logger } from "../utils/logger";

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError(ERROR_MESSAGES.UPLOAD_NO_FILE, HTTP_STATUS.BAD_REQUEST);
    }

    logger.debug("Processing image upload to GCS:", { filename: req.file.originalname });

    // GCS requires the buffer, original name, and mimetype
    const url = await uploadToGCS(req.file.buffer, req.file.originalname, req.file.mimetype, true);

    logger.debug("Image uploaded successfully:", { url });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    next(error);
  }
}
