/**
 * Central API route registration. Mounts all feature routes under /api.
 * Route paths from constants/routes.js.
 */
const express = require("express");
const { ROUTES } = require("../constants");
const authRoutes = require("./auth");
const postsRoutes = require("./posts");
const credentialsRoutes = require("./credentials");
const publishRoutes = require("./publish");
const mdxRoutes = require("./mdx");
const usersRoutes = require("./users");
const aiRoutes = require("./ai");

const router = express.Router();

router.use(ROUTES.AUTH, authRoutes);
router.use(ROUTES.POSTS, postsRoutes);
router.use(ROUTES.CREDENTIALS, credentialsRoutes);
router.use(ROUTES.PUBLISH, publishRoutes);
router.use(ROUTES.MDX, mdxRoutes);
router.use(ROUTES.USERS, usersRoutes);
router.use(ROUTES.AI, aiRoutes);

module.exports = router;
