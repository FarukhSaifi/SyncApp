/**
 * Poll DEV.to for page views / reactions / comments on the user's published articles.
 * Uses the per-user DEV.to API key from credentials (never logged).
 */
import {
  ANALYTICS_PLATFORMS,
  ANALYTICS_SYNC,
  API_URLS,
  ERROR_MESSAGES,
  HTTP,
  HTTP_STATUS,
  PLATFORMS,
} from "@constants";
import { AppError, ValidationError } from "@middleware/errorHandler";
import Credential from "@models/Credential";
import Post from "@models/Post";
import PostAnalyticsSnapshot from "@models/PostAnalyticsSnapshot";
import type { DevtoEngagementMetrics, DevtoEngagementSummary, DevtoEngagementSyncResult } from "@src/types/analytics";
import { decryptCredential } from "@utils/encryption";
import { createLogger } from "@utils/logger";
import { toObjectId } from "@utils/objectId";

const logger = createLogger("DEVTO_ENGAGEMENT");

type DevtoArticlePayload = {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  page_views_count?: unknown;
  page_views?: unknown;
  public_reactions_count?: unknown;
  positive_reactions_count?: unknown;
  comments_count?: unknown;
};

function asNonNegInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.floor(n);
}

function parseArticleMetrics(article: DevtoArticlePayload): DevtoEngagementMetrics | null {
  const idRaw = article.id;
  const remotePostId = idRaw === undefined || idRaw === null ? "" : String(idRaw).trim();
  if (!remotePostId) {
    return null;
  }

  const views = asNonNegInt(article.page_views_count ?? article.page_views);
  const reactions = asNonNegInt(article.public_reactions_count ?? article.positive_reactions_count);
  const comments = asNonNegInt(article.comments_count);

  return {
    remotePostId,
    title: typeof article.title === "string" ? article.title.trim() : "",
    url: typeof article.url === "string" ? article.url.trim() : "",
    views,
    reactions,
    comments,
  };
}

async function resolveDevtoApiKey(userId: string): Promise<string> {
  const credential = await Credential.findOne({
    author: toObjectId(userId),
    platform_name: PLATFORMS["DEVTO"],
    is_active: true,
  }).lean();

  if (!credential) {
    throw new ValidationError(ERROR_MESSAGES["ANALYTICS_DEVTO_CREDENTIALS_MISSING"]);
  }

  const raw = (credential.encrypted_payload || credential.api_key) as string | undefined;
  if (!raw) {
    throw new ValidationError(ERROR_MESSAGES["ANALYTICS_DEVTO_CREDENTIALS_MISSING"]);
  }

  try {
    const decrypted = decryptCredential(raw);
    if (!decrypted.trim()) {
      throw new ValidationError(ERROR_MESSAGES["ANALYTICS_DEVTO_INVALID_KEY"]);
    }
    return decrypted;
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    logger.warn("Failed to decrypt DEV.to credential for engagement sync");
    throw new ValidationError(ERROR_MESSAGES["ANALYTICS_DEVTO_INVALID_KEY"]);
  }
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    [HTTP.HEADERS.API_KEY]: apiKey,
    Accept: HTTP.CONTENT_TYPES.JSON,
    "User-Agent": ANALYTICS_SYNC["USER_AGENT"],
  };
}

async function fetchArticlesMe(apiKey: string): Promise<Map<string, DevtoEngagementMetrics>> {
  const byId = new Map<string, DevtoEngagementMetrics>();

  for (let page = 1; page <= ANALYTICS_SYNC["DEVTO_ME_MAX_PAGES"]; page += 1) {
    const url = new URL(API_URLS.DEVTO.ARTICLES_ME_ENDPOINT);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(ANALYTICS_SYNC["DEVTO_ME_PER_PAGE"]));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: authHeaders(apiKey),
    });

    if (response.status === HTTP_STATUS["UNAUTHORIZED"]) {
      throw new ValidationError(ERROR_MESSAGES["ANALYTICS_DEVTO_INVALID_KEY"]);
    }
    if (!response.ok) {
      throw new AppError(
        `${ERROR_MESSAGES["ANALYTICS_DEVTO_SYNC_FAILED"]} (HTTP ${response.status})`,
        HTTP_STATUS["BAD_GATEWAY"],
      );
    }

    const body: unknown = await response.json();
    if (!Array.isArray(body) || body.length === 0) {
      break;
    }

    for (const row of body) {
      const metrics = parseArticleMetrics(row as DevtoArticlePayload);
      if (metrics) {
        byId.set(metrics.remotePostId, metrics);
      }
    }

    if (body.length < ANALYTICS_SYNC["DEVTO_ME_PER_PAGE"]) {
      break;
    }
  }

  return byId;
}

