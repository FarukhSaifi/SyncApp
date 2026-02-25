/**
 * Central API route registration. Mounts all feature routes under /api.
 * Route paths from constants/routes.ts.
 */
import { Router } from 'express';
import { ROUTES } from '../constants';
import authRoutes from './auth';
import postsRoutes from './posts';
import credentialsRoutes from './credentials';
import publishRoutes from './publish';
import mdxRoutes from './mdx';
import usersRoutes from './users';
import aiRoutes from './ai';

const router: Router = Router();

router.use(ROUTES.AUTH, authRoutes);
router.use(ROUTES.POSTS, postsRoutes);
router.use(ROUTES.CREDENTIALS, credentialsRoutes);
router.use(ROUTES.PUBLISH, publishRoutes);
router.use(ROUTES.MDX, mdxRoutes);
router.use(ROUTES.USERS, usersRoutes);
router.use(ROUTES.AI, aiRoutes);

export default router;
