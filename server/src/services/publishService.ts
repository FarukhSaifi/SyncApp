import axios from "axios";
import dayjs from "dayjs";
import {
  API_URLS,
  ERROR_MESSAGES,
  FIELDS,
  HTTP,
  PLATFORM_CONFIG,
  PLATFORMS,
  POST_STATUS,
  SUCCESS_MESSAGES,
} from "../constants";
import type { ICredentialDocument } from "../models/Credential";
import Credential from "../models/Credential";
import type { IPostDocument } from "../models/Post";
import Post from "../models/Post";
import { decrypt } from "../utils/encryption";

export async function publishToMedium(post: IPostDocument, credential: ICredentialDocument) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_MEDIUM_API_KEY);

  const userResponse = await axios.get(API_URLS.MEDIUM.ME_ENDPOINT, {
    headers: {
      [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
      [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
    },
  });

  const userId = userResponse.data.data.id;
  const publishResponse = await axios.post(
    API_URLS.MEDIUM.POSTS_ENDPOINT(userId),
    {
      title: post.title,
      contentFormat: "markdown",
      content: post.content_markdown,
      publishStatus: "public",
    },
    {
      headers: {
        [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
      },
    },
  );

  return {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.MEDIUM)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.MEDIUM)]: publishResponse.data.data.id,
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.MEDIUM)]: publishResponse.data.data.url,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.MEDIUM)]: dayjs().toDate(),
  };
}

export async function publishToDevto(post: IPostDocument, credential: ICredentialDocument) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_DEVTO_API_KEY);

  const publishResponse = await axios.post(
    API_URLS.DEVTO.ARTICLES_ENDPOINT,
    {
      article: {
        title: post.title,
        body_markdown: post.content_markdown,
        published: true,
        tags: post.tags || [],
        main_image: post.cover_image || "",
        canonical_url: post.canonical_url || "",
      },
    },
    {
      headers: {
        [HTTP.HEADERS.API_KEY]: apiKey,
        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
      },
    },
  );

  return {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.DEVTO)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.DEVTO)]: publishResponse.data.id.toString(),
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.DEVTO)]: publishResponse.data.url,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.DEVTO)]: dayjs().toDate(),
  };
}

export async function publishToWordpress(post: IPostDocument, credential: ICredentialDocument) {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_WORDPRESS_API_KEY);

  const siteUrl =
    credential.site_url || (credential.platform_config as { wordpress_url?: string } | undefined)?.wordpress_url;
  if (!siteUrl) throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_NOT_CONFIGURED);

  const publishResponse = await axios.post(
    API_URLS.WORDPRESS.POSTS_ENDPOINT(siteUrl),
    {
      title: post.title,
      content: post.content_markdown,
      status: "publish",
      tags: post.tags || [],
    },
    {
      headers: {
        [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
      },
    },
  );

  return {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: publishResponse.data.id.toString(),
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: publishResponse.data.link,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
  };
}

type PublishFn = (post: IPostDocument, credential: ICredentialDocument) => Promise<Record<string, unknown>>;

const PLATFORM_CONFIG_WITH_FUNCTIONS: Record<string, { name: string; publishFn: PublishFn }> = {
  [PLATFORMS.MEDIUM]: { name: PLATFORM_CONFIG.medium.name, publishFn: publishToMedium },
  [PLATFORMS.DEVTO]: { name: PLATFORM_CONFIG.devto.name, publishFn: publishToDevto },
  [PLATFORMS.WORDPRESS]: { name: PLATFORM_CONFIG.wordpress.name, publishFn: publishToWordpress },
};

/**
 * Orchestrates publishing a post to all active platforms for its author.
 * Used by both the manual Publish All button and the automated Scheduling Cron.
 */
export async function performPublishToAll(post: IPostDocument) {
  const credentials = await Credential.find({ is_active: true });

  if (credentials.length === 0) {
    throw new Error(ERROR_MESSAGES.NO_ACTIVE_CREDENTIALS);
  }

  const results: Record<string, unknown> = {};
  const errors: Array<{ platform: string; error: string }> = [];
  const successes: string[] = [];

  await Promise.allSettled(
    credentials.map(async (credential) => {
      const platformName = credential.platform_name;
      const platformCfg = PLATFORM_CONFIG_WITH_FUNCTIONS[platformName];

      if (!platformCfg) {
        errors.push({ platform: platformName, error: ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED });
        return;
      }

      try {
        const updates = await platformCfg.publishFn(post, credential);
        Object.assign(results, updates);
        successes.push(platformCfg.name);
      } catch (error) {
        errors.push({
          platform: platformCfg.name,
          error: (error as Error).message || ERROR_MESSAGES.PUBLISHING_FAILED,
        });
      }
    }),
  );

  const updatedPost = await Post.findByIdAndUpdate(
    post._id,
    { status: POST_STATUS.PUBLISHED, ...results },
    { new: true, runValidators: true },
  );

  const hasSuccesses = successes.length > 0;
  let message: string;

  if (!hasSuccesses) {
    message = SUCCESS_MESSAGES.FAILED_TO_PUBLISH_ALL;
  } else if (errors.length > 0) {
    message = SUCCESS_MESSAGES.PUBLISHED_TO_PLATFORMS(successes);
  } else {
    message = SUCCESS_MESSAGES.PUBLISHED_TO_ALL(successes);
  }

  return {
    post: updatedPost,
    success: hasSuccesses,
    message,
    successes,
    errors: errors.length ? errors : undefined,
  };
}
