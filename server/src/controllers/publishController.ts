import type { Request, Response } from "express";
import { ERROR_MESSAGES, PLATFORM_CONFIG, PLATFORMS, POST_STATUS, SUCCESS_MESSAGES } from "../constants";
import { asyncHandler, ForbiddenError, NotFoundError, ValidationError } from "../middleware/errorHandler";
import type { ICredentialDocument } from "../models/Credential";
import Credential from "../models/Credential";
import type { IPostDocument } from "../models/Post";
import Post from "../models/Post";
import { unpublishFromPlatform } from "../services/platformService";
import {
  performPublishToAll,
  platformSuccessMessage,
  publishToDevto,
  publishToLinkedin,
  publishToMedium,
  publishToWordpress,
} from "../services/publishService";

import { PlatformConfigWithFn } from "../types";

const PLATFORM_CONFIG_WITH_FUNCTIONS: Record<string, PlatformConfigWithFn> = {
  [PLATFORMS.MEDIUM]: { ...PLATFORM_CONFIG.medium, publishFn: publishToMedium },
  [PLATFORMS.DEVTO]: { ...PLATFORM_CONFIG.devto, publishFn: publishToDevto },
  [PLATFORMS.WORDPRESS]: { ...PLATFORM_CONFIG.wordpress, publishFn: publishToWordpress },
  [PLATFORMS.LINKEDIN]: { ...PLATFORM_CONFIG.linkedin, publishFn: publishToLinkedin },
};

/**
 * Get and validate post owned by the authenticated user
 */
async function ensurePost(postId: string | undefined, userId: string): Promise<IPostDocument> {
  if (!postId) {
    throw new ValidationError(ERROR_MESSAGES.POST_ID_REQUIRED);
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  if (post.author.toString() !== userId) {
    throw new ForbiddenError(ERROR_MESSAGES.ACCESS_DENIED_POST);
  }

  return post;
}

function getPlatformConfig(platformName: string) {
  if (platformName === PLATFORMS.MEDIUM) return PLATFORM_CONFIG.medium;
  if (platformName === PLATFORMS.DEVTO) return PLATFORM_CONFIG.devto;
  if (platformName === PLATFORMS.WORDPRESS) return PLATFORM_CONFIG.wordpress;
  if (platformName === PLATFORMS.LINKEDIN) return PLATFORM_CONFIG.linkedin;
  return undefined;
}

function getPlatformConfigWithFn(platformName: string) {
  if (platformName === PLATFORMS.MEDIUM) return PLATFORM_CONFIG_WITH_FUNCTIONS.medium;
  if (platformName === PLATFORMS.DEVTO) return PLATFORM_CONFIG_WITH_FUNCTIONS.devto;
  if (platformName === PLATFORMS.WORDPRESS) return PLATFORM_CONFIG_WITH_FUNCTIONS.wordpress;
  if (platformName === PLATFORMS.LINKEDIN) return PLATFORM_CONFIG_WITH_FUNCTIONS.linkedin;
  return undefined;
}

function getPlatformStatusField(platformStatus: any, platformName: string) {
  if (!platformStatus) return undefined;
  if (platformName === PLATFORMS.MEDIUM) return platformStatus.medium;
  if (platformName === PLATFORMS.DEVTO) return platformStatus.devto;
  if (platformName === PLATFORMS.WORDPRESS) return platformStatus.wordpress;
  if (platformName === PLATFORMS.LINKEDIN) return platformStatus.linkedin;
  return undefined;
}

/**
 * Get and validate credential for platform
 */
async function ensureCredential(platformName: string, authorId: IPostDocument["author"]): Promise<ICredentialDocument> {
  const credential = await Credential.findOne({ platform_name: platformName, author: authorId, is_active: true });

  if (!credential) {
    const platformCfg = getPlatformConfig(platformName);
    throw new ValidationError(platformCfg?.errorMessage || `${platformName} credentials not found`);
  }

  return credential;
}

/**
 * Generic publish handler for any platform
 */
function publishToPlatform(platformName: string) {
  return asyncHandler(async (req: Request, res: Response) => {
    const platformCfg = getPlatformConfigWithFn(platformName);
    if (!platformCfg) {
      throw new ValidationError(ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED);
    }

    const post = await ensurePost(req.body.postId as string | undefined, req.userId!);
    const credential = await ensureCredential(platformName, post.author);

    const { updates, action } = await platformCfg.publishFn(post, credential);

    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      { status: POST_STATUS.PUBLISHED, ...updates },
      { new: true, runValidators: true },
    );

    if (!updatedPost) throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);

    const platformStatus = getPlatformStatusField(updatedPost.platform_status, platformName);

    res.json({
      success: true,
      message: platformSuccessMessage(platformName, action),
      data: {
        postId: updatedPost._id,
        status: POST_STATUS.PUBLISHED,
        platformStatus,
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
 * Publish LinkedIn summary
 */
export const publishLinkedin = publishToPlatform(PLATFORMS.LINKEDIN);

/**
 * Publish to all active platforms
 */
export const publishAll = asyncHandler(async (req: Request, res: Response) => {
  const post = await ensurePost(req.body.postId as string | undefined, req.userId!);
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
  const post = await ensurePost(req.params.postId as string, req.userId!);

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

  if (platform === PLATFORMS.LINKEDIN) {
    throw new ValidationError(ERROR_MESSAGES.LINKEDIN_UNPUBLISH_UNSUPPORTED);
  }

  const platformCfg = getPlatformConfig(platform);
  if (!platformCfg) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_PLATFORM_PARAM(platform));
  }

  await ensurePost(postId, req.userId!);

  const updatedPost = await unpublishFromPlatform(postId, platform);

  if (!updatedPost) throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.UNPUBLISHED_FROM_PLATFORM(platformCfg.name),
    data: {
      postId: updatedPost._id,
      platformStatus: updatedPost.platform_status,
    },
  });
});
