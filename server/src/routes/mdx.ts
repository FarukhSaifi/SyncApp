import { Router } from 'express';
import type { Request, Response } from 'express';
import createSlug from 'slugify';
import Post from '../models/Post';
import { authenticateToken } from '../utils/auth';
import { HTTP_STATUS, ERROR_MESSAGES, STRING_LIMITS, HTTP, MDX_CONFIG } from '../constants';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger('MDX');

// GET /api/mdx/:id - generate MDX content for a post
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.POST_NOT_FOUND });
      return;
    }

    if (post.author.toString() !== req.userId) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: ERROR_MESSAGES.ACCESS_DENIED_POST });
      return;
    }

    const frontMatterLines = [
      MDX_CONFIG.DELIMITER,
      `${MDX_CONFIG.FRONTMATTER_FIELDS.TITLE}: "${(post.title || '').replace(/"/g, '\\"')}"`,
      `${MDX_CONFIG.FRONTMATTER_FIELDS.DATE}: ${post.createdAt.toISOString()}`,
      post.tags && post.tags.length
        ? `${MDX_CONFIG.FRONTMATTER_FIELDS.TAGS}: [${post.tags.map((t) => `'${t}'`).join(', ')}]`
        : null,
      post.cover_image ? `${MDX_CONFIG.FRONTMATTER_FIELDS.COVER_IMAGE}: '${post.cover_image}'` : null,
      post.canonical_url ? `${MDX_CONFIG.FRONTMATTER_FIELDS.CANONICAL_URL}: '${post.canonical_url}'` : null,
      MDX_CONFIG.DELIMITER,
      '',
    ].filter(Boolean);

    const mdxContent = [...frontMatterLines, post.content_markdown || ''].join('\n');

    const titleSlug = createSlug(post.title || MDX_CONFIG.FILENAME.DEFAULT_TITLE, {
      lower: true,
      strict: true,
      trim: true,
      locale: 'en',
    }).slice(0, STRING_LIMITS.POST_SLUG_MAX);

    const datePrefix = (post.createdAt || new Date()).toISOString().slice(0, MDX_CONFIG.FILENAME.DATE_FORMAT_LENGTH);
    const filename = `${datePrefix}-${titleSlug}${MDX_CONFIG.FILENAME.EXTENSION}`;

    res.setHeader(HTTP.HEADERS.CONTENT_TYPE, HTTP.CONTENT_TYPES.MARKDOWN);
    res.setHeader(HTTP.HEADERS.CONTENT_DISPOSITION, `attachment; filename="${filename}"`);
    res.status(HTTP_STATUS.OK).send(mdxContent);
  } catch (error) {
    logger.error(ERROR_MESSAGES.MDX_GENERATION_ERROR_LOG, error as Error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: ERROR_MESSAGES.FAILED_TO_GENERATE_MDX });
  }
});

export default router;
