import dayjs from "dayjs";
import { config } from "../config";
import { DEFAULT_VALUES, ERROR_MESSAGES, FIELDS, POST_STATUS, VALIDATION_ERRORS, type PostStatus } from "../constants";
import { ForbiddenError, NotFoundError } from "../middleware/errorHandler";
import Post from "../models/Post";
import { cache, cacheKeys } from "../utils/cache";
import { logger } from "../utils/logger";
import { performPublishToAll } from "./publishService";
import { uploadToGCS } from "./storage";

/** Build canonical URL from slug (server config). Used when update uses findByIdAndUpdate (no save hook). */
function buildCanonicalUrl(slug: string): string {
  const base = config.canonicalBaseUrl;
  if (!base || !slug) return "";
  return `${base}/${slug}`;
}

/**
 * Detects base64 data URLs in cover image and uploads them to GCS/Firebase Storage
 */
async function processBase64CoverImage(coverImage?: string, postId?: string): Promise<string | undefined> {
  if (!coverImage || typeof coverImage !== "string") {
    return coverImage;
  }

  const match = coverImage.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return coverImage;
  }

  const mimetype = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  const idSegment = postId || `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = mimetype.split("/")[1] || "png";
  const filename = `cover-${idSegment}.${ext}`;

  logger.debug(`Intercepted base64 cover image for post [${postId || "new"}]. Uploading to GCS/Firebase Storage...`);
  
  const url = await uploadToGCS(buffer, filename, mimetype, true);
  return url;
}

/**
 * Scans markdown content for base64 data URLs and uploads them to GCS/Firebase Storage
 */
async function processBase64MarkdownImages(contentMarkdown?: string, postId?: string): Promise<string | undefined> {
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
      const idSegment = postId || `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = item.mime.split("/")[1] || "png";
      const filename = `inline-${idSegment}-${index++}.${ext}`;
      
      const url = await uploadToGCS(buffer, filename, item.mime, true);
      newContent = newContent.replace(item.fullMatch, url);
    } catch (err) {
      logger.error("Failed to upload inline markdown base64 image", err as Error);
    }
  }

  return newContent;
}

interface CreatePostInput {
  title?: string;
  content_markdown?: string;
  status?: string;
  tags?: string[];
  cover_image?: string;
  author?: string;
}

/**
 * Create a new post
 * canonical_url is set from slug in Post model pre-save hook.
 */
export async function createPost(input: CreatePostInput) {
  const { title, content_markdown, status = POST_STATUS.DRAFT, tags, cover_image, author } = input;

  if (!title || !content_markdown) {
    throw new Error(`${VALIDATION_ERRORS.TITLE_REQUIRED} and ${VALIDATION_ERRORS.CONTENT_REQUIRED}`);
  }

  const processedCoverImage = await processBase64CoverImage(cover_image);
  const processedContentMarkdown = await processBase64MarkdownImages(content_markdown);

  const created = await Post.create({
    title,
    content_markdown: processedContentMarkdown,
    status: status as PostStatus,
    tags: tags || [],
    cover_image: processedCoverImage,
    author,
  });

  const post = await Post.findById(created._id).populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC);

  cache.invalidatePattern(cacheKeys.posts.all());

  return post;
}

interface GetPostsParams {
  page?: number | string;
  limit?: number | string;
  userId?: string;
}

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
      }
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
  FIELDS.POST_FIELDS.UPDATABLE_FIELDS.forEach((k) => {
    if (updates[k] !== undefined) updateData[k] = updates[k];
  });
  updateData.canonical_url = buildCanonicalUrl(post.slug || "");

  // Intercept and upload base64 images to GCS/Firebase Storage
  if (updateData.cover_image && typeof updateData.cover_image === "string") {
    updateData.cover_image = await processBase64CoverImage(updateData.cover_image, id);
  }
  if (updateData.content_markdown && typeof updateData.content_markdown === "string") {
    updateData.content_markdown = await processBase64MarkdownImages(updateData.content_markdown, id);
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

/**
 * Find posts scheduled for now or earlier and publish them.
 * This is triggered by the automated Cron job.
 */
export async function publishScheduledPosts() {
  const now = dayjs().toDate();
  const scheduledPosts = await Post.find({
    status: POST_STATUS.DRAFT,
    scheduled_for: { $lte: now },
  });

  if (scheduledPosts.length === 0) {
    return { count: 0, results: [] };
  }

  const results = await Promise.all(
    scheduledPosts.map(async (post) => {
      try {
        const result = await performPublishToAll(post);
        return {
          postId: post._id,
          success: result.success,
          successes: result.successes,
          errors: result.errors,
        };
      } catch (error) {
        logger.error(`Scheduled publish failed for post ${post._id}`, error as Error);
        return {
          postId: post._id,
          success: false,
          error: (error as Error).message,
        };
      }
    }),
  );

  cache.invalidatePattern(cacheKeys.posts.all());
  return {
    count: scheduledPosts.length,
    results,
  };
}
