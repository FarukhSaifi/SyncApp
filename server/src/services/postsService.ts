import { config } from "@config";
import {
  AI_CONFIG,
  DEFAULT_VALUES,
  ERROR_MESSAGES,
  FIELDS,
  POST_LIST_FILTER,
  POST_STATUS,
  REGEX_PATTERNS,
  VALIDATION_ERRORS,
  VALID_POST_STATUS,
  buildFirebaseStoragePublicUrl,
  type PostStatus,
} from "@constants";
import { ForbiddenError, NotFoundError } from "@middleware/errorHandler";
import Post from "@models/Post";
import type { CreatePostInput, GetPostsParams, GetPostsResult, LeanPost, PostListStats } from "@types";
import { cache, cacheKeys } from "@utils/cache";
import { ensureMarkdownContent } from "@utils/contentMarkdown";
import {
  assertAllowedUploadImageMime,
  assertStandaloneImageSize,
  extensionForUploadImageMime,
} from "@utils/imageUpload";
import { logger } from "@utils/logger";
import { buildCoverFilename, buildInlineImageFilename } from "@utils/mediaFilename";
import { normalizeScheduledFor, normalizeScheduledPlatforms } from "@utils/scheduleUtils";

import { buildPersistedSeoFields } from "./seoScoreService";
import { uploadToGCS } from "./storage";

