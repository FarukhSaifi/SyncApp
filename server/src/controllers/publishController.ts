import type { Request, Response } from "express";
import { ERROR_MESSAGES, PLATFORM_CONFIG, PLATFORMS, POST_STATUS, SUCCESS_MESSAGES } from "../constants";
import { asyncHandler, NotFoundError, ValidationError } from "../middleware/errorHandler";
import type { ICredentialDocument } from "../models/Credential";
import Credential from "../models/Credential";
import type { IPostDocument } from "../models/Post";
import Post from "../models/Post";
import { unpublishFromPlatform } from "../services/platformService";
import { performPublishToAll, publishToDevto, publishToMedium, publishToWordpress } from "../services/publishService";

type PublishFn = (post: IPostDocument, credential: ICredentialDocument) => Promise<Record<string, unknown>>;

interface PlatformConfigWithFn {
  name: string;
  errorMessage?: string;
  publishFn: PublishFn;
  [key: string]: unknown;
}

const PLATFORM_CONFIG_WITH_FUNCTIONS: Record<string, PlatformConfigWithFn> = {
  [PLATFORMS.MEDIUM]: { ...PLATFORM_CONFIG.medium, publishFn: publishToMedium },
  [PLATFORMS.DEVTO]: { ...PLATFORM_CONFIG.devto, publishFn: publishToDevto },
  [PLATFORMS.WORDPRESS]: { ...PLATFORM_CONFIG.wordpress, publishFn: publishToWordpress },
};

/**
 * Get and validate post
 */
async function ensurePost(postId: string | undefined): Promise<IPostDocument> {
  if (!postId) {
    throw new ValidationError(ERROR_MESSAGES.POST_ID_REQUIRED);
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  return post;
}

/**
 * Get and validate credential for platform
 */
async function ensureCredential(platformName: string): Promise<ICredentialDocument> {
  const credential = await Credential.findOne({ platform_name: platformName });

  if (!credential) {
    const platformCfg = PLATFORM_CONFIG[platformName as keyof typeof PLATFORM_CONFIG] as
      | { errorMessage?: string }
      | undefined;
    throw new ValidationError(platformCfg?.errorMessage || `${platformName} credentials not found`);
  }

  return credential;
}

/**
 * Generic publish handler for any platform
 */
function publishToPlatform(platformName: string) {
  return asyncHandler(async (req: Request, res: Response) => {
    const platformCfg = PLATFORM_CONFIG_WITH_FUNCTIONS[platformName];
    if (!platformCfg) {
      throw new ValidationError(ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED);
    }

    const post = await ensurePost(req.body.postId as string | undefined);
    const credential = await ensureCredential(platformName);

    const updates = await platformCfg.publishFn(post, credential);

    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { status: POST_STATUS.PUBLISHED, ...updates },
      { new: true, runValidators: true },
    );

    if (!updatedPost) throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PUBLISHED_TO_PLATFORM(platformCfg.name),
      data: {
        postId: updatedPost._id,
        status: POST_STATUS.PUBLISHED,
        platformStatus: updatedPost.platform_status?.[platformName as keyof typeof updatedPost.platform_status],
      },
    });
  });
}

/**
 * Publish to Medium
 */
export const publishMedium = publishToPlatform(PLATFORMS.MEDIUM);

/**
 * Publish to DEV.to
 */
export const publishDevto = publishToPlatform(PLATFORMS.DEVTO);

/**
 * Publish to WordPress
 */
export const publishWordpress = publishToPlatform(PLATFORMS.WORDPRESS);

/**
 * Publish to all active platforms
 */
export const publishAll = asyncHandler(async (req: Request, res: Response) => {
  const post = await ensurePost(req.body.postId as string | undefined);
  const result = await performPublishToAll(post);

  res.json({
    success: result.success,
    message: result.message,
    data: {
      postId: result.post?._id,
      status: POST_STATUS.PUBLISHED,
      successes: result.successes,
      errors: result.errors,
    },
  });
});

/**
 * Get publish status for a post
 */
export const statusMedium = asyncHandler(async (req: Request, res: Response) => {
  const post = await ensurePost(req.params.postId as string);

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
export const unpublishPlatform = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  const platform = req.params.platform as string;

  if (!PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_PLATFORM_PARAM(platform));
  }

  const updatedPost = await unpublishFromPlatform(postId, platform);

  if (!updatedPost) throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.UNPUBLISHED_FROM_PLATFORM(
      (PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG] as { name: string }).name,
    ),
    data: {
      postId: updatedPost._id,
      platformStatus: updatedPost.platform_status,
    },
  });
});
