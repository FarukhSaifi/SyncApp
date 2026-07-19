import { DEFAULT_VALUES, ERROR_MESSAGES, FIELDS, POST_STATUS, VALIDATION_ERRORS, type PostStatus } from "../constants";
import type { CreatePostInput, GetPostsParams } from "../types";

import { cache, cacheKeys } from "../utils/cache";
import { ensureMarkdownContent } from "../utils/contentMarkdown";
import { logger } from "../utils/logger";
import { normalizeScheduledFor } from "../utils/scheduleUtils";

import { config } from "../config";
import { ForbiddenError, NotFoundError } from "../middleware/errorHandler";
import Post from "../models/Post";
import { buildCoverFilename, buildInlineImageFilename } from "../utils/mediaFilename";
import { uploadToGCS } from "./storage";

/**
 * Build canonical URL from slug.
 * - If CANONICAL_BASE_URL is set: returns `<base>/<slug>`
 * - Otherwise falls back to just the slug (so the field is never left blank)
 * Used when update uses findByIdAndUpdate (bypasses the pre-save hook).
 */
function buildCanonicalUrl(slug: string): string {
  if (!slug) return "";
  const base = config.canonicalBaseUrl;
  return base ? `${base}/${slug}` : slug;
}

async function processBase64CoverImage(
  coverImage?: string | null,
  opts?: { postId?: string; slug?: string | null; title?: string | null },
): Promise<string | null> {
  if (!coverImage || typeof coverImage !== "string" || coverImage.trim() === "") {
    return null;
  }

  const match = coverImage.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return coverImage;
  }

  const mimetype = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  const ext = mimetype.split("/")[1]?.replace("+xml", "") || "png";
  const filename = buildCoverFilename({
    slug: opts?.slug,
    title: opts?.title,
    postId: opts?.postId,
    ext: ext === "svg+xml" ? "svg" : ext,
  });

  logger.debug(`Intercepted base64 cover image for post [${opts?.postId || "new"}] as ${filename}. Uploading...`);

  const url = await uploadToGCS(buffer, filename, mimetype, true);
  return url;
}

/**
 * Scans markdown content for base64 data URLs and uploads them to GCS/Firebase Storage
 */
async function processBase64MarkdownImages(
  contentMarkdown?: string,
  opts?: { postId?: string; slug?: string | null; title?: string | null },
): Promise<string | undefined> {
  if (!contentMarkdown || typeof contentMarkdown !== "string") {
    return contentMarkdown;
  }

  const base64Regex = /data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)/g;

  let match;
  let newContent = contentMarkdown;
  let index = 1;

  const matches: Array<{ fullMatch: string; mime: string; base64: string }> = [];

  base64Regex.lastIndex = 0;
  while ((match = base64Regex.exec(contentMarkdown)) !== null) {
    matches.push({
      fullMatch: match[0],
      mime: `image/${match[1]}`,
      base64: match[2],
    });
  }

  if (matches.length === 0) {
    return contentMarkdown;
  }

  logger.debug(`Found ${matches.length} inline base64 images in post markdown. Processing uploads...`);

  for (const item of matches) {
    try {
      const buffer = Buffer.from(item.base64.trim(), "base64");
      const rawExt = item.mime.split("/")[1] || "png";
      const ext = rawExt.replace("+xml", "") === "svg" ? "svg" : rawExt.replace("+xml", "");
      const filename = buildInlineImageFilename({
        slug: opts?.slug,
        title: opts?.title,
        postId: opts?.postId,
        index: index++,
        ext,
      });

      const url = await uploadToGCS(buffer, filename, item.mime, true);
      newContent = newContent.replace(item.fullMatch, url);
    } catch (err) {
      logger.error("Failed to upload inline markdown base64 image", err as Error);
    }
  }

  return newContent;
}

/**
 * Create a new post
 * canonical_url is set from slug in Post model pre-save hook.
 */
