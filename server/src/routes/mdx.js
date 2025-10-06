const express = require("express");
const Post = require("../models/Post");
const { authenticateToken } = require("../utils/auth");

const router = express.Router();

// GET /api/mdx/:id - generate MDX content for a post
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const frontMatterLines = [
      "---",
      `title: "${(post.title || "").replace(/"/g, '\\"')}"`,
      `date: ${post.createdAt.toISOString()}`,
      post.tags && post.tags.length ? `tags: [${post.tags.map((t) => `'${t}'`).join(", ")}]` : null,
      post.cover_image ? `cover_image: '${post.cover_image}'` : null,
      post.canonical_url ? `canonical_url: '${post.canonical_url}'` : null,
      "---",
      "",
    ].filter(Boolean);

    // Assume content_markdown is valid markdown which MDX accepts
    const mdxContent = [...frontMatterLines, post.content_markdown || ""].join("\n");

    // Build a slug-based filename: YYYY-MM-DD-title-slug.mdx (using slugify)
    const createSlug = require("slugify");
    const titleSlug = createSlug(post.title || "untitled-post", {
      lower: true,
      strict: true,
      trim: true,
      locale: "en",
    }).slice(0, 120);

    const datePrefix = (post.createdAt || new Date()).toISOString().slice(0, 10);
    const filename = `${datePrefix}-${titleSlug}.mdx`;

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(mdxContent);
  } catch (error) {
    console.error("Error generating MDX:", error);
    return res.status(500).json({ success: false, error: "Failed to generate MDX" });
  }
});

module.exports = router;
