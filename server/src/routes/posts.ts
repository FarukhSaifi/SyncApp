import { Router } from "express";
import * as postsController from "../controllers/postsController";
import { authenticateToken, optionalAuth } from "../utils/auth";

const router: Router = Router();

// GET /api/posts - Retrieve user's posts (authenticated) or public posts (unauthenticated)
router.get("/", optionalAuth, postsController.getPosts);

// GET /api/posts/slug/:slug - Retrieve a specific post by slug
router.get("/slug/:slug", optionalAuth, postsController.getPostBySlug);

// GET /api/posts/:id - Retrieve a specific post by id
router.get("/:id", optionalAuth, postsController.getPostById);

// POST /api/posts - Create a new post (authenticated only)
router.post("/", authenticateToken, postsController.createPost);

// PUT /api/posts/:id - Update a post (authenticated, owner only)
router.put("/:id", authenticateToken, postsController.updatePost);

// PUT /api/posts/:id/cover - Upload cover image (authenticated, owner only)
router.put("/:id/cover", authenticateToken, postsController.uploadPostCover);

// DELETE /api/posts/:id - Delete a post (authenticated, owner only)
router.delete("/:id", authenticateToken, postsController.deletePost);

export default router;
