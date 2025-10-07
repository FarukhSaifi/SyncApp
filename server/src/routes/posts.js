const express = require("express");
const { authenticateToken, optionalAuth } = require("../utils/auth");
const postsController = require("../controllers/postsController");

const router = express.Router();

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

// DELETE /api/posts/:id - Delete a post (authenticated, owner only)
router.delete("/:id", authenticateToken, postsController.deletePost);

module.exports = router;
