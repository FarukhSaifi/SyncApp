import { ERROR_MESSAGES, FIELDS } from '@constants';
import { NotFoundError } from '@middleware/errorHandler';
import Post from '@models/Post';

/**
 * Unpublish/remove post from a specific platform
 */
export async function unpublishFromPlatform(postId: string, platformName: string) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  const updateData: Record<string, unknown> = {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(platformName)]: false,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(platformName)]: null,
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(platformName)]: null,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(platformName)]: null,
  };

  const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { returnDocument: "after", runValidators: true })
    .populate(FIELDS.COMMON_FIELDS.AUTHOR, FIELDS.USER_FIELDS.SELECT_PUBLIC)
    .lean();

  return updatedPost;
}

/**
 * Get post publishing status for a specific platform
 */
export async function getPlatformStatus(postId: string, platformName: string) {
  const post = await Post.findById(postId).select(FIELDS.POST_FIELDS.PLATFORM_STATUS_PREFIX).lean();

  if (!post) {
    throw new NotFoundError(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  const platformStatus = (post.platform_status as Record<string, unknown> | undefined)?.[platformName];
  const status =
    platformStatus && typeof platformStatus === "object"
      ? (platformStatus as {
          published?: boolean;
          post_id?: string | null;
          url?: string | null;
          published_at?: Date | string | null;
        })
      : {
          published: false,
          post_id: null,
          url: null,
          published_at: null,
        };

  return {
    platform: platformName,
    status,
  };
}
