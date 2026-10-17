
import * as controller from "@controllers/linkedinController";
import { authenticateToken } from "@utils/auth";
import { Router } from "express";

const router: Router = Router();

router.get("/oauth/start", authenticateToken, controller.oauthStart);
router.get("/oauth/callback", controller.oauthCallback);
router.get("/oauth/status", authenticateToken, controller.oauthStatus);

export default router;
