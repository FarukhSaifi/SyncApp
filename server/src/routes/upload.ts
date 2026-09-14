import { Router } from "express";

import { getPresignedUrl } from "../controllers/upload";
import { validateBody } from "../middleware/validation";
import { presignedUrlRequestSchema } from "../schemas";
import { authenticateToken } from "../utils/auth";

const router: Router = Router();

/**
 * POST /api/upload/presigned-url
 * Returns a cryptographically signed V4 PUT URL targeting Firebase/GCS bucket.
 */
router.post(
  "/presigned-url",
  authenticateToken,
  validateBody(presignedUrlRequestSchema),
  getPresignedUrl,
);

export default router;