async function fetchArticleById(apiKey: string, remoteId: string): Promise<DevtoEngagementMetrics | null> {
  const response = await fetch(API_URLS.DEVTO.ARTICLE_BY_ID(remoteId), {
    method: "GET",
    headers: authHeaders(apiKey),
  });

  if (response.status === HTTP_STATUS["UNAUTHORIZED"]) {
    throw new ValidationError(ERROR_MESSAGES["ANALYTICS_DEVTO_INVALID_KEY"]);
  }
  if (response.status === HTTP_STATUS["NOT_FOUND"]) {
    return null;
  }
  if (!response.ok) {
    throw new AppError(
      `${ERROR_MESSAGES["ANALYTICS_DEVTO_SYNC_FAILED"]} (HTTP ${response.status})`,
      HTTP_STATUS["BAD_GATEWAY"],
    );
  }

  const body: unknown = await response.json();
  if (!body || typeof body !== "object") {
    return null;
  }
  return parseArticleMetrics(body as DevtoArticlePayload);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getDevtoEngagementSummary(userId: string): Promise<DevtoEngagementSummary> {
  const snapshots = await PostAnalyticsSnapshot.find({
    author: toObjectId(userId),
    platform: ANALYTICS_PLATFORMS.DEVTO,
  })
    .sort({ views: -1 })
    .lean();

  const posts = snapshots.map((snap) => ({
    postId: String(snap.post),
    title: snap.title || "",
    remotePostId: snap.remote_post_id,
    url: snap.url || "",
    views: snap.views || 0,
    reactions: snap.reactions || 0,
    comments: snap.comments || 0,
    asOf: new Date(snap.as_of).toISOString(),
    fetchedAt: new Date(snap.fetched_at).toISOString(),
  }));

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const totalReactions = posts.reduce((sum, p) => sum + p.reactions, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
  const lastSyncedAt =
    posts.length > 0
      ? posts.reduce((latest, p) => (p.fetchedAt > latest ? p.fetchedAt : latest), posts[0].fetchedAt)
      : null;

  return {
    platform: "devto",
    totalViews,
    totalReactions,
    totalComments,
    articleCount: posts.length,
    lastSyncedAt,
    posts,
  };
}

/**
 * Sync engagement for the authenticated user's DEV.to-published posts.
 */
export async function syncDevtoEngagement(userId: string): Promise<DevtoEngagementSyncResult> {
  const apiKey = await resolveDevtoApiKey(userId);

  const publishedPosts = await Post.find({
    author: toObjectId(userId),
    "platform_status.devto.published": true,
    "platform_status.devto.post_id": { $exists: true, $nin: [null, ""] },
  })
    .select("_id title slug platform_status.devto")
    .limit(ANALYTICS_SYNC["DEVTO_MAX_POSTS_PER_SYNC"])
    .lean();

  if (publishedPosts.length === 0) {
    const summary = await getDevtoEngagementSummary(userId);
    return { synced: 0, skipped: 0, errors: [], summary };
  }

  const meMap = await fetchArticlesMe(apiKey);
  const now = new Date();
  let synced = 0;
  let skipped = 0;
  const errors: Array<{ postId: string; error: string }> = [];

  for (const post of publishedPosts) {
    const postId = String(post._id);
    const remoteId = String(post.platform_status?.devto?.post_id || "").trim();
    if (!remoteId) {
      skipped += 1;
      continue;
    }

    try {
      let metrics = meMap.get(remoteId) || null;
      if (!metrics) {
        await sleep(ANALYTICS_SYNC["DEVTO_FETCH_GAP_MS"]);
        metrics = await fetchArticleById(apiKey, remoteId);
      }
      if (!metrics) {
        skipped += 1;
        continue;
      }

      const storedUrl = (post.platform_status?.devto?.url || metrics.url || "").trim();
      await PostAnalyticsSnapshot.findOneAndUpdate(
        { post: post._id, platform: ANALYTICS_PLATFORMS.DEVTO },
        {
          $set: {
            author: toObjectId(userId),
            post: post._id,
            platform: ANALYTICS_PLATFORMS.DEVTO,
            remote_post_id: remoteId,
            title: metrics.title || post.title || "",
            url: storedUrl,
            views: metrics.views,
            reactions: metrics.reactions,
            comments: metrics.comments,
            as_of: now,
            fetched_at: now,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ postId, error: message.slice(0, 200) });
      logger.warn(`DEV.to engagement sync failed for post ${postId}: ${message.slice(0, 120)}`);
    }
  }

  const summary = await getDevtoEngagementSummary(userId);
  return { synced, skipped, errors, summary };
}

/**
 * Cron: sync DEV.to engagement for every user with an active DEV.to credential.
 */
export async function syncDevtoEngagementForAllUsers(): Promise<{
  usersProcessed: number;
  articlesSynced: number;
  userErrors: Array<{ userId: string; error: string }>;
}> {
  const credentials = await Credential.find({
    platform_name: PLATFORMS["DEVTO"],
    is_active: true,
  })
    .select("author")
    .lean();

  const userIds = [
    ...new Set(credentials.map((c) => String(c.author)).filter(Boolean)),
  ];

  let articlesSynced = 0;
  const userErrors: Array<{ userId: string; error: string }> = [];

  for (const userId of userIds) {
    try {
      const result = await syncDevtoEngagement(userId);
      articlesSynced += result.synced;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      userErrors.push({ userId, error: message.slice(0, 200) });
      logger.warn(`Cron DEV.to engagement sync failed for user ${userId}: ${message.slice(0, 120)}`);
    }
  }

  return {
    usersProcessed: userIds.length,
    articlesSynced,
    userErrors,
  };
}
