import { config } from "@config";
import {
  AI_POST_LIMITS,
  API_URLS,
  DEFAULT_VALUES,
  ERROR_MESSAGES,
  FIELDS,
  HTTP,
  PLATFORM_CONFIG,
  PLATFORM_SYNC,
  PLATFORMS,
  POST_STATUS,
  REGEX_PATTERNS,
  SUCCESS_MESSAGES,
} from "@constants";
import type { ICredentialDocument } from "@models/Credential";
import Credential from "@models/Credential";
import type { IPostDocument } from "@models/Post";
import Post from "@models/Post";
import User from "@models/User";
import type {
  IPlatformStatus,
  PlatformPublishAction,
  PlatformPublishResult,
  PublishFn,
  PublishScheduledPostsResult,
  PublishToActivePlatformsResult,
  ScheduledPublishPostResult,
} from "@types";
import { cache, cacheKeys } from "@utils/cache";
import { decryptCredential } from "@utils/encryption";
import { finalizeLinkedInPost } from "@utils/linkedinPost";
import { logger } from "@utils/logger";
import { scheduledPublishDueFilter } from "@utils/scheduleUtils";
import axios from "axios";
import dayjs from "dayjs";

import { PUBLISH_ERROR_PLATFORM_SYSTEM, SCHEDULED_PUBLISH_MAX_PER_RUN } from "@constants/notifications";

import { resolveLinkedInAccess } from "./linkedinOAuthService";
import { notifyScheduledPublishResult } from "./notificationService";
import {
  linkExistingWordpressPost,
  publishToWordpress,
  searchWordpressPostsForLink,
  syncPublishedPostToWordpress,
  testWordpressConnection,
  uploadWordpressFeaturedMedia,
} from "./wordpressService";

export {
  linkExistingWordpressPost,
  publishToWordpress,
  searchWordpressPostsForLink,
  syncPublishedPostToWordpress,
  testWordpressConnection,
  uploadWordpressFeaturedMedia,
};

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
  if (isValidHttpUrl(stored)) {
    return stored;
  }

  const base = config.canonicalBaseUrl;
  if (base && post.slug) {
    const built = `${base}/${post.slug}`;
    if (isValidHttpUrl(built)) {
      return built;
    }
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

/** Dev.to allows max 4 tags; normalize to lowercase single-token names (no hyphens). */
function prepareDevtoTags(tags: string[] | undefined): string[] {
  const maxTags = PLATFORM_CONFIG.devto.maxTags;
  const seen = new Set<string>();

  return (tags || [])
    .map((tag) => tag.trim().toLowerCase().replace(REGEX_PATTERNS.DEVTO_TAG_NORMALIZE, ""))
    .filter((tag) => {
      if (!tag || seen.has(tag)) {
        return false;
      }
      seen.add(tag);
      return true;
    })
    .slice(0, maxTags);
}

/** Resolve a public HTTP(S) cover URL for Dev.to, or empty when not publishable. */
function resolveDevtoCoverImage(post: IPostDocument): string {
  const cover = (post.cover_image || "").trim();
  if (!cover) {
    return "";
  }
  if (cover.startsWith("data:")) {
    return "";
  }
  if (isValidHttpUrl(cover)) {
    return cover;
  }
  return "";
}

function buildDevtoArticlePayload(post: IPostDocument): Record<string, unknown> {
  const canonicalUrl = resolveDevtoCanonicalUrl(post);
  const metaDescription = (post.meta_description || "").trim();
  const article: Record<string, unknown> = {
    title: post.title,
    body_markdown: post.content_markdown,
    published: PLATFORM_CONFIG.devto.published,
    tags: prepareDevtoTags(post.tags),
    main_image: resolveDevtoCoverImage(post),
  };
  if (metaDescription) {
    article.description = metaDescription.slice(0, AI_POST_LIMITS.META_DESC_MAX);
  }
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

/** Editor stores Quill HTML in content_markdown; Medium requires matching contentFormat. */
function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }
  return trimmed.startsWith("<") && REGEX_PATTERNS.HTML_CONTENT_DETECT.test(trimmed);
}

function resolveMediumContentPayload(post: IPostDocument): { contentFormat: "html" | "markdown"; content: string } {
  const content = post.content_markdown || "";
  return {
    contentFormat: isHtmlContent(content) ? "html" : "markdown",
    content,
  };
}

function isDecryptFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message === ERROR_MESSAGES.FAILED_TO_DECRYPT || message.includes(DEFAULT_VALUES.DECRYPT_OPENSSL_BAD_DECRYPT_SNIPPET)
  );
}

/** Decrypt platform API key; surface actionable Settings guidance on key mismatch. */
function decryptPlatformApiKey(credential: ICredentialDocument): string {
  try {
    return decryptCredential(credential.encrypted_payload || credential.api_key);
  } catch (error) {
    if (isDecryptFailure(error)) {
      throw new Error(ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED, { cause: error });
    }
    throw error;
  }
}

function mediumErrorMessage(error: unknown): string {
  if (isDecryptFailure(error) || (error as Error).message === ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED) {
    return ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED;
  }
  const axiosError = error as Error & {
    isAxiosError?: boolean;
    response?: { status?: number; data?: { errors?: Array<{ message?: string }> } };
  };
  if (axiosError.isAxiosError && axiosError.response?.data?.errors?.length) {
    const messages = axiosError.response.data.errors.map((e) => e.message).filter(Boolean);
    if (messages.length > 0) {
      return messages.join("; ");
    }
  }
  return (error as Error).message || ERROR_MESSAGES.PUBLISHING_FAILED;
}

function devtoErrorMessage(error: unknown): string {
  if (isDecryptFailure(error) || (error as Error).message === ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED) {
    return ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED;
  }
  const axiosError = error as Error & {
    isAxiosError?: boolean;
    response?: { status?: number; data?: Record<string, unknown> };
  };
  const data = axiosError.response?.data;
  if (axiosError.isAxiosError && data) {
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data.errors)) {
      const messages = data.errors
        .map((entry) => {
          if (typeof entry === "string") {
            return entry;
          }
          if (entry && typeof entry === "object" && "message" in entry) {
            return String((entry as { message?: unknown }).message ?? "");
          }
          return "";
        })
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join("; ");
      }
    }
    if (typeof data === "object") {
      return JSON.stringify(data);
    }
  }
  return (error as Error).message || ERROR_MESSAGES.PUBLISHING_FAILED;
}