export async function createPost(input: CreatePostInput) {
  const {
    title,
    content_markdown,
    status = POST_STATUS.DRAFT,
    tags,
    cover_image,
    canonical_url,
    meta_description,
    linkedin_post,
    linkedin_read_more_url,
    scheduled_for,
    author,
  } = input;

  if (!title || !content_markdown) {
    throw new Error(`${VALIDATION_ERRORS.TITLE_REQUIRED} and ${VALIDATION_ERRORS.CONTENT_REQUIRED}`);
  }

  const processedCoverImage = await processBase64CoverImage(cover_image, { title });
  const markdownBody = ensureMarkdownContent(content_markdown);
  const processedContentMarkdown = await processBase64MarkdownImages(markdownBody, { title });

  const postPayload: Record<string, unknown> = {
    title,
    content_markdown: processedContentMarkdown,
    status: status as PostStatus,
    tags: tags || [],
    cover_image: processedCoverImage as any,
    canonical_url,
    meta_description: meta_description?.trim() || null,
    linkedin_post: typeof linkedin_post === "string" ? linkedin_post : "",
    linkedin_read_more_url: typeof linkedin_read_more_url === "string" ? linkedin_read_more_url.trim() : "",
    author,
  };

  if (scheduled_for !== undefined) {
    postPayload.scheduled_for = normalizeScheduledFor(scheduled_for, {
      currentStatus: status as string,
    });
  }

  const created = await Post.create(postPayload);

  const post = await Post.findById(created._id).populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC);

  cache.invalidatePattern(cacheKeys.posts.all());

  return post;
}

// Imported from central types

/**
 * Get posts with pagination and caching
 */
export async function getPosts({ page = 1, limit = 20, userId }: GetPostsParams = {}) {
  const safePage = Math.max(parseInt(String(page), 10) || DEFAULT_VALUES.DEFAULT_PAGE, DEFAULT_VALUES.DEFAULT_PAGE);
  const safeLimit = Math.min(
    Math.max(parseInt(String(limit), 10) || DEFAULT_VALUES.DEFAULT_PAGE_SIZE, 1),
    DEFAULT_VALUES.MAX_PAGE_SIZE,
  );

  const cacheKey = cacheKeys.posts.list(userId || DEFAULT_VALUES.CACHE_KEY_PUBLIC, safePage, safeLimit);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const skip = (safePage - 1) * safeLimit;
  const query = userId ? { author: userId } : { status: POST_STATUS.PUBLISHED };

  const [items, total] = await Promise.all([
    Post.find(query)
      .select(FIELDS.POST_FIELDS.LIST_SELECT)
      .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments(query),
  ]);

  const hydratedItems = items.map((p) => hydrateLeanPost(p as unknown as LeanPost));

  const result = {
    data: hydratedItems,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };

  cache.set(cacheKey, result, DEFAULT_VALUES.CACHE_TTL_POSTS_LIST_MS);

  return result;
}

type PopulatedAuthor = { _id: { toString(): string }; name?: string; email?: string };
type LeanPost = {
  _id?: unknown;
  status?: string;
  author?: PopulatedAuthor;
  createdAt?: Date;
  updatedAt?: Date;
  platform_status?: Record<string, { published: boolean }>;
} & Record<string, unknown>;

function convertToFirebaseStorageUrl(url?: unknown): any {
  if (!url || typeof url !== "string") return url;

  const match = url.match(/^https:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/);
  if (!match) return url;

  const bucketName = match[1];
  const filePath = match[2];

  if (bucketName.endsWith("firebasestorage.app") || bucketName.endsWith("appspot.com")) {
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
  }
  return url;
}

/**
 * Hydrates Mongoose lean() documents with fields normally provided by Schema virtuals.
 * This restores client compatibility while maintaining lean() speed advantages.
 */
function hydrateLeanPost(post: LeanPost): LeanPost {
  if (!post) return post;

  // Restore virtual dates
  post.created_at = post.createdAt;
  post.updated_at = post.updatedAt;

  // Calculate `is_published_anywhere` locally since .lean() removed the virtual
  let isPublishedAnywhere = false;
  if (post.platform_status) {
    isPublishedAnywhere = Object.values(post.platform_status).some((p) => p.published);
  }
  post.is_published_anywhere = isPublishedAnywhere;

  // Dynamically map legacy GCS URLs to Firebase Storage public URL format
  if (post.cover_image && typeof post.cover_image === "string") {
    post.cover_image = convertToFirebaseStorageUrl(post.cover_image);
  }
  if (post.content_markdown && typeof post.content_markdown === "string") {
    post.content_markdown = post.content_markdown.replace(
      /https:\/\/storage\.googleapis\.com\/([^/]+)\/([^)\s"]+)/g,
      (match, bucketName, filePath) => {
        if (bucketName.endsWith("firebasestorage.app") || bucketName.endsWith("appspot.com")) {
          return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
        }
        return match;
      },
    );
  }

  return post;
}

/**
 * Get post by ID with caching
 */
export async function getPostById(id: string, userId?: string) {
  const cacheKey = cacheKeys.posts.single(id);
  const cached = cache.get(cacheKey) as LeanPost | undefined;

  if (cached) {
    if (cached.status !== POST_STATUS.PUBLISHED && (!userId || cached.author?._id.toString() !== userId)) {
      throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
    }
    return cached;
  }

  const post = (await Post.findById(id)
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean()) as LeanPost | null;

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  if (post.status !== POST_STATUS.PUBLISHED && (!userId || post.author?._id.toString() !== userId)) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
  }

  const hydratedPost = hydrateLeanPost(post);
  cache.set(cacheKey, hydratedPost, DEFAULT_VALUES.CACHE_TTL_DEFAULT_MS);

  return hydratedPost;
}

