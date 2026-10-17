
import * as controller from "@controllers/credentialsController";
import { validateBody } from "@middleware/validation";
import { upsertCredentialSchema } from "@schemas";
import { authenticateToken } from "@utils/auth";
import { Router } from "express";

const router: Router = Router();

router.use(authenticateToken);

router.get("/", controller.list);
router.get("/:platform", controller.get);
router.put("/:platform", validateBody(upsertCredentialSchema), controller.upsert);
router.delete("/:platform", controller.remove);

export default router;
