const Post = require("../models/Post");

async function createPost(input) {
  const { title, content_markdown, status = "draft", tags, cover_image, canonical_url, author } = input;
  if (!title || !content_markdown) throw new Error("Title and content are required");

  const created = await Post.create({
    title,
    content_markdown,
    status,
    tags: tags || [],
    cover_image,
    canonical_url,
    author,
  });

  return Post.findById(created._id).populate("author", "username firstName lastName");
}

async function getPosts({ page = 1, limit = 20, userId }) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const query = userId ? { author: userId } : { status: "published" };

  const [items, total] = await Promise.all([
    Post.find(query)
      .select("title slug status tags cover_image canonical_url createdAt updatedAt author platform_status")
      .populate("author", "username firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean({ virtuals: false }),
    Post.countDocuments(query),
  ]);

  return {
    data: items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function getPostById(id, userId) {
  const post = await Post.findById(id).populate("author", "username firstName lastName").lean({ virtuals: false });
  if (!post) return null;
  if (post.status !== "published" && (!userId || post.author._id.toString() !== userId)) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }
  return post;
}

async function getPostBySlug(slug, userId) {
  const post = await Post.findOne({ slug }).populate("author", "username firstName lastName").lean({ virtuals: false });
  if (!post) return null;
  if (post.status !== "published" && (!userId || post.author._id.toString() !== userId)) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }
  return post;
}

async function updatePost(id, updates, userId) {
  const post = await Post.findById(id);
  if (!post) throw new Error("Post not found");
  if (post.author.toString() !== userId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  const updateData = {};
  ["title", "content_markdown", "status", "tags", "cover_image", "canonical_url"].forEach((k) => {
    if (updates[k] !== undefined) updateData[k] = updates[k];
  });

  const updated = await Post.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    .populate("author", "username firstName lastName")
    .lean({ virtuals: false });
  return updated;
}

async function deletePost(id, userId) {
  const post = await Post.findById(id);
  if (!post) throw new Error("Post not found");
  if (post.author.toString() !== userId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }
  await Post.findByIdAndDelete(id);
}

module.exports = { createPost, getPosts, getPostById, getPostBySlug, updatePost, deletePost };
