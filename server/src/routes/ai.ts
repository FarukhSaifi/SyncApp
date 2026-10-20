
import * as aiController from "@controllers/aiController";
import { validateBody } from "@middleware/validation";
import { keywordResearchRequestSchema } from "@schemas";
import { authenticateToken } from "@utils/auth";
import { Router } from "express";

const router: Router = Router();

// All AI routes require authentication
router.get("/capabilities", authenticateToken, aiController.getCapabilities);
router.get("/trending-topics", authenticateToken, aiController.getTrendingTopics);
router.get("/devto-tags", authenticateToken, aiController.getDevtoReachTags);
router.post("/generate", authenticateToken, aiController.postGenerate);
router.post(
  "/keyword-research",
  authenticateToken,
  validateBody(keywordResearchRequestSchema),
  aiController.postKeywordResearch,
);
router.post("/generate-image", authenticateToken, aiController.postGenerateImage);
router.post("/generate-linkedin-summary", authenticateToken, aiController.postGenerateLinkedInSummary);
router.post("/edit", authenticateToken, aiController.postEdit);

export default router;
