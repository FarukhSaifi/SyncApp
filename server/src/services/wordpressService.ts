import {
  API_URLS,
  DEFAULT_VALUES,
  ERROR_MESSAGES,
  extensionForMime,
  FIELDS,
  HTTP,
  PLATFORMS,
  SUCCESS_MESSAGES,
} from "@constants";
import type { ICredentialDocument } from "@models/Credential";
import Credential from "@models/Credential";
import type { IPostDocument } from "@models/Post";
import Post from "@models/Post";
import type { IPlatformStatus, PlatformPublishResult, WordpressLinkMethod } from "@types";
import { decryptCredential } from "@utils/encryption";
import { logger } from "@utils/logger";
import { buildCoverFilename } from "@utils/mediaFilename";
import { wordpressBasicAuthHeaders } from "@utils/wordpressAuth";
import { resolveWordpressHtmlContent } from "@utils/wordpressContent";
import { scrubWordpressErrorMessage } from "@utils/wordpressErrors";
import {
  assertSafeOutboundMediaUrl,
  isSafeOutboundMediaUrl,
  resolveWordpressSiteContext,
  wordpressMediaUrl,
  wordpressPostByIdUrl,
  wordpressPostsUrl,
  wordpressTagsUrl,
  type WordpressSiteContext,
} from "@utils/wordpressUrlPolicy";
import axios from "axios";
import dayjs from "dayjs";

import { WORDPRESS } from "@constants/wordpress";

export interface WordpressCredentialParts {
  siteUrl: string;
  username: string;
  appPassword: string;
  ctx: WordpressSiteContext;
  headers: Record<string, string>;
}

function decryptApiKey(credential: ICredentialDocument): string {
  return decryptCredential(credential.encrypted_payload || credential.api_key);
}

export function resolveWordpressCredentialParts(credential: ICredentialDocument): WordpressCredentialParts {
  const siteUrl =
    credential.site_url || (credential.platform_config as { wordpress_url?: string } | undefined)?.wordpress_url || "";
  if (!siteUrl) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_NOT_CONFIGURED);
  }

  const appPassword = decryptApiKey(credential);
  if (!appPassword) {
    throw new Error(ERROR_MESSAGES.INVALID_WORDPRESS_API_KEY);
  }

  const username = (
    (credential.platform_config as { wordpress_username?: string } | undefined)?.wordpress_username || ""
  ).trim();
  if (!username) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_USERNAME_REQUIRED);
  }

  const ctx = resolveWordpressSiteContext(siteUrl);
  const headers = wordpressBasicAuthHeaders(username, appPassword);
  return { siteUrl: ctx.siteUrl, username, appPassword, ctx, headers };
}

function getWordpressStatus(post: IPostDocument): IPlatformStatus | undefined {
  return (post.platform_status as { wordpress?: IPlatformStatus } | undefined)?.wordpress;
}

function isLinkedToWordpress(post: IPostDocument): boolean {
  const existing = getWordpressStatus(post);
  return Boolean(existing?.published && existing?.post_id);
}

async function resolveWordpressTagIds(
  ctx: WordpressSiteContext,
  headers: Record<string, string>,
  tags: string[] | undefined,
): Promise<number[]> {
  const names = (tags || []).map((t) => t.trim()).filter(Boolean);
  if (names.length === 0) {
    return [];
  }

  const ids: number[] = [];
  for (const name of names) {
    try {
      const search = await axios.get<Array<{ id: number; name: string; slug: string }>>(wordpressTagsUrl(ctx), {
        headers,
        params: { search: name, per_page: 10 },
        timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
      });
      const exact = (search.data || []).find(
        (row) => row.name?.toLowerCase() === name.toLowerCase() || row.slug?.toLowerCase() === name.toLowerCase(),
      );
      if (exact?.id) {
        ids.push(exact.id);
        continue;
      }
      const created = await axios.post<{ id: number }>(
        wordpressTagsUrl(ctx),
        { name },
        { headers, timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS },
      );
      if (typeof created.data?.id === "number") {
        ids.push(created.data.id);
      }
    } catch (err) {
      logger.warn(
        ERROR_MESSAGES.WORDPRESS_MEDIA_UPLOAD_FAILED(
          `tag resolve skipped for "${name}": ${scrubWordpressErrorMessage(err)}`,
        ),
      );
    }
  }
  return ids;
}

