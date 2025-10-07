const postsService = require("../services/postsService");

async function createPost(req, res) {
  try {
    const post = await postsService.createPost({ ...req.body, author: req.userId });
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ success: false, error: error.message });
  }
}

async function getPosts(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await postsService.getPosts({ page, limit, userId: req.userId });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPostById(req, res) {
  try {
    const post = await postsService.getPostById(req.params.id, req.userId);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });
    res.json({ success: true, data: post });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ success: false, error: error.message });
  }
}

async function getPostBySlug(req, res) {
  try {
    const post = await postsService.getPostBySlug(req.params.slug, req.userId);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });
    res.json({ success: true, data: post });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ success: false, error: error.message });
  }
}

async function updatePost(req, res) {
  try {
    const post = await postsService.updatePost(req.params.id, req.body, req.userId);
    res.json({ success: true, data: post, message: "Post updated successfully" });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ success: false, error: error.message });
  }
}

async function deletePost(req, res) {
  try {
    await postsService.deletePost(req.params.id, req.userId);
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ success: false, error: error.message });
  }
}

module.exports = { createPost, getPosts, getPostById, getPostBySlug, updatePost, deletePost };