/**
 * Get post by slug with caching
 */
export async function getPostBySlug(slug: string, userId?: string) {
  const cacheKey = cacheKeys.posts.slug(slug);
  const cached = cache.get(cacheKey) as LeanPost | undefined;

  if (cached) {
    if (cached.status !== POST_STATUS.PUBLISHED && (!userId || cached.author?._id.toString() !== userId)) {
      throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
    }
    return cached;
  }

  const post = (await Post.findOne({ slug })
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean()) as LeanPost | null;

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  if (post.status !== POST_STATUS.PUBLISHED && (!userId || post.author?._id.toString() !== userId)) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
  }

  const hydratedPost = hydrateLeanPost(post);
  cache.set(cacheKey, hydratedPost, DEFAULT_VALUES.CACHE_TTL_DEFAULT_MS);

  return hydratedPost;
}

/**
 * Update post
 */
export async function updatePost(id: string, updates: Record<string, unknown>, userId: string) {
  const post = await Post.findById(id);

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  if (post.author.toString() !== userId) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
  }

  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.content_markdown !== undefined) updateData.content_markdown = updates.content_markdown;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.cover_image !== undefined) updateData.cover_image = updates.cover_image;
  if (updates.meta_description !== undefined) {
    updateData.meta_description =
      typeof updates.meta_description === "string" ? updates.meta_description.trim() : updates.meta_description;
  }
  if (updates.linkedin_post !== undefined) {
    updateData.linkedin_post = typeof updates.linkedin_post === "string" ? updates.linkedin_post : "";
  }
  if (updates.linkedin_read_more_url !== undefined) {
    updateData.linkedin_read_more_url =
      typeof updates.linkedin_read_more_url === "string" ? updates.linkedin_read_more_url.trim() : "";
  }
  if (updates.scheduled_for !== undefined) {
    updateData.scheduled_for = normalizeScheduledFor(updates.scheduled_for, {
      currentStatus: (updates.status as string) || post.status,
    });
  }

  // Explicitly check for slug update to keep canonical URL aligned
  if (updates.slug !== undefined) {
    updateData.slug = updates.slug;
  }
  const activeSlug = (updateData.slug as string) || post.slug || "";

  if (
    updates.canonical_url !== undefined &&
    typeof updates.canonical_url === "string" &&
    updates.canonical_url.trim() !== ""
  ) {
    updateData.canonical_url = updates.canonical_url.trim();
  } else {
    updateData.canonical_url = buildCanonicalUrl(activeSlug);
  }

  // Intercept and upload base64 images to GCS/Firebase Storage
  const mediaOpts = {
    postId: id,
    slug: activeSlug,
    title: (updateData.title as string) || post.title,
  };
  if (updateData.cover_image && typeof updateData.cover_image === "string") {
    updateData.cover_image = await processBase64CoverImage(updateData.cover_image, mediaOpts);
  }
  if (updateData.content_markdown && typeof updateData.content_markdown === "string") {
    updateData.content_markdown = await processBase64MarkdownImages(
      ensureMarkdownContent(updateData.content_markdown),
      mediaOpts,
    );
  }

  const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean();

  cache.delete(cacheKeys.posts.single(id));
  cache.delete(cacheKeys.posts.slug(post.slug || ""));
  cache.invalidatePattern(cacheKeys.posts.all());

  return updatedPost;
}

/**
 * Delete post
 */
export async function deletePost(id: string, userId: string) {
  const post = await Post.findById(id);

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  if (post.author.toString() !== userId) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
  }

  await Post.findByIdAndDelete(id);

  cache.delete(cacheKeys.posts.single(id));
  cache.delete(cacheKeys.posts.slug(post.slug || ""));
  cache.invalidatePattern(cacheKeys.posts.all());
}
