import Post from '../models/Post';
import { config } from '../config';
import { cache, cacheKeys } from '../utils/cache';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { DEFAULT_VALUES, ERROR_MESSAGES, POST_STATUS, FIELDS, VALIDATION_ERRORS } from '../constants';

/** Build canonical URL from slug (server config). Used when update uses findByIdAndUpdate (no save hook). */
function buildCanonicalUrl(slug: string): string {
  const base = config.canonicalBaseUrl;
  if (!base || !slug) return '';
  return `${base}/${slug}`;
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

  const created = await Post.create({
    title,
    content_markdown,
    status,
    tags: tags || [],
    cover_image,
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

  const hydratedItems = items.map(p => hydrateLeanPost(p as unknown as LeanPost));

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

type PopulatedAuthor = { _id: { toString(): string }, name?: string, email?: string };
type LeanPost = { 
  _id?: unknown;
  status?: string; 
  author?: PopulatedAuthor;
  createdAt?: Date;
  updatedAt?: Date;
  platform_status?: Record<string, { published: boolean }>;
} & Record<string, unknown>;

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
    isPublishedAnywhere = Object.values(post.platform_status).some(p => p.published);
  }
  post.is_published_anywhere = isPublishedAnywhere;
  
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

  const post = await Post.findById(id)
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean() as LeanPost | null;

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  if (post.status !== POST_STATUS.PUBLISHED && (!userId || post.author?._id.toString() !== userId)) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
  }

  const hydratedPost = hydrateLeanPost(post);
  cache.set(cacheKey, hydratedPost, 300000);

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

  const post = await Post.findOne({ slug })
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean() as LeanPost | null;

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  if (post.status !== POST_STATUS.PUBLISHED && (!userId || post.author?._id.toString() !== userId)) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
  }

  const hydratedPost = hydrateLeanPost(post);
  cache.set(cacheKey, hydratedPost, 300000);

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
  updateData.canonical_url = buildCanonicalUrl(post.slug || '');

  const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean();

  cache.delete(cacheKeys.posts.single(id));
  cache.delete(cacheKeys.posts.slug(post.slug || ''));
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
  cache.delete(cacheKeys.posts.slug(post.slug || ''));
  cache.invalidatePattern(cacheKeys.posts.all());
}
