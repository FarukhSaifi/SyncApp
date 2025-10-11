const Post = require("../models/Post");
const { cache, cacheKeys } = require("../utils/cache");
const { NotFoundError, ForbiddenError } = require("../middleware/errorHandler");

/**
 * Create a new post
 */
async function createPost(input) {
  const { title, content_markdown, status = "draft", tags, cover_image, canonical_url, author } = input;
  
  if (!title || !content_markdown) {
    throw new Error("Title and content are required");
  }

  const created = await Post.create({
    title,
    content_markdown,
    status,
    tags: tags || [],
    cover_image,
    canonical_url,
    author,
  });

  const post = await Post.findById(created._id).populate("author", "username firstName lastName");

  // Invalidate cache
  cache.invalidatePattern(cacheKeys.posts.all());

  return post;
}

/**
 * Get posts with pagination and caching
 */
async function getPosts({ page = 1, limit = 20, userId }) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  
  // Try cache first
  const cacheKey = cacheKeys.posts.list(userId || "public", safePage, safeLimit);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const skip = (safePage - 1) * safeLimit;
  const query = userId ? { author: userId } : { status: "published" };

  // Optimized query with lean and specific field selection
  const [items, total] = await Promise.all([
    Post.find(query)
      .select("title slug status tags cover_image canonical_url createdAt updatedAt author platform_status")
      .populate("author", "username firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments(query),
  ]);

  const result = {
    data: items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };

  // Cache for 2 minutes
  cache.set(cacheKey, result, 120000);

  return result;
}

/**
 * Get post by ID with caching
 */
async function getPostById(id, userId) {
  // Try cache first
  const cacheKey = cacheKeys.posts.single(id);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    // Still need to check access
    if (cached.status !== "published" && (!userId || cached.author._id.toString() !== userId)) {
      throw new ForbiddenError("Access denied");
    }
    return cached;
  }

  const post = await Post.findById(id)
    .populate("author", "username firstName lastName")
    .lean();

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (post.status !== "published" && (!userId || post.author._id.toString() !== userId)) {
    throw new ForbiddenError("Access denied");
  }

  // Cache for 5 minutes
  cache.set(cacheKey, post, 300000);

  return post;
}

/**
 * Get post by slug with caching
 */
async function getPostBySlug(slug, userId) {
  // Try cache first
  const cacheKey = cacheKeys.posts.slug(slug);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    if (cached.status !== "published" && (!userId || cached.author._id.toString() !== userId)) {
      throw new ForbiddenError("Access denied");
    }
    return cached;
  }

  const post = await Post.findOne({ slug })
    .populate("author", "username firstName lastName")
    .lean();

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (post.status !== "published" && (!userId || post.author._id.toString() !== userId)) {
    throw new ForbiddenError("Access denied");
  }

  // Cache for 5 minutes
  cache.set(cacheKey, post, 300000);

  return post;
}

/**
 * Update post
 */
async function updatePost(id, updates, userId) {
  const post = await Post.findById(id);
  
  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (post.author.toString() !== userId) {
    throw new ForbiddenError("Access denied");
  }

  // Only allow specific fields to be updated
  const updateData = {};
  ["title", "content_markdown", "status", "tags", "cover_image", "canonical_url"].forEach((k) => {
    if (updates[k] !== undefined) updateData[k] = updates[k];
  });

  const updatedPost = await Post.findByIdAndUpdate(id, updateData, { 
    new: true, 
    runValidators: true 
  })
    .populate("author", "username firstName lastName")
    .lean();

  // Invalidate cache
  cache.delete(cacheKeys.posts.single(id));
  cache.delete(cacheKeys.posts.slug(post.slug));
  cache.invalidatePattern(cacheKeys.posts.all());

  return updatedPost;
}

/**
 * Delete post
 */
async function deletePost(id, userId) {
  const post = await Post.findById(id);
  
  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (post.author.toString() !== userId) {
    throw new ForbiddenError("Access denied");
  }

  await Post.findByIdAndDelete(id);

  // Invalidate cache
  cache.delete(cacheKeys.posts.single(id));
  cache.delete(cacheKeys.posts.slug(post.slug));
  cache.invalidatePattern(cacheKeys.posts.all());
}

module.exports = { 
  createPost, 
  getPosts, 
  getPostById, 
  getPostBySlug, 
  updatePost, 
  deletePost 
};
