const Post = require("../models/Post");
const { NotFoundError } = require("../middleware/errorHandler");

/**
 * Unpublish/remove post from a specific platform
 */
async function unpublishFromPlatform(postId, platformName) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  // Clear the platform status
  const updateData = {
    [`platform_status.${platformName}.published`]: false,
    [`platform_status.${platformName}.post_id`]: null,
    [`platform_status.${platformName}.url`]: null,
    [`platform_status.${platformName}.published_at`]: null,
  };

  const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true })
    .populate("author", "username firstName lastName")
    .lean();

  return updatedPost;
}

/**
 * Get post publishing status for a specific platform
 */
async function getPlatformStatus(postId, platformName) {
  const post = await Post.findById(postId).select("platform_status").lean();

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  return {
    platform: platformName,
    status: post.platform_status?.[platformName] || {
      published: false,
      post_id: null,
      url: null,
      published_at: null,
    },
  };
}

module.exports = {
  unpublishFromPlatform,
  getPlatformStatus,
};
