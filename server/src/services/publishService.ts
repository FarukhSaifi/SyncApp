import axios from "axios";
import dayjs from "dayjs";
import { config } from "../config";
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
import type { IPlatformStatus, PlatformPublishAction, PlatformPublishResult } from "../types";
import { decrypt } from "../utils/encryption";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Resolve a full canonical URL for Dev.to, or undefined when none is valid. */
function resolveDevtoCanonicalUrl(post: IPostDocument): string | undefined {
  const stored = (post.canonical_url || "").trim();
  if (isValidHttpUrl(stored)) return stored;

  const base = config.canonicalBaseUrl;
  if (base && post.slug) {
    const built = `${base}/${post.slug}`;
    if (isValidHttpUrl(built)) return built;
  }

  return undefined;
}

function getExistingPlatformStatus(post: IPostDocument, platform: string): IPlatformStatus | undefined {
  const platformStatus = post.platform_status as Record<string, IPlatformStatus> | undefined;
  return platformStatus?.[platform];
}

function isAlreadyPublishedOnPlatform(post: IPostDocument, platform: string): boolean {
  const existing = getExistingPlatformStatus(post, platform);
  return Boolean(existing?.published && existing?.post_id);
}

function existingPlatformUpdates(post: IPostDocument, platform: string): Record<string, unknown> {
  const existing = getExistingPlatformStatus(post, platform);
  return {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(platform)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(platform)]: existing?.post_id,
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(platform)]: existing?.url,
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(platform)]: existing?.published_at ?? dayjs().toDate(),
  };
}

/** Dev.to allows max 4 tags; normalize to lowercase single-token names. */
function prepareDevtoTags(tags: string[] | undefined): string[] {
  const maxTags = PLATFORM_CONFIG.devto.maxTags;
  return (tags || [])
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, ""))
    .filter(Boolean)
    .slice(0, maxTags);
}

function buildDevtoArticlePayload(post: IPostDocument): Record<string, unknown> {
  const canonicalUrl = resolveDevtoCanonicalUrl(post);
  const article: Record<string, unknown> = {
    title: post.title,
    body_markdown: post.content_markdown,
    published: true,
    tags: prepareDevtoTags(post.tags),
    main_image: post.cover_image || "",
  };
  if (canonicalUrl) {
    article.canonical_url = canonicalUrl;
  }
  return article;
}

function devtoAuthHeaders(apiKey: string) {
  return {
    [HTTP.HEADERS.API_KEY]: apiKey,
    [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
  };
}

function wordpressAuthHeaders(apiKey: string) {
  return {
    [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
    [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
  };
}

export async function publishToMedium(
  post: IPostDocument,
  credential: ICredentialDocument,
): Promise<PlatformPublishResult> {
  if (isAlreadyPublishedOnPlatform(post, PLATFORMS.MEDIUM)) {
    return { updates: existingPlatformUpdates(post, PLATFORMS.MEDIUM), action: "skip" };
  }

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
    updates: {
      [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.MEDIUM)]: true,
      [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.MEDIUM)]: publishResponse.data.data.id,
      [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.MEDIUM)]: publishResponse.data.data.url,
      [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.MEDIUM)]: dayjs().toDate(),
    },
    action: "create",
  };
}

export async function publishToDevto(
  post: IPostDocument,
  credential: ICredentialDocument,
): Promise<PlatformPublishResult> {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_DEVTO_API_KEY);

  const article = buildDevtoArticlePayload(post);
  const existing = getExistingPlatformStatus(post, PLATFORMS.DEVTO);
  const headers = devtoAuthHeaders(apiKey);

  if (isAlreadyPublishedOnPlatform(post, PLATFORMS.DEVTO)) {
    const remoteId = existing!.post_id!;
    const publishResponse = await axios.put(API_URLS.DEVTO.ARTICLE_BY_ID(remoteId), { article }, { headers });

    return {
      updates: {
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.DEVTO)]: true,
        [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.DEVTO)]: publishResponse.data.id.toString(),
        [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.DEVTO)]: publishResponse.data.url,
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.DEVTO)]: existing?.published_at ?? dayjs().toDate(),
      },
      action: "update",
    };
  }

  const publishResponse = await axios.post(API_URLS.DEVTO.ARTICLES_ENDPOINT, { article }, { headers });

  return {
    updates: {
      [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.DEVTO)]: true,
      [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.DEVTO)]: publishResponse.data.id.toString(),
      [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.DEVTO)]: publishResponse.data.url,
      [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.DEVTO)]: dayjs().toDate(),
    },
    action: "create",
  };
}

