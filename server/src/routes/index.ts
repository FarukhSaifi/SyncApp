/**
 * Central API route registration. Mounts all feature routes under /api.
 * Route paths from constants/routes.ts.
 */
import { Router } from "express";
import { ROUTES } from "../constants";
import aiRoutes from "./ai";
import analyticsRoutes from "./analytics";
import authRoutes from "./auth";
import credentialsRoutes from "./credentials";
import cronRoutes from "./cron";
import mdxRoutes from "./mdx";
import postsRoutes from "./posts";
import publishRoutes from "./publish";
import uploadRoutes from "./upload";
import usersRoutes from "./users";

const router: Router = Router();

router.use(ROUTES.AUTH, authRoutes);
router.use(ROUTES.POSTS, postsRoutes);
router.use(ROUTES.CREDENTIALS, credentialsRoutes);
router.use(ROUTES.PUBLISH, publishRoutes);
router.use(ROUTES.MDX, mdxRoutes);
router.use(ROUTES.USERS, usersRoutes);
router.use(ROUTES.AI, aiRoutes);
router.use(ROUTES.UPLOAD, uploadRoutes);
router.use(ROUTES.CRON, cronRoutes);
router.use(ROUTES.ANALYTICS, analyticsRoutes);

export default router;