function resolveWordpressCoverUrl(post: IPostDocument): string {
  const cover = (post.cover_image || "").trim();
  if (!cover || cover.startsWith(DEFAULT_VALUES.DATA_URL_SCHEME_PREFIX)) {
    return "";
  }
  if (!isSafeOutboundMediaUrl(cover)) {
    return "";
  }
  return cover;
}

export async function uploadWordpressFeaturedMedia(
  ctx: WordpressSiteContext,
  headers: Record<string, string>,
  coverUrl: string,
  post: IPostDocument,
): Promise<number | null> {
  if (!coverUrl || coverUrl.startsWith(DEFAULT_VALUES.DATA_URL_SCHEME_PREFIX)) {
    logger.warn(ERROR_MESSAGES.WORDPRESS_MEDIA_UPLOAD_SKIPPED("data URL or empty cover"));
    return null;
  }

  try {
    assertSafeOutboundMediaUrl(coverUrl);
  } catch (err) {
    logger.warn(ERROR_MESSAGES.WORDPRESS_MEDIA_UPLOAD_SKIPPED(scrubWordpressErrorMessage(err)));
    return null;
  }

  try {
    const imageResponse = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: "arraybuffer",
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
      maxRedirects: WORDPRESS.MEDIA.MAX_REDIRECTS,
      maxContentLength: WORDPRESS.MEDIA.MAX_BYTES,
      maxBodyLength: WORDPRESS.MEDIA.MAX_BYTES,
      beforeRedirect: (redirectOptions) => {
        const protocol = String(redirectOptions.protocol || "").replace(/:$/, "");
        const hostname = String(redirectOptions.hostname || "");
        const path = String(redirectOptions.path || "/");
        const href =
          typeof redirectOptions.href === "string" && redirectOptions.href
            ? redirectOptions.href
            : `${protocol}://${hostname}${path}`;
        assertSafeOutboundMediaUrl(href);
      },
    });

    const buffer = Buffer.from(imageResponse.data);
    if (buffer.byteLength > WORDPRESS.MEDIA.MAX_BYTES) {
      logger.warn(ERROR_MESSAGES.WORDPRESS_MEDIA_UPLOAD_SKIPPED(ERROR_MESSAGES.WORDPRESS_MEDIA_TOO_LARGE));
      return null;
    }

    const rawContentType = imageResponse.headers[HTTP.HEADERS.CONTENT_TYPE.toLowerCase()];
    const contentTypeHeader = Array.isArray(rawContentType) ? rawContentType[0] : rawContentType;
    const contentType =
      typeof contentTypeHeader === "string" && contentTypeHeader.trim()
        ? contentTypeHeader.split(";")[0].trim()
        : DEFAULT_VALUES.MIME_IMAGE_JPEG;

    if (!contentType.startsWith(WORDPRESS.MEDIA.ALLOWED_MIME_PREFIX)) {
      logger.warn(ERROR_MESSAGES.WORDPRESS_MEDIA_UPLOAD_SKIPPED(ERROR_MESSAGES.WORDPRESS_MEDIA_TYPE_INVALID));
      return null;
    }

    const ext = extensionForMime(contentType);
    const filename = buildCoverFilename({
      slug: post.slug,
      title: post.title,
      postId: post._id ? String(post._id) : undefined,
      ext,
    });

    const mediaResponse = await axios.post<{ id?: number }>(wordpressMediaUrl(ctx), buffer, {
      headers: {
        ...headers,
        [HTTP.HEADERS.CONTENT_TYPE]: contentType,
        [HTTP.HEADERS.CONTENT_DISPOSITION]: API_URLS.WORDPRESS.MEDIA_CONTENT_DISPOSITION(filename),
      },
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
      maxBodyLength: WORDPRESS.MEDIA.MAX_BYTES,
    });

    const mediaId = mediaResponse.data?.id;
    if (typeof mediaId !== "number" || !Number.isFinite(mediaId)) {
      logger.warn(ERROR_MESSAGES.WORDPRESS_MEDIA_UPLOAD_FAILED("media response missing id"));
      return null;
    }
    return mediaId;
  } catch (err) {
    logger.warn(ERROR_MESSAGES.WORDPRESS_MEDIA_UPLOAD_FAILED(scrubWordpressErrorMessage(err)));
    return null;
  }
}