export async function publishToWordpress(
  post: IPostDocument,
  credential: ICredentialDocument,
): Promise<PlatformPublishResult> {
  const apiKey = decrypt(credential.api_key);
  if (!apiKey) throw new Error(ERROR_MESSAGES.INVALID_WORDPRESS_API_KEY);

  const siteUrl =
    credential.site_url || (credential.platform_config as { wordpress_url?: string } | undefined)?.wordpress_url;
  if (!siteUrl) throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_NOT_CONFIGURED);

  const payload = {
    title: post.title,
    content: post.content_markdown,
    status: "publish",
    tags: post.tags || [],
  };
  const headers = wordpressAuthHeaders(apiKey);
  const existing = getExistingPlatformStatus(post, PLATFORMS.WORDPRESS);

  if (isAlreadyPublishedOnPlatform(post, PLATFORMS.WORDPRESS)) {
    const remoteId = existing!.post_id!;
    const publishResponse = await axios.put(API_URLS.WORDPRESS.POST_BY_ID(siteUrl, remoteId), payload, { headers });

    return {
      updates: {
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
        [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: publishResponse.data.id.toString(),
        [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: publishResponse.data.link,
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: existing?.published_at ?? dayjs().toDate(),
      },
      action: "update",
    };
  }

  const publishResponse = await axios.post(API_URLS.WORDPRESS.POSTS_ENDPOINT(siteUrl), payload, { headers });

  return {
    updates: {
      [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
      [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: publishResponse.data.id.toString(),
      [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: publishResponse.data.link,
      [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
    },
    action: "create",
  };
}

type PublishFn = (post: IPostDocument, credential: ICredentialDocument) => Promise<PlatformPublishResult>;

const PLATFORM_CONFIG_WITH_FUNCTIONS: Record<string, { name: string; publishFn: PublishFn }> = {
  [PLATFORMS.MEDIUM]: { name: PLATFORM_CONFIG.medium.name, publishFn: publishToMedium },
  [PLATFORMS.DEVTO]: { name: PLATFORM_CONFIG.devto.name, publishFn: publishToDevto },
  [PLATFORMS.WORDPRESS]: { name: PLATFORM_CONFIG.wordpress.name, publishFn: publishToWordpress },
};

function platformSuccessMessage(platformName: string, action: PlatformPublishAction): string {
  const platformCfg = PLATFORM_CONFIG_WITH_FUNCTIONS[platformName];
  const name = platformCfg?.name ?? platformName;
  if (action === "update") return SUCCESS_MESSAGES.UPDATED_ON_PLATFORM(name);
  if (action === "skip") return SUCCESS_MESSAGES.ALREADY_PUBLISHED_ON_PLATFORM(name);
  return SUCCESS_MESSAGES.PUBLISHED_TO_PLATFORM(name);
}

/**
 * Orchestrates publishing a post to all active platforms for its author.
 * Used by both the manual Publish All button and the automated Scheduling Cron.
 */
export async function performPublishToAll(post: IPostDocument) {
  const freshPost = await Post.findById(post._id);
  if (!freshPost) {
    throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  const credentials = await Credential.find({ author: freshPost.author, is_active: true });

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
        const { updates, action } = await platformCfg.publishFn(freshPost, credential);
        Object.assign(results, updates);
        successes.push(platformSuccessMessage(platformName, action));
      } catch (error) {
        errors.push({
          platform: platformCfg.name,
          error: (error as Error).message || ERROR_MESSAGES.PUBLISHING_FAILED,
        });
      }
    }),
  );

  const updatedPost = await Post.findByIdAndUpdate(
    freshPost._id,
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

export type { PlatformPublishAction, PlatformPublishResult } from "../types";

export { platformSuccessMessage };
