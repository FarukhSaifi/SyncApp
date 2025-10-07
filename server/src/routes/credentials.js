const express = require("express");
const controller = require("../controllers/credentialsController");

const router = express.Router();

router.get("/", controller.list);
router.get("/:platform", controller.get);
router.put("/:platform", controller.upsert);
router.delete("/:platform", controller.remove);

module.exports = router;
