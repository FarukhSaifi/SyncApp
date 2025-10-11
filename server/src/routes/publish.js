const express = require("express");
const controller = require("../controllers/publishController");

const router = express.Router();

router.post("/medium", controller.publishMedium);
router.post("/devto", controller.publishDevto);
router.post("/wordpress", controller.publishWordpress);
router.post("/all", controller.publishAll);
router.get("/medium/status/:postId", controller.statusMedium);

// Unpublish from specific platform
router.delete("/:platform/:postId", controller.unpublishPlatform);

module.exports = router;
