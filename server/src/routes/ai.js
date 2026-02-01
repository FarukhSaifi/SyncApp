const express = require("express");
const { authenticateToken } = require("../utils/auth");
const aiController = require("../controllers/aiController");

const router = express.Router();

// All AI routes require authentication
router.post("/outline", authenticateToken, aiController.postOutline);
router.post("/draft", authenticateToken, aiController.postDraft);
router.post("/comedian", authenticateToken, aiController.postComedian);
router.post("/generate", authenticateToken, aiController.postGenerate);

module.exports = router;