function normalizeSeoPlatforms(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((p): p is string => typeof p === "string")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

function resolveSeoContext(input: {
  seo_primary_keyword?: unknown;
  seo_optimization_targets?: unknown;
  fallbackKeyword?: string;
  fallbackPlatforms?: string[];
}): { primaryKeyword: string; platforms: string[] } {
  const primaryKeyword =
    typeof input.seo_primary_keyword === "string" && input.seo_primary_keyword.trim()
      ? input.seo_primary_keyword.trim()
      : (input.fallbackKeyword || "").trim();
  const fromInput = normalizeSeoPlatforms(input.seo_optimization_targets);
  const platforms = fromInput.length > 0 ? fromInput : normalizeSeoPlatforms(input.fallbackPlatforms);
  return { primaryKeyword, platforms };
}

function isFirebaseGcsBucket(bucketName: string): boolean {
  return (
    bucketName.endsWith(AI_CONFIG["GCS_BUCKET_SUFFIX"]) ||
    bucketName.endsWith(DEFAULT_VALUES["GCS_APPS_POT_BUCKET_SUFFIX"])
  );
}

/**
 * Build canonical URL from slug.
 * - If CANONICAL_BASE_URL is set: returns `<base>/<slug>`
 * - Otherwise falls back to just the slug (so the field is never left blank)
 * Used when update uses findByIdAndUpdate (bypasses the pre-save hook).
 */
function buildCanonicalUrl(slug: string): string {
  if (!slug) {
    return "";
  }
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

  const match = coverImage.match(REGEX_PATTERNS["DATA_URL_BASE64"]);
  if (!match) {
    return coverImage;
  }

  const mimetype = assertAllowedUploadImageMime(match[1]);
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  assertStandaloneImageSize(buffer.byteLength);

  const filename = buildCoverFilename({
    slug: opts?.slug,
    title: opts?.title,
    postId: opts?.postId,
    ext: extensionForUploadImageMime(mimetype),
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

  // Clone /g regex — shared RegExp lastIndex is not request-safe.
  const base64Regex = new RegExp(
    REGEX_PATTERNS["MARKDOWN_IMAGE_DATA_URL"].source,
    REGEX_PATTERNS["MARKDOWN_IMAGE_DATA_URL"].flags,
  );

  let match;
  let newContent = contentMarkdown;
  let index = 1;

  const matches: Array<{ fullMatch: string; mime: string; base64: string }> = [];

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
      const mimetype = assertAllowedUploadImageMime(item.mime);
      const buffer = Buffer.from(item.base64.trim(), "base64");
      assertStandaloneImageSize(buffer.byteLength);
      const filename = buildInlineImageFilename({
        slug: opts?.slug,
        title: opts?.title,
        postId: opts?.postId,
        index: index++,
        ext: extensionForUploadImageMime(mimetype),
      });

      const url = await uploadToGCS(buffer, filename, mimetype, true);
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
    status = POST_STATUS["DRAFT"],
    tags,
    cover_image,
    canonical_url,
    meta_description,
    linkedin_post,
    linkedin_read_more_url,
    scheduled_for,
    scheduled_platforms,
    author,
    seo_primary_keyword,
    seo_optimization_targets,
  } = input;

  if (!title || !content_markdown) {
    throw new Error(`${VALIDATION_ERRORS["TITLE_REQUIRED"]} and ${VALIDATION_ERRORS["CONTENT_REQUIRED"]}`);
  }

  const processedCoverImage = await processBase64CoverImage(cover_image, { title });
  const markdownBody = ensureMarkdownContent(content_markdown);
  const processedContentMarkdown = await processBase64MarkdownImages(markdownBody, { title });

  const seoContext = resolveSeoContext({
    seo_primary_keyword,
    seo_optimization_targets,
  });
  const seoFields = buildPersistedSeoFields(
    {
      title,
      content_markdown: processedContentMarkdown,
      meta_description: meta_description?.trim() || null,
      cover_image: processedCoverImage,
      canonical_url,
      tags: tags || [],
    },
    seoContext,
  );

  const postPayload: Record<string, unknown> = {
    title,
    content_markdown: processedContentMarkdown,
    status: status as PostStatus,
    tags: tags || [],
    cover_image: processedCoverImage,
    canonical_url,
    meta_description: meta_description?.trim() || null,
    linkedin_post: typeof linkedin_post === "string" ? linkedin_post : "",
    linkedin_read_more_url: typeof linkedin_read_more_url === "string" ? linkedin_read_more_url.trim() : "",
    author,
    ...seoFields,
  };

  if (scheduled_for !== undefined) {
    const normalizedSchedule = normalizeScheduledFor(scheduled_for, {
      currentStatus: status as string,
    });
    postPayload.scheduled_for = normalizedSchedule;
    if (scheduled_platforms !== undefined || normalizedSchedule) {
      postPayload.scheduled_platforms = normalizeScheduledPlatforms(scheduled_platforms, {
        scheduledFor: normalizedSchedule,
      });
    }
  } else if (scheduled_platforms !== undefined) {
    postPayload.scheduled_platforms = normalizeScheduledPlatforms(scheduled_platforms, {
      scheduledFor: null,
    });
  }

  const created = await Post.create(postPayload);

  const post = await Post.findById(created._id).populate(
    FIELDS["COMMON_FIELDS"]["AUTHOR"],
    FIELDS["USER_FIELDS"]["SELECT_PUBLIC"],
  );

  cache.invalidatePattern(cacheKeys.posts.all());

  return post;
}

const EMPTY_POST_LIST_STATS: PostListStats = Object.freeze({
  total: 0,
  published: 0,
  drafts: 0,
  scheduled: 0,
  withPlatforms: 0,
});

/** Unfiltered dashboard chip counts (independent of list page/status/search). */
async function getPostListStats(userId?: string): Promise<PostListStats> {
  if (!userId) {
    return { ...EMPTY_POST_LIST_STATS };
  }

  const cacheKey = cacheKeys.posts.stats(userId);
  const cached = cache.get(cacheKey) as PostListStats | undefined;
  if (cached) {
    return cached;
  }

  const base = { author: userId };
  const now = new Date();
  const [total, published, drafts, scheduled, withPlatforms] = await Promise.all([
    Post.countDocuments(base),
    Post.countDocuments({ ...base, status: POST_STATUS.PUBLISHED }),
    Post.countDocuments({ ...base, status: POST_STATUS.DRAFT }),
    Post.countDocuments({
      ...base,
      status: POST_STATUS.DRAFT,
      scheduled_for: { $gt: now },
    }),
    Post.countDocuments({
      ...base,
      $or: [
        { "platform_status.medium.published": true },
        { "platform_status.devto.published": true },
        { "platform_status.wordpress.published": true },
        { "platform_status.linkedin.published": true },
      ],
    }),
  ]);

  const stats: PostListStats = { total, published, drafts, scheduled, withPlatforms };
  cache.set(cacheKey, stats, DEFAULT_VALUES["CACHE_TTL_POSTS_LIST_MS"]);
  return stats;
}

/**
 * Get posts with pagination and caching
 */
export async function getPosts({
  page = DEFAULT_VALUES.DEFAULT_PAGE,
  limit = DEFAULT_VALUES.DEFAULT_PAGE_SIZE,
  status,
  search,
  userId,
}: GetPostsParams = {}): Promise<GetPostsResult> {
  const safePage = Math.max(
    parseInt(String(page), 10) || DEFAULT_VALUES["DEFAULT_PAGE"],
    DEFAULT_VALUES["DEFAULT_PAGE"],
  );
  const safeLimit = Math.min(
    Math.max(parseInt(String(limit), 10) || DEFAULT_VALUES["DEFAULT_PAGE_SIZE"], 1),
    DEFAULT_VALUES["MAX_PAGE_SIZE"],
  );
  const statusFilter = typeof status === "string" ? status.trim().toLowerCase() : "";
  const searchFilter = typeof search === "string" ? search.trim() : "";
  const filterKey = `${statusFilter || POST_LIST_FILTER.ALL}:${searchFilter.toLowerCase()}`;

  const cacheKey = cacheKeys.posts.list(userId || DEFAULT_VALUES["CACHE_KEY_PUBLIC"], safePage, safeLimit, filterKey);
  const cached = cache.get(cacheKey) as (Omit<GetPostsResult, "stats"> & { stats?: PostListStats }) | undefined;
  if (cached) {
    const stats = cached.stats ?? (await getPostListStats(userId));
    return { data: cached.data, pagination: cached.pagination, stats };
  }

  const skip = (safePage - 1) * safeLimit;
  const query: Record<string, unknown> = userId ? { author: userId } : { status: POST_STATUS["PUBLISHED"] };

  if (userId && statusFilter && statusFilter !== POST_LIST_FILTER.ALL) {
    if (statusFilter === POST_LIST_FILTER.SCHEDULED) {
      query.status = POST_STATUS.DRAFT;
      query.scheduled_for = { $gt: new Date() };
    } else if ((VALID_POST_STATUS as readonly string[]).includes(statusFilter)) {
      query.status = statusFilter;
    }
  }

  if (searchFilter) {
    const escapedSearch = searchFilter.replace(REGEX_PATTERNS.REGEX_SPECIAL_CHARS, "\\$&");
    const searchRegex = { $regex: escapedSearch, $options: "i" };
    query.$or = [
      { title: searchRegex },
      { tags: searchRegex },
      { slug: searchRegex },
      { meta_description: searchRegex },
    ];
  }

  const [items, total, stats] = await Promise.all([
    Post.find(query)
      .select(FIELDS["POST_FIELDS"]["LIST_SELECT"])
      .populate(FIELDS["COMMON_FIELDS"]["AUTHOR"], FIELDS["USER_FIELDS"]["SELECT_PUBLIC"])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments(query),
    getPostListStats(userId),
  ]);

  const hydratedItems = items.map((p) => hydrateLeanPost(p as unknown as LeanPost));

  const result: GetPostsResult = {
    data: hydratedItems,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
    stats,
  };

  cache.set(cacheKey, result, DEFAULT_VALUES["CACHE_TTL_POSTS_LIST_MS"]);

  return result;
}

function convertToFirebaseStorageUrl(url: string): string {
  const match = url.match(REGEX_PATTERNS["GCS_PUBLIC_OBJECT_URL"]);
  if (!match) {
    return url;
  }

  const bucketName = match[1];
  const filePath = match[2];

  if (isFirebaseGcsBucket(bucketName)) {
    return buildFirebaseStoragePublicUrl(bucketName, filePath);
  }
  return url;
}

/**
 * Hydrates Mongoose lean() documents with fields normally provided by Schema virtuals.
 * This restores client compatibility while maintaining lean() speed advantages.
 */
function hydrateLeanPost(post: LeanPost): LeanPost {
  if (!post) {
    return post;
  }

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
    const gcsInMarkdown = new RegExp(
      REGEX_PATTERNS["GCS_PUBLIC_URL_IN_MARKDOWN"].source,
      REGEX_PATTERNS["GCS_PUBLIC_URL_IN_MARKDOWN"].flags,
    );
    post.content_markdown = post.content_markdown.replace(
      gcsInMarkdown,
      (match, bucketName: string, filePath: string) => {
        if (isFirebaseGcsBucket(bucketName)) {
          return buildFirebaseStoragePublicUrl(bucketName, filePath);
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
    if (cached.status !== POST_STATUS["PUBLISHED"] && (!userId || cached.author?._id.toString() !== userId)) {
      throw new ForbiddenError(ERROR_MESSAGES["ACCESS_DENIED_POST"]);
    }
    return cached;
  }

  const post = (await Post.findById(id)
    .populate(FIELDS["COMMON_FIELDS"]["AUTHOR"], FIELDS["USER_FIELDS"]["SELECT_PUBLIC"])
    .lean()) as LeanPost | null;

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES["POST_NOT_FOUND"]);
  }

  if (post.status !== POST_STATUS["PUBLISHED"] && (!userId || post.author?._id.toString() !== userId)) {
    throw new ForbiddenError(ERROR_MESSAGES["ACCESS_DENIED_POST"]);
  }

  const hydratedPost = hydrateLeanPost(post);
  cache.set(cacheKey, hydratedPost, DEFAULT_VALUES["CACHE_TTL_DEFAULT_MS"]);

  return hydratedPost;
}

/**
 * Get post by slug with caching
 */
export async function getPostBySlug(slug: string, userId?: string) {
  const cacheKey = cacheKeys.posts.slug(slug);
  const cached = cache.get(cacheKey) as LeanPost | undefined;

  if (cached) {
    if (cached.status !== POST_STATUS["PUBLISHED"] && (!userId || cached.author?._id.toString() !== userId)) {
      throw new ForbiddenError(ERROR_MESSAGES["ACCESS_DENIED_POST"]);
    }
    return cached;
  }

  const post = (await Post.findOne({ slug })
    .populate(FIELDS["COMMON_FIELDS"]["AUTHOR"], FIELDS["USER_FIELDS"]["SELECT_PUBLIC"])
    .lean()) as LeanPost | null;

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES["POST_NOT_FOUND"]);
  }

  if (post.status !== POST_STATUS["PUBLISHED"] && (!userId || post.author?._id.toString() !== userId)) {
    throw new ForbiddenError(ERROR_MESSAGES["ACCESS_DENIED_POST"]);
  }

  const hydratedPost = hydrateLeanPost(post);
  cache.set(cacheKey, hydratedPost, DEFAULT_VALUES["CACHE_TTL_DEFAULT_MS"]);

  return hydratedPost;
}

