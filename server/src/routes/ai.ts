import { Router } from "express";
import * as aiController from "../controllers/aiController";
import { authenticateToken } from "../utils/auth";

const router: Router = Router();

// All AI routes require authentication
router.post("/generate", authenticateToken, aiController.postGenerate);
router.post("/generate-image", authenticateToken, aiController.postGenerateImage);
router.post("/edit", authenticateToken, aiController.postEdit);
router.post("/optimise", authenticateToken, aiController.postOptimise);

export default router;
