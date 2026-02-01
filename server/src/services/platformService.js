const Post = require("../models/Post");
const { NotFoundError } = require("../middleware/errorHandler");
const { ERROR_MESSAGES, FIELDS } = require("../constants");

/**
 * Unpublish/remove post from a specific platform
 */
async function unpublishFromPlatform(postId, platformName) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  // Clear the platform status
  const updateData = {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(platformName)]: false,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(platformName)]: null,
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(platformName)]: null,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(platformName)]: null,
  };

  const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true })
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean();

  return updatedPost;
}

/**
 * Get post publishing status for a specific platform
 */
async function getPlatformStatus(postId, platformName) {
  const post = await Post.findById(postId).select(FIELDS.POST_FIELDS.PLATFORM_STATUS_PREFIX).lean();

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
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
