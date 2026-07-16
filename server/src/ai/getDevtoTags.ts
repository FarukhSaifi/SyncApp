/**
 * High-reach DEV.to tags via the public Forem tags API (ordered by popularity).
 * No curated fallback — callers surface errors to the UI.
 */
import { AI_CONFIG, API_URLS } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

export interface DevtoReachTagsResult {
  tags: string[];
  source: "devto";
  cached: boolean;
  updatedAt: string;
}

type CacheEntry = {
  tags: string[];
  expiresAt: number;
};

let cache: CacheEntry | null = null;

type DevtoTagRow = {
  name?: unknown;
};

function parseTagNames(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    throw new Error("DEV.to tags response was not an array");
  }

  const tags = payload
    .map((row) => {
      const name = (row as DevtoTagRow)?.name;
      return typeof name === "string" ? name.trim().toLowerCase().replace(/^#/, "") : "";
    })
    .filter((name) => AI_CONFIG.DEVTO_TAG_NAME_PATTERN.test(name))
    .slice(0, AI_CONFIG.DEVTO_REACH_TAGS_COUNT);

  // Dedupe while preserving popularity order
  return [...new Set(tags)];
}

async function fetchLiveDevtoTags(): Promise<string[]> {
  const url = new URL(API_URLS.DEVTO.TAGS_ENDPOINT);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", String(AI_CONFIG.DEVTO_REACH_TAGS_COUNT));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": AI_CONFIG.DEVTO_API_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`DEV.to tags HTTP ${response.status}`);
  }

  const body: unknown = await response.json();
  const tags = parseTagNames(body);
  if (tags.length < AI_CONFIG.DEVTO_REACH_TAGS_MIN) {
    throw new Error("DEV.to returned too few usable tags");
  }
  return tags;
}

/**
 * Return top popular DEV.to tags. Uses short TTL cache.
 */
export async function getDevtoReachTags(options: { refresh?: boolean } = {}): Promise<DevtoReachTagsResult> {
  const now = Date.now();
  if (!options.refresh && cache && cache.expiresAt > now) {
    return {
      tags: cache.tags,
      source: "devto",
      cached: true,
      updatedAt: new Date(cache.expiresAt - AI_CONFIG.DEVTO_REACH_TAGS_CACHE_MS).toISOString(),
    };
  }

  try {
    const tags = await fetchLiveDevtoTags();
    cache = {
      tags,
      expiresAt: now + AI_CONFIG.DEVTO_REACH_TAGS_CACHE_MS,
    };
    return {
      tags,
      source: "devto",
      cached: false,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`DEV.to reach tags failed — ${msg.slice(0, 180)}`);
    throw new AppError(ERROR_MESSAGES.AI_DEVTO_TAGS_FAILED, HTTP_STATUS.BAD_GATEWAY);
  }
}
