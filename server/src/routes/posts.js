const express = require("express");
const Post = require("../models/Post");
const { authenticateToken, optionalAuth } = require("../utils/auth");

const router = express.Router();

// GET /api/posts - Retrieve user's posts (authenticated) or public posts (unauthenticated)
router.get("/", optionalAuth, async (req, res) => {
  try {
    let query = {};

    // If user is authenticated, show only their posts
    if (req.userId) {
      query.author = req.userId;
    } else {
      // If not authenticated, show only published posts
      query.status = "published";
    }

    const posts = await Post.find(query)
      .populate("author", "username firstName lastName")
      .sort({ createdAt: -1 });

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
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate("author", "username firstName lastName");

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    // Check if user can access this post
    if (post.status !== "published" && (!req.userId || post.author._id.toString() !== req.userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
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

// POST /api/posts - Create a new post (authenticated only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      content_markdown,
      status = "draft",
      tags,
      cover_image,
      canonical_url,
    } = req.body;

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
      tags: tags || [],
      cover_image,
      canonical_url,
      author: req.userId,
    });

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "username firstName lastName"
    );

    res.status(201).json({
      success: true,
      data: populatedPost,
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

// PUT /api/posts/:id - Update a post (authenticated, owner only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content_markdown, status, tags, cover_image, canonical_url } = req.body;

    // Find post and check ownership
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    // Check if user owns this post
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content_markdown !== undefined) updateData.content_markdown = content_markdown;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (canonical_url !== undefined) updateData.canonical_url = canonical_url;

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("author", "username firstName lastName");

    res.json({
      success: true,
      data: updatedPost,
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

// DELETE /api/posts/:id - Delete a post (authenticated, owner only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find post and check ownership
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    // Check if user owns this post
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    await Post.findByIdAndDelete(id);

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
