/**
 * Central API route registration. Mounts all feature routes under /api.
 * Single place to add or remove API modules.
 */
const express = require("express");
const authRoutes = require("./auth");
const postsRoutes = require("./posts");
const credentialsRoutes = require("./credentials");
const publishRoutes = require("./publish");
const mdxRoutes = require("./mdx");
const usersRoutes = require("./users");
const aiRoutes = require("./ai");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/posts", postsRoutes);
router.use("/credentials", credentialsRoutes);
router.use("/publish", publishRoutes);
router.use("/mdx", mdxRoutes);
router.use("/users", usersRoutes);
router.use("/ai", aiRoutes);

module.exports = router;