async function buildWordpressPostPayload(
  post: IPostDocument,
  parts: WordpressCredentialParts,
  options: { status: string; includeCover: boolean },
): Promise<Record<string, unknown>> {
  const tagIds = await resolveWordpressTagIds(parts.ctx, parts.headers, post.tags);
  const payload: Record<string, unknown> = {
    title: post.title,
    content: resolveWordpressHtmlContent(post.content_markdown || ""),
    status: options.status,
  };
  if (tagIds.length > 0) {
    payload.tags = tagIds;
  }

  if (options.includeCover) {
    const coverUrl = resolveWordpressCoverUrl(post);
    if (coverUrl) {
      const mediaId = await uploadWordpressFeaturedMedia(parts.ctx, parts.headers, coverUrl, post);
      if (mediaId !== null) {
        payload.featured_media = mediaId;
      }
    }
  }

  return payload;
}

/**
 * Publish or update WordPress. First create uses draft; updates of linked posts use publish.
 * Idempotent: if post_id already set, always PUT (never double-create).
 */
export async function publishToWordpress(
  post: IPostDocument,
  credential: ICredentialDocument,
): Promise<PlatformPublishResult> {
  const parts = resolveWordpressCredentialParts(credential);
  const existing = getWordpressStatus(post);

  // Create idempotency — re-read latest link from DB when possible
  let remoteId = existing?.post_id;
  if ((!remoteId || remoteId === WORDPRESS.CREATING_POST_ID) && post._id) {
    const fresh = await Post.findById(post._id).select("platform_status.wordpress").lean();
    remoteId = (fresh as { platform_status?: { wordpress?: { post_id?: string } } } | null)?.platform_status?.wordpress
      ?.post_id;
  }

  if (remoteId === WORDPRESS.CREATING_POST_ID) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_PUBLISH_IN_PROGRESS);
  }

  const isUpdate = Boolean(remoteId);
  const status = isUpdate ? WORDPRESS.LIVE_STATUS : WORDPRESS.CREATE_STATUS;
  const payload = await buildWordpressPostPayload(post, parts, { status, includeCover: true });

  if (isUpdate && remoteId) {
    const publishResponse = await axios.put(wordpressPostByIdUrl(parts.ctx, remoteId), payload, {
      headers: parts.headers,
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
    });
    return {
      updates: {
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
        [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: String(publishResponse.data.id),
        [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: publishResponse.data.link,
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: existing?.published_at ?? dayjs().toDate(),
        [FIELDS.PLATFORM_STATUS_FIELDS.LINK_METHOD(PLATFORMS.WORDPRESS)]:
          existing?.link_method || WORDPRESS.LINK_METHODS.CREATED,
        [FIELDS.PLATFORM_STATUS_FIELDS.LINKED_AT(PLATFORMS.WORDPRESS)]: existing?.linked_at ?? dayjs().toDate(),
      },
      action: "update",
    };
  }

  // Claim create slot optimistically to reduce duplicate creates under race
  if (post._id) {
    const claimed = await Post.findOneAndUpdate(
      {
        _id: post._id,
        $or: [
          { "platform_status.wordpress.post_id": { $exists: false } },
          { "platform_status.wordpress.post_id": null },
          { "platform_status.wordpress.post_id": "" },
        ],
      },
      {
        $set: {
          "platform_status.wordpress.published": false,
          "platform_status.wordpress.post_id": WORDPRESS.CREATING_POST_ID,
        },
      },
      { returnDocument: "after" },
    );
    if (!claimed) {
      const again = await Post.findById(post._id).select("platform_status.wordpress").lean();
      const id = (again as { platform_status?: { wordpress?: { post_id?: string } } } | null)?.platform_status
        ?.wordpress?.post_id;
      if (id === WORDPRESS.CREATING_POST_ID) {
        throw new Error(ERROR_MESSAGES.WORDPRESS_PUBLISH_IN_PROGRESS);
      }
      if (id) {
        const publishResponse = await axios.put(wordpressPostByIdUrl(parts.ctx, id), payload, {
          headers: parts.headers,
          timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
        });
        return {
          updates: {
            [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
            [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: String(publishResponse.data.id),
            [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: publishResponse.data.link,
            [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
            [FIELDS.PLATFORM_STATUS_FIELDS.LINK_METHOD(PLATFORMS.WORDPRESS)]: WORDPRESS.LINK_METHODS.CREATED,
            [FIELDS.PLATFORM_STATUS_FIELDS.LINKED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
          },
          action: "update",
        };
      }
    }
  }

  try {
    const publishResponse = await axios.post(wordpressPostsUrl(parts.ctx), payload, {
      headers: parts.headers,
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
    });
    return {
      updates: {
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
        [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: String(publishResponse.data.id),
        [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: publishResponse.data.link,
        [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
        [FIELDS.PLATFORM_STATUS_FIELDS.LINK_METHOD(PLATFORMS.WORDPRESS)]: WORDPRESS.LINK_METHODS.CREATED,
        [FIELDS.PLATFORM_STATUS_FIELDS.LINKED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
      },
      action: "create",
    };
  } catch (err) {
    if (post._id) {
      await Post.updateOne(
        { _id: post._id, "platform_status.wordpress.post_id": WORDPRESS.CREATING_POST_ID },
        { $unset: { "platform_status.wordpress.post_id": 1 } },
      );
    }
    throw new Error(scrubWordpressErrorMessage(err as Error), { cause: err });
  }
}

export async function syncPublishedPostToWordpress(post: IPostDocument, authorId: string): Promise<boolean> {
  const postId = String(post._id || "");
  try {
    if (!isLinkedToWordpress(post)) {
      return false;
    }
    const credential = await Credential.findOne({
      platform_name: PLATFORMS.WORDPRESS,
      author: authorId,
      is_active: true,
    });
    if (!credential) {
      logger.warn(`${ERROR_MESSAGES.WORDPRESS_SYNC_SKIPPED_NO_CREDENTIAL} (post ${postId})`);
      return false;
    }
    await publishToWordpress(post, credential);
    logger.info(SUCCESS_MESSAGES.WORDPRESS_POST_SYNCED(postId));
    return true;
  } catch (err) {
    logger.warn(ERROR_MESSAGES.WORDPRESS_SYNC_FAILED(scrubWordpressErrorMessage(err)));
    return false;
  }
}

export interface WordpressSearchCandidate {
  id: number;
  title: string;
  slug: string;
  link: string;
  date: string;
  match: "slug" | "title";
}

export async function searchWordpressPostsForLink(
  authorId: string,
  options: { slug?: string; title?: string },
): Promise<WordpressSearchCandidate[]> {
  const credential = await Credential.findOne({
    platform_name: PLATFORMS.WORDPRESS,
    author: authorId,
    is_active: true,
  });
  if (!credential) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SYNC_SKIPPED_NO_CREDENTIAL);
  }
  const parts = resolveWordpressCredentialParts(credential);
  const candidates: WordpressSearchCandidate[] = [];
  const seen = new Set<number>();

  const pushRows = (
    rows: Array<{ id: number; slug?: string; link?: string; date?: string; title?: { rendered?: string } }>,
    match: "slug" | "title",
  ) => {
    for (const row of rows) {
      if (!row?.id || seen.has(row.id)) {
        continue;
      }
      seen.add(row.id);
      candidates.push({
        id: row.id,
        title: row.title?.rendered || "",
        slug: row.slug || "",
        link: row.link || "",
        date: row.date || "",
        match,
      });
    }
  };

  if (options.slug) {
    const bySlug = await axios.get(wordpressPostsUrl(parts.ctx), {
      headers: parts.headers,
      params: { slug: options.slug, per_page: WORDPRESS.SEARCH.MAX_CANDIDATES },
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
    });
    pushRows(Array.isArray(bySlug.data) ? bySlug.data : [], "slug");
  }

  if (options.title && candidates.length === 0) {
    const byTitle = await axios.get(wordpressPostsUrl(parts.ctx), {
      headers: parts.headers,
      params: { search: options.title, per_page: WORDPRESS.SEARCH.MAX_CANDIDATES },
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
    });
    pushRows(Array.isArray(byTitle.data) ? byTitle.data : [], "title");
  }

  return candidates.slice(0, WORDPRESS.SEARCH.MAX_CANDIDATES);
}

export async function linkExistingWordpressPost(
  authorId: string,
  syncAppPostId: string,
  remotePostId: string,
  confirm: boolean,
  linkMethod: Exclude<WordpressLinkMethod, typeof WORDPRESS.LINK_METHODS.CREATED> = WORDPRESS.LINK_METHODS.MANUAL,
): Promise<Record<string, unknown>> {
  if (!confirm) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_LINK_CONFIRM_REQUIRED);
  }
  if (!remotePostId || remotePostId === WORDPRESS.CREATING_POST_ID) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_LINK_REMOTE_ID_REQUIRED);
  }

  const conflict = await Post.findOne({
    author: authorId,
    _id: { $ne: syncAppPostId },
    "platform_status.wordpress.post_id": remotePostId,
  })
    .select("_id title")
    .lean();
  if (conflict) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_LINK_CONFLICT);
  }

  const credential = await Credential.findOne({
    platform_name: PLATFORMS.WORDPRESS,
    author: authorId,
    is_active: true,
  });
  if (!credential) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SYNC_SKIPPED_NO_CREDENTIAL);
  }
  const parts = resolveWordpressCredentialParts(credential);

  let remote: { id: number; link?: string };
  try {
    const res = await axios.get(wordpressPostByIdUrl(parts.ctx, remotePostId), {
      headers: parts.headers,
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
    });
    remote = res.data;
  } catch (err) {
    throw new Error(`${ERROR_MESSAGES.WORDPRESS_LINK_NOT_FOUND}: ${scrubWordpressErrorMessage(err as Error)}`, {
      cause: err,
    });
  }

  const updates = {
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED(PLATFORMS.WORDPRESS)]: true,
    [FIELDS.PLATFORM_STATUS_FIELDS.POST_ID(PLATFORMS.WORDPRESS)]: String(remote.id),
    [FIELDS.PLATFORM_STATUS_FIELDS.URL(PLATFORMS.WORDPRESS)]: remote.link || "",
    [FIELDS.PLATFORM_STATUS_FIELDS.PUBLISHED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
    [FIELDS.PLATFORM_STATUS_FIELDS.LINK_METHOD(PLATFORMS.WORDPRESS)]: linkMethod,
    [FIELDS.PLATFORM_STATUS_FIELDS.LINKED_AT(PLATFORMS.WORDPRESS)]: dayjs().toDate(),
  };

  const updated = await Post.findOneAndUpdate(
    { _id: syncAppPostId, author: authorId },
    { $set: updates },
    { returnDocument: "after" },
  );
  if (!updated) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_LINK_NOT_FOUND);
  }

  logger.info(SUCCESS_MESSAGES.WORDPRESS_POST_LINKED(syncAppPostId, String(remote.id)));
  return updates;
}

