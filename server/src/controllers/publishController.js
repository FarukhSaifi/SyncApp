const Post = require("../models/Post");
const Credential = require("../models/Credential");
const { publishToMedium, publishToDevto, publishToWordpress } = require("../services/publishService");
const { unpublishFromPlatform, getPlatformStatus } = require("../services/platformService");
const { asyncHandler, NotFoundError, ValidationError } = require("../middleware/errorHandler");

// Platform configuration
const PLATFORM_CONFIG = {
  medium: {
    name: "Medium",
    publishFn: publishToMedium,
    errorMessage: "Medium API credentials not found. Please configure your Medium API key in settings.",
  },
  devto: {
    name: "DEV.to",
    publishFn: publishToDevto,
    errorMessage: "DEV.to API credentials not found. Please configure your DEV.to API key in settings.",
  },
  wordpress: {
    name: "WordPress",
    publishFn: publishToWordpress,
    errorMessage: "WordPress API credentials not found. Please configure your WordPress API key in settings.",
  },
};

/**
 * Get and validate post
 */
async function ensurePost(postId) {
  if (!postId) {
    throw new ValidationError("Post ID is required");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError("Post not found");
  }

  return post;
}

/**
 * Get and validate credential for platform
 */
async function ensureCredential(platformName) {
  const credential = await Credential.findOne({ platform_name: platformName });

  if (!credential) {
    const config = PLATFORM_CONFIG[platformName];
    throw new ValidationError(config?.errorMessage || `${platformName} credentials not found`);
  }

  return credential;
}

/**
 * Generic publish handler for any platform
 */
function publishToPlatform(platformName) {
  return asyncHandler(async (req, res) => {
    const config = PLATFORM_CONFIG[platformName];
    if (!config) {
      throw new ValidationError(`Invalid platform: ${platformName}`);
    }

    const post = await ensurePost(req.body.postId);
    const credential = await ensureCredential(platformName);

    // Publish to platform
    const updates = await config.publishFn(post, credential);

    // Update post with platform status
    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { status: "published", ...updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Post published to ${config.name} successfully`,
      data: {
        postId: updatedPost._id,
        status: "published",
        platformStatus: updatedPost.platform_status?.[platformName],
      },
    });
  });
}

/**
 * Publish to Medium
 */
const publishMedium = publishToPlatform("medium");

/**
 * Publish to DEV.to
 */
const publishDevto = publishToPlatform("devto");

/**
 * Publish to WordPress
 */
const publishWordpress = publishToPlatform("wordpress");

/**
 * Publish to all active platforms
 */
const publishAll = asyncHandler(async (req, res) => {
  const post = await ensurePost(req.body.postId);
  const credentials = await Credential.find({ is_active: true });

  if (credentials.length === 0) {
    throw new ValidationError("No active platform credentials found. Please configure at least one platform.");
  }

  const results = {};
  const errors = [];
  const successes = [];

  // Publish to each platform
  await Promise.allSettled(
    credentials.map(async (credential) => {
      const platformName = credential.platform_name;
      const config = PLATFORM_CONFIG[platformName];

      if (!config) {
        errors.push({ platform: platformName, error: "Platform not supported" });
        return;
      }

      try {
        const updates = await config.publishFn(post, credential);
        results[platformName] = updates;
        successes.push(config.name);
      } catch (error) {
        errors.push({
          platform: config.name,
          error: error.message || "Publishing failed",
        });
      }
    })
  );

  // Update post with all successful results
  const updatedPost = await Post.findByIdAndUpdate(
    post._id,
    { status: "published", ...results },
    { new: true, runValidators: true }
  );

  // Determine response
  const hasErrors = errors.length > 0;
  const hasSuccesses = successes.length > 0;

  let message;
  if (!hasSuccesses) {
    message = "Failed to publish to any platform";
  } else if (hasErrors) {
    message = `Published to ${successes.join(", ")} with some errors`;
  } else {
    message = `Post published to all platforms successfully (${successes.join(", ")})`;
  }

  res.json({
    success: hasSuccesses,
    message,
    data: {
      postId: updatedPost._id,
      status: "published",
      successes,
      errors: errors.length ? errors : undefined,
    },
  });
});

/**
 * Get publish status for a post
 */
const statusMedium = asyncHandler(async (req, res) => {
  const post = await ensurePost(req.params.postId);

  res.json({
    success: true,
    data: {
      postId: post._id,
      status: post.status,
      platformStatus: post.platform_status,
    },
  });
});

/**
 * Unpublish from a specific platform
 */
const unpublishPlatform = asyncHandler(async (req, res) => {
  const { postId, platform } = req.params;

  if (!PLATFORM_CONFIG[platform]) {
    throw new ValidationError(`Invalid platform: ${platform}`);
  }

  const updatedPost = await unpublishFromPlatform(postId, platform);

  res.json({
    success: true,
    message: `Post unpublished from ${PLATFORM_CONFIG[platform].name}`,
    data: {
      postId: updatedPost._id,
      platformStatus: updatedPost.platform_status,
    },
  });
});

module.exports = {
  publishMedium,
  publishDevto,
  publishWordpress,
  publishAll,
  statusMedium,
  unpublishPlatform,
};
