
import * as controller from "@controllers/publishController";
import { validateBody, validateQuery } from "@middleware/validation";
import { wordpressLinkExistingSchema, wordpressSearchSchema } from "@schemas";
import { authenticateToken } from "@utils/auth";
import { Router } from "express";

const router: Router = Router();

router.use(authenticateToken);

router.post("/medium", controller.publishMedium);
router.post("/devto", controller.publishDevto);
router.post("/wordpress", controller.publishWordpress);
router.get(
  "/wordpress/search",
  validateQuery(wordpressSearchSchema),
  controller.searchWordpressForLink,
);
router.post("/wordpress/link", validateBody(wordpressLinkExistingSchema), controller.linkWordpressExisting);
router.post("/linkedin", controller.publishLinkedin);
router.post("/all", controller.publishAll);
router.get("/medium/status/:postId", controller.statusMedium);

// Unpublish from specific platform
router.delete("/:platform/:postId", controller.unpublishPlatform);

export default router;
