const postsService = require("../services/postsService");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * Create a new post
 */
const createPost = asyncHandler(async (req, res) => {
  const post = await postsService.createPost({ ...req.body, author: req.userId });
  res.status(201).json({ success: true, data: post });
});

/**
 * Get all posts with pagination
 */
const getPosts = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await postsService.getPosts({ page, limit, userId: req.userId });
  res.json({ success: true, ...result });
});

/**
 * Get post by ID
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await postsService.getPostById(req.params.id, req.userId);
  res.json({ success: true, data: post });
});

/**
 * Get post by slug
 */
const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await postsService.getPostBySlug(req.params.slug, req.userId);
  res.json({ success: true, data: post });
});

/**
 * Update post
 */
const updatePost = asyncHandler(async (req, res) => {
  const post = await postsService.updatePost(req.params.id, req.body, req.userId);
  res.json({ success: true, data: post, message: "Post updated successfully" });
});

/**
 * Delete post
 */
const deletePost = asyncHandler(async (req, res) => {
  await postsService.deletePost(req.params.id, req.userId);
  res.json({ success: true, message: "Post deleted successfully" });
});

module.exports = { 
  createPost, 
  getPosts, 
  getPostById, 
  getPostBySlug, 
  updatePost, 
  deletePost 
};
