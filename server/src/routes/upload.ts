import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../controllers/upload";
import { authenticateToken } from "../utils/auth";

const router: Router = Router();

// Configure multer to use memory storage since Vercel is serverless
// and we upload directly from memory to GCS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post("/", authenticateToken, upload.single("image"), uploadImage);

export default router;