/**
 * Update post
 */
export async function updatePost(id: string, updates: Record<string, unknown>, userId: string) {
  const post = await Post.findById(id);

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES["POST_NOT_FOUND"]);
  }

  if (post.author.toString() !== userId) {
    throw new ForbiddenError(ERROR_MESSAGES["ACCESS_DENIED_POST"]);
  }

  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  if (updates.content_markdown !== undefined) {
    updateData.content_markdown = updates.content_markdown;
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }
  if (updates.tags !== undefined) {
    updateData.tags = updates.tags;
  }
  if (updates.cover_image !== undefined) {
    updateData.cover_image = updates.cover_image;
  }
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
    const normalizedSchedule = normalizeScheduledFor(updates.scheduled_for, {
      currentStatus: (updates.status as string) || post.status,
    });
    updateData.scheduled_for = normalizedSchedule;
    if (updates.scheduled_platforms !== undefined || normalizedSchedule !== null) {
      updateData.scheduled_platforms = normalizeScheduledPlatforms(
        updates.scheduled_platforms !== undefined ? updates.scheduled_platforms : post.scheduled_platforms,
        { scheduledFor: normalizedSchedule },
      );
    }
    if (normalizedSchedule === null) {
      updateData.scheduled_platforms = [];
    }
  } else if (updates.scheduled_platforms !== undefined) {
    const existingSchedule = post.scheduled_for ? new Date(post.scheduled_for) : null;
    updateData.scheduled_platforms = normalizeScheduledPlatforms(updates.scheduled_platforms, {
      scheduledFor: existingSchedule,
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

  const seoContext = resolveSeoContext({
    seo_primary_keyword: updates.seo_primary_keyword,
    seo_optimization_targets: updates.seo_optimization_targets,
    fallbackKeyword: typeof post.seo_primary_keyword === "string" ? post.seo_primary_keyword : "",
    fallbackPlatforms: Array.isArray(post.seo_optimization_targets) ? post.seo_optimization_targets : [],
  });
  const seoFields = buildPersistedSeoFields(
    {
      title: (updateData.title as string) || post.title,
      content_markdown:
        typeof updateData.content_markdown === "string" ? updateData.content_markdown : post.content_markdown,
      meta_description:
        updateData.meta_description !== undefined
          ? (updateData.meta_description as string | null)
          : post.meta_description,
      cover_image: typeof updateData.cover_image === "string" ? updateData.cover_image : post.cover_image,
      canonical_url: typeof updateData.canonical_url === "string" ? updateData.canonical_url : post.canonical_url,
      slug: activeSlug,
      tags: Array.isArray(updateData.tags) ? (updateData.tags as string[]) : post.tags || [],
    },
    seoContext,
  );
  Object.assign(updateData, seoFields);

  const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate(FIELDS["COMMON_FIELDS"]["AUTHOR"], FIELDS["USER_FIELDS"]["SELECT_PUBLIC"])
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
    throw new NotFoundError(ERROR_MESSAGES["POST_NOT_FOUND"]);
  }

  if (post.author.toString() !== userId) {
    throw new ForbiddenError(ERROR_MESSAGES["ACCESS_DENIED_POST"]);
  }

  await Post.findByIdAndDelete(id);

  cache.delete(cacheKeys.posts.single(id));
  cache.delete(cacheKeys.posts.slug(post.slug || ""));
  cache.invalidatePattern(cacheKeys.posts.all());
}
