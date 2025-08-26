const express = require("express");
const Post = require("../models/Post");

const router = express.Router();

// GET /api/posts - Retrieve all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch posts",
    });
  }
});

// GET /api/posts/:id - Retrieve a specific post
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch post",
    });
  }
});

// POST /api/posts - Create a new post
router.post("/", async (req, res) => {
  try {
    const { title, content_markdown, status = "draft" } = req.body;

    if (!title || !content_markdown) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
    }

    const post = await Post.create({
      title,
      content_markdown,
      status,
    });

    res.status(201).json({
      success: true,
      data: post,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create post",
    });
  }
});

// PUT /api/posts/:id - Update a post
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content_markdown, status } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content_markdown !== undefined) updateData.content_markdown = content_markdown;
    if (status !== undefined) updateData.status = status;

    const post = await Post.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    res.json({
      success: true,
      data: post,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update post",
    });
  }
});

// DELETE /api/posts/:id - Delete a post
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete post",
    });
  }
});

module.exports = router;
