const express = require("express");
const Post = require("../models/Post");
const { authenticateToken } = require("../utils/auth");
const { HTTP_STATUS, ERROR_MESSAGES, STRING_LIMITS, HTTP, MDX_CONFIG } = require("../constants");

const router = express.Router();

// GET /api/mdx/:id - generate MDX content for a post
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.POST_NOT_FOUND });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: ERROR_MESSAGES.ACCESS_DENIED_POST });
    }

    const frontMatterLines = [
      MDX_CONFIG.DELIMITER,
      `${MDX_CONFIG.FRONTMATTER_FIELDS.TITLE}: "${(post.title || "").replace(/"/g, '\\"')}"`,
      `${MDX_CONFIG.FRONTMATTER_FIELDS.DATE}: ${post.createdAt.toISOString()}`,
      post.tags && post.tags.length
        ? `${MDX_CONFIG.FRONTMATTER_FIELDS.TAGS}: [${post.tags.map((t) => `'${t}'`).join(", ")}]`
        : null,
      post.cover_image ? `${MDX_CONFIG.FRONTMATTER_FIELDS.COVER_IMAGE}: '${post.cover_image}'` : null,
      post.canonical_url ? `${MDX_CONFIG.FRONTMATTER_FIELDS.CANONICAL_URL}: '${post.canonical_url}'` : null,
      MDX_CONFIG.DELIMITER,
      "",
    ].filter(Boolean);

    // Assume content_markdown is valid markdown which MDX accepts
    const mdxContent = [...frontMatterLines, post.content_markdown || ""].join("\n");

    // Build a slug-based filename: YYYY-MM-DD-title-slug.mdx (using slugify)
    const createSlug = require("slugify");
    const titleSlug = createSlug(post.title || MDX_CONFIG.FILENAME.DEFAULT_TITLE, {
      lower: true,
      strict: true,
      trim: true,
      locale: "en",
    }).slice(0, STRING_LIMITS.POST_SLUG_MAX);

    const datePrefix = (post.createdAt || new Date()).toISOString().slice(0, MDX_CONFIG.FILENAME.DATE_FORMAT_LENGTH);
    const filename = `${datePrefix}-${titleSlug}${MDX_CONFIG.FILENAME.EXTENSION}`;

    res.setHeader(HTTP.HEADERS.CONTENT_TYPE, HTTP.CONTENT_TYPES.MARKDOWN);
    res.setHeader(HTTP.HEADERS.CONTENT_DISPOSITION, `attachment; filename="${filename}"`);
    return res.status(HTTP_STATUS.OK).send(mdxContent);
  } catch (error) {
    console.error(ERROR_MESSAGES.MDX_GENERATION_ERROR_LOG, error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: ERROR_MESSAGES.FAILED_TO_GENERATE_MDX });
  }
});

module.exports = router;