function linkedinErrorMessage(error: unknown): string {
  const known = (error as Error)?.message;
  if (
    known === ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN ||
    known === ERROR_MESSAGES.LINKEDIN_PERSON_URN_MISSING ||
    known === ERROR_MESSAGES.LINKEDIN_SUMMARY_REQUIRED
  ) {
    return known;
  }

  const candidates: unknown[] = [error];
  if (error instanceof Error && error.cause) {
    candidates.push(error.cause);
  }

  for (const candidate of candidates) {
    const axiosError = candidate as Error & {
      isAxiosError?: boolean;
      response?: {
        status?: number;
        data?: { message?: string; error?: string; error_description?: string; code?: string };
      };
    };
    if (!axiosError.isAxiosError) {
      continue;
    }

    const status = axiosError.response?.status;
    if (status === 401 || status === 403) {
      return ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN;
    }

    const data = axiosError.response?.data;
    if (!data) {
      continue;
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data.error_description === "string" && data.error_description.trim()) {
      return data.error_description;
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return known || ERROR_MESSAGES.PUBLISHING_FAILED;
}

/**
 * Medium Posts API is create-only (POST /users/:id/posts). There is no public update
 * endpoint for title/body/cover after first publish — save-sync is skipped by design
 * (API limitation, not a SyncApp gap). Schedule and SEO stay local to SyncApp.
 * If already published → action "skip" (honest UX via MEDIUM_ALREADY_PUBLISHED).
 */
export async function publishToMedium(
  post: IPostDocument,
  credential: ICredentialDocument,
): Promise<PlatformPublishResult> {
  if (isAlreadyPublishedOnPlatform(post, PLATFORMS.MEDIUM)) {
    return { updates: existingPlatformUpdates(post, PLATFORMS.MEDIUM), action: "skip" };
  }

  const apiKey = decryptPlatformApiKey(credential);
  if (!apiKey) {
    throw new Error(ERROR_MESSAGES.INVALID_MEDIUM_API_KEY);
  }

  const userResponse = await axios.get(API_URLS.MEDIUM.ME_ENDPOINT, {
    headers: {
      [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${apiKey}`,
      [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
    },
  });

  const userId = userResponse.data.data.id;
  const { contentFormat, content } = resolveMediumContentPayload(post);

  const publishResponse = await axios.post(
    API_URLS.MEDIUM.POSTS_ENDPOINT(userId),
    {
      title: post.title,
      contentFormat,
      content,
      publishStatus: PLATFORM_CONFIG.medium.publishStatus,
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
  const apiKey = decryptPlatformApiKey(credential);
  if (!apiKey) {
    throw new Error(ERROR_MESSAGES.INVALID_DEVTO_API_KEY);
  }

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

/**
 * On save/update: if the post is already live on DEV.to, PUT article fields via
 * publishToDevto (title, body_markdown, tags, description, canonical_url, main_image).
 * Best-effort — never throws; local save must still succeed if DEV.to is unreachable.
 *
 * Local-only fields (see PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE — schedule, SEO scorecard,
 * status) are intentionally NOT pushed. Only buildDevtoArticlePayload keys sync;
 * see PLATFORM_SYNC.DEVTO_SYNCABLE_ON_SAVE in @constants/platformSync.
 */
export async function syncPublishedPostToDevto(post: IPostDocument, authorId: string): Promise<boolean> {
  const postId = String(post._id || "");
  try {
    if (!isAlreadyPublishedOnPlatform(post, PLATFORMS.DEVTO)) {
      return false;
    }

    const credential = await Credential.findOne({
      platform_name: PLATFORMS.DEVTO,
      author: authorId,
      is_active: true,
    });
    if (!credential) {
      logger.warn(`${ERROR_MESSAGES.DEVTO_POST_SYNC_SKIPPED_NO_CREDENTIAL} (post ${postId})`);
      return false;
    }

    await publishToDevto(post, credential);
    logger.info(SUCCESS_MESSAGES.DEVTO_POST_SYNCED(postId));
    return true;
  } catch (err) {
    logger.warn(ERROR_MESSAGES.DEVTO_POST_SYNC_FAILED((err as Error).message));
    return false;
  }
}

/** @deprecated Prefer syncPublishedPostToDevto — thin cover-era alias. */
export async function syncPublishedCoverToDevto(post: IPostDocument, authorId: string): Promise<boolean> {
  return syncPublishedPostToDevto(post, authorId);
}

/** Log Medium/LinkedIn API sync limits at most once per process (avoid save-path spam). */
let mediumSaveSyncLimitLogged = false;
let linkedinCoverSyncLimitLogged = false;

/**
 * No-op save-sync for Medium. Medium's API cannot update an existing post
 * (create-only). Returns false and logs once so postsService orchestration can
 * call this beside DEV.to sync without implying remote sync works.
 */
export async function syncPublishedPostToMedium(_post: IPostDocument, _authorId: string): Promise<boolean> {
  if (!mediumSaveSyncLimitLogged) {
    mediumSaveSyncLimitLogged = true;
    logger.warn(ERROR_MESSAGES.MEDIUM_SAVE_SYNC_UNSUPPORTED);
  }
  return false;
}

/**
 * No-op cover/field sync for LinkedIn. Current UGC payload is text-only
 * (MEDIA_CATEGORY_NONE); LinkedIn has no edit-in-place for prior shares.
 * See PLATFORM_SYNC.LINKEDIN_COVER_SYNC (not_applicable) and LOCAL_ONLY_ON_SAVE.
 * Returns false; logs once.
 */
export async function syncPublishedCoverToLinkedin(_post: IPostDocument, _authorId: string): Promise<boolean> {
  if (!linkedinCoverSyncLimitLogged) {
    linkedinCoverSyncLimitLogged = true;
    logger.warn(`${ERROR_MESSAGES.LINKEDIN_COVER_SYNC_UNSUPPORTED} (${PLATFORM_SYNC.LINKEDIN_COVER_SYNC})`);
  }
  return false;
}

/**
 * Publish the LinkedIn summary (not the full TipTap article) via UGC Posts API.
 * Always creates a NEW share — LinkedIn has no edit-in-place for prior UGC posts
 * (PLATFORM_SYNC.LINKEDIN_SAVE_SYNC). Cover is N/A (LINKEDIN_COVER_SYNC = not_applicable;
 * MEDIA_CATEGORY_NONE). Save does not update a previous share (API limitation).
 * Schedule and SEO stay local (PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE).
 * wasPublished → action "update" only means "re-publish created another share".
 */
export async function publishToLinkedin(
  post: IPostDocument,
  credential: ICredentialDocument,
): Promise<PlatformPublishResult> {
  const summary = (post.linkedin_post || "").trim();
  if (!summary) {
    throw new Error(ERROR_MESSAGES.LINKEDIN_SUMMARY_REQUIRED);
  }

  const readMore =
    (post.linkedin_read_more_url || "").trim() ||
    ((post.canonical_url || "").trim().startsWith("http") ? (post.canonical_url || "").trim() : undefined);
  const commentary = finalizeLinkedInPost(summary, readMore);

  const wasPublished = isAlreadyPublishedOnPlatform(post, PLATFORMS.LINKEDIN);

  try {
    const { accessToken, personUrn } = await resolveLinkedInAccess(credential);

    const { UGC, RESTLI_PROTOCOL_HEADER, RESTLI_PROTOCOL_VERSION } = API_URLS.LINKEDIN;
    // Cover intentionally omitted: MEDIA_CATEGORY_NONE — do not invent IMAGE media without product scope.
    const payload = {
      author: personUrn,
      lifecycleState: UGC.LIFECYCLE_PUBLISHED,
      specificContent: {
        [UGC.SHARE_CONTENT_TYPE]: {
          shareCommentary: { text: commentary },
          shareMediaCategory: UGC.MEDIA_CATEGORY_NONE,
        },
      },
      visibility: {
        [UGC.MEMBER_NETWORK_VISIBILITY]: UGC.VISIBILITY_PUBLIC,
      },
    };

    const publishResponse = await axios.post(API_URLS.LINKEDIN.UGC_POSTS_URL, payload, {
      headers: {
        [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${accessToken}`,
        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
        [RESTLI_PROTOCOL_HEADER]: RESTLI_PROTOCOL_VERSION,
      },
    });

    const postUrn =
      (typeof publishResponse.data?.id === "string" && publishResponse.data.id) ||
      (typeof publishResponse.headers?.["x-restli-id"] === "string" && publishResponse.headers["x-restli-id"]) ||
      "";

    if (!postUrn) {
      throw new Error(ERROR_MESSAGES.PUBLISHING_FAILED);
    }

    const existing = getExistingPlatformStatus(post, PLATFORMS.LINKEDIN);

    return {
      updates: {
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.LINKEDIN)]: true,
        [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.LINKEDIN)]: postUrn,
        [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.LINKEDIN)]: API_URLS.LINKEDIN.FEED_UPDATE_URL(postUrn),
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.LINKEDIN)]: existing?.published_at ?? dayjs().toDate(),
      },
      action: wasPublished ? "update" : "create",
    };
  } catch (error) {
    throw new Error(linkedinErrorMessage(error), { cause: error });
  }
}