/** In-memory rate limit for test-connection (per user). */
const testConnectionHits = new Map<string, { count: number; resetAt: number }>();

export function resetWordpressTestConnectionRateLimitForTests(): void {
  testConnectionHits.clear();
}

export async function testWordpressConnection(authorId: string): Promise<{ ok: true; siteUrl: string }> {
  const now = Date.now();
  const bucket = testConnectionHits.get(authorId);
  if (bucket && bucket.resetAt > now && bucket.count >= WORDPRESS.TEST_CONNECTION.MAX_PER_WINDOW) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_TEST_RATE_LIMITED);
  }
  if (!bucket || bucket.resetAt <= now) {
    testConnectionHits.set(authorId, { count: 1, resetAt: now + WORDPRESS.TEST_CONNECTION.WINDOW_MS });
  } else {
    bucket.count += 1;
  }

  const credential = await Credential.findOne({
    platform_name: PLATFORMS.WORDPRESS,
    author: authorId,
    is_active: true,
  });
  if (!credential) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SYNC_SKIPPED_NO_CREDENTIAL);
  }

  try {
    const parts = resolveWordpressCredentialParts(credential);
    await axios.get(wordpressPostsUrl(parts.ctx), {
      headers: parts.headers,
      params: { per_page: 1, status: "any" },
      timeout: WORDPRESS.MEDIA.FETCH_TIMEOUT_MS,
    });
    logger.info(SUCCESS_MESSAGES.WORDPRESS_CONNECTION_TESTED);
    return { ok: true, siteUrl: parts.siteUrl };
  } catch (err) {
    const scrubbed = scrubWordpressErrorMessage(err);
    logger.warn(`${ERROR_MESSAGES.WORDPRESS_TEST_FAILED}: ${scrubbed}`);
    throw new Error(ERROR_MESSAGES.WORDPRESS_TEST_FAILED, { cause: err });
  }
}