const PLATFORM_CONFIG_WITH_FUNCTIONS: Record<string, { name: string; publishFn: PublishFn }> = {
  [PLATFORMS.MEDIUM]: { name: PLATFORM_CONFIG.medium.name, publishFn: publishToMedium },
  [PLATFORMS.DEVTO]: { name: PLATFORM_CONFIG.devto.name, publishFn: publishToDevto },
  [PLATFORMS.WORDPRESS]: { name: PLATFORM_CONFIG.wordpress.name, publishFn: publishToWordpress },
  [PLATFORMS.LINKEDIN]: { name: PLATFORM_CONFIG.linkedin.name, publishFn: publishToLinkedin },
};

function platformSuccessMessage(platformName: string, action: PlatformPublishAction): string {
  const platformCfg = PLATFORM_CONFIG_WITH_FUNCTIONS[platformName];
  const name = platformCfg?.name ?? platformName;

  if (platformName === PLATFORMS.MEDIUM && action === "skip") {
    return SUCCESS_MESSAGES.MEDIUM_ALREADY_PUBLISHED;
  }

  if (platformName === PLATFORMS.LINKEDIN) {
    if (action === "update") {
      return SUCCESS_MESSAGES.LINKEDIN_PUBLISH_CREATES_NEW;
    }
    if (action === "create") {
      return SUCCESS_MESSAGES.LINKEDIN_PUBLISH_CREATED;
    }
  }

  if (action === "update") {
    return SUCCESS_MESSAGES.UPDATED_ON_PLATFORM(name);
  }
  if (action === "skip") {
    return SUCCESS_MESSAGES.ALREADY_PUBLISHED_ON_PLATFORM(name);
  }
  return SUCCESS_MESSAGES.PUBLISHED_TO_PLATFORM(name);
}

/**
 * Orchestrates publishing a post to all active platforms for its author.
 * Used by the manual Publish All button.
 */
export async function performPublishToAll(post: IPostDocument) {
  const freshPost = await Post.findById(post._id);
  if (!freshPost) {
    throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  const { platformUpdates, successes, errors } = await publishToActivePlatforms(freshPost);

  if (successes.length === 0) {
    return {
      post: freshPost,
      success: false,
      message: SUCCESS_MESSAGES.FAILED_TO_PUBLISH_ALL,
      successes,
      errors: errors.length ? errors : undefined,
    };
  }

  const updatedPost = await Post.findByIdAndUpdate(
    freshPost._id,
    { status: POST_STATUS.PUBLISHED, ...platformUpdates },
    { returnDocument: "after", runValidators: true },
  );

  let message: string;
  if (errors.length > 0) {
    message = SUCCESS_MESSAGES.PUBLISHED_TO_PLATFORMS(successes);
  } else {
    message = SUCCESS_MESSAGES.PUBLISHED_TO_ALL(successes);
  }

  return {
    post: updatedPost,
    success: true,
    message,
    successes,
    errors: errors.length ? errors : undefined,
  };
}

/** Syndicate to active author credentials (optionally filtered by platform slug). Does not mutate post. */
async function publishToActivePlatforms(
  post: IPostDocument,
  options?: { platforms?: string[] },
): Promise<PublishToActivePlatformsResult> {
  const credentials = await Credential.find({ author: post.author, is_active: true });
  const allowed =
    Array.isArray(options?.platforms) && options.platforms.length > 0
      ? new Set(options.platforms.map((p) => p.trim().toLowerCase()).filter(Boolean))
      : null;
  const targets = allowed ? credentials.filter((c) => allowed.has(c.platform_name)) : credentials;

  if (targets.length === 0) {
    throw new Error(ERROR_MESSAGES.NO_ACTIVE_CREDENTIALS);
  }

  const platformUpdates: Record<string, unknown> = {};
  const errors: Array<{ platform: string; error: string }> = [];
  const successes: string[] = [];

  await Promise.allSettled(
    targets.map(async (credential) => {
      const platformName = credential.platform_name;
      const platformCfg = PLATFORM_CONFIG_WITH_FUNCTIONS[platformName];

      if (!platformCfg) {
        errors.push({ platform: platformName, error: ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED });
        return;
      }

      try {
        const { updates, action } = await platformCfg.publishFn(post, credential);
        Object.assign(platformUpdates, updates);
        successes.push(platformSuccessMessage(platformName, action));
      } catch (error) {
        const errorMessage =
          platformName === PLATFORMS.MEDIUM
            ? mediumErrorMessage(error)
            : platformName === PLATFORMS.DEVTO
              ? devtoErrorMessage(error)
              : platformName === PLATFORMS.LINKEDIN
                ? linkedinErrorMessage(error)
                : isDecryptFailure(error) || (error as Error).message === ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED
                  ? ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED
                  : (error as Error).message || ERROR_MESSAGES.PUBLISHING_FAILED;
        errors.push({
          platform: platformCfg.name,
          error: errorMessage,
        });
      }
    }),
  );

  return { platformUpdates, successes, errors };
}

async function loadAuthorForNotification(authorId: unknown) {
  const author = await User.findById(authorId).select("email firstName lastName").lean();
  if (!author) {
    return { authorEmail: undefined, authorName: undefined };
  }
  const name = [author.firstName, author.lastName].filter(Boolean).join(" ").trim();
  return { authorEmail: author.email, authorName: name || undefined };
}

/** Publish a single scheduled draft with cron-safe rules and notifications. */
async function publishScheduledPost(post: IPostDocument): Promise<ScheduledPublishPostResult> {
  const freshPost = await Post.findById(post._id);
  if (!freshPost) {
    throw new Error(ERROR_MESSAGES.POST_NOT_FOUND);
  }

  const postId = freshPost._id.toString();
  const title = freshPost.title;
  const { authorEmail, authorName } = await loadAuthorForNotification(freshPost.author);

  const scheduledTargets = Array.isArray(freshPost.scheduled_platforms)
    ? freshPost.scheduled_platforms.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : [];
  const credentials = await Credential.find({ author: freshPost.author, is_active: true });
  const matchingCredentials =
    scheduledTargets.length > 0 ? credentials.filter((c) => scheduledTargets.includes(c.platform_name)) : credentials;

  if (matchingCredentials.length === 0) {
    const notification = await notifyScheduledPublishResult({
      postId,
      title,
      authorEmail,
      authorName,
      outcome: "skipped_no_credentials",
      scheduledFor: freshPost.scheduled_for ?? undefined,
    });

    return {
      postId,
      title,
      outcome: "skipped_no_credentials",
      reason: "NO_CREDENTIALS",
      successes: [],
      errors: [],
      notification,
    };
  }

  const { platformUpdates, successes, errors } = await publishToActivePlatforms(freshPost, {
    platforms: scheduledTargets.length > 0 ? scheduledTargets : undefined,
  });

  if (successes.length === 0) {
    const notification = await notifyScheduledPublishResult({
      postId,
      title,
      authorEmail,
      authorName,
      outcome: "failed",
      successes,
      errors,
      scheduledFor: freshPost.scheduled_for ?? undefined,
    });

    return {
      postId,
      title,
      outcome: "failed",
      reason: "ALL_PLATFORMS_FAILED",
      successes,
      errors,
      notification,
    };
  }

  const outcome = errors.length > 0 ? "partial" : "success";

  await Post.findByIdAndUpdate(
    freshPost._id,
    { status: POST_STATUS.PUBLISHED, scheduled_for: null, scheduled_platforms: [], ...platformUpdates },
    { returnDocument: "after", runValidators: true },
  );

  const notification = await notifyScheduledPublishResult({
    postId,
    title,
    authorEmail,
    authorName,
    outcome,
    successes,
    errors,
    scheduledFor: freshPost.scheduled_for ?? undefined,
  });

  return {
    postId,
    title,
    outcome,
    successes,
    errors,
    notification,
  };
}

/** Daily cron batch: find due drafts and publish sequentially. */
export async function publishScheduledPosts(): Promise<PublishScheduledPostsResult> {
  const duePosts = await Post.find(scheduledPublishDueFilter()).sort({ scheduled_for: 1 });
  const batch = duePosts.slice(0, SCHEDULED_PUBLISH_MAX_PER_RUN);
  const truncated = duePosts.length > batch.length;

  const results: ScheduledPublishPostResult[] = [];

  for (const post of batch) {
    try {
      const result = await publishScheduledPost(post);
      results.push(result);
    } catch (error) {
      logger.error(`Scheduled publish failed for post ${post._id}`, error as Error);
      const { authorEmail, authorName } = await loadAuthorForNotification(post.author);
      const notification = await notifyScheduledPublishResult({
        postId: post._id.toString(),
        title: post.title,
        authorEmail,
        authorName,
        outcome: "failed",
        errors: [{ platform: PUBLISH_ERROR_PLATFORM_SYSTEM, error: (error as Error).message }],
        scheduledFor: post.scheduled_for ?? undefined,
      }).catch(() => ({ slack: "failed" as const, email: "failed" as const }));

      results.push({
        postId: post._id.toString(),
        title: post.title,
        outcome: "failed",
        reason: "ALL_PLATFORMS_FAILED",
        successes: [],
        errors: [{ platform: PUBLISH_ERROR_PLATFORM_SYSTEM, error: (error as Error).message }],
        notification,
      });
    }
  }

  if (results.length > 0) {
    cache.invalidatePattern(cacheKeys.posts.all());
  }

  return {
    processed: results.length,
    truncated,
    results,
  };
}

export type { PlatformPublishAction, PlatformPublishResult } from "@types";

export { platformSuccessMessage };
