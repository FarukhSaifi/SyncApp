/**
 * Real-time trending blog topics + Google SEO keywords via AI Studio + Search grounding.
 * Throws AppError when search/quota is unavailable so the client can show an error.
 * (Google Ads Keyword Planner is not used — requires Ads account; Search grounding is Studio-native.)
 */
import { AI_CONFIG, AI_PROMPTS } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { sanitizeJsonString } from "../utils/sanitizeJson";
import { buildModelCandidates, getModelName, getText, hasStudioKey, studioGenerateContent } from "./client";
import { isFallbackWorthyError } from "./errors";
import { withRetry } from "./retries";

export type TrendingTopicsSource = "google_search";

export interface TrendingTopicsResult {
  topics: string[];
  keywords: string[];
  source: TrendingTopicsSource;
  cached: boolean;
  updatedAt: string;
}

type ParsedTrending = {
  topics: string[];
  keywords: string[];
};

type CacheEntry = {
  topics: string[];
  keywords: string[];
  source: TrendingTopicsSource;
  expiresAt: number;
};

let cache: CacheEntry | null = null;

function cleanPhrase(value: unknown, maxLen: number): string {
  return String(value)
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^["']|["']$/g, "")
    .slice(0, maxLen);
}

function parseTrendingPayload(rawText: string): ParsedTrending {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const attempts = [stripped, sanitizeJsonString(stripped)];
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) attempts.push(sanitizeJsonString(jsonMatch[0]));

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as { topics?: unknown; keywords?: unknown };
      if (!Array.isArray(parsed.topics)) continue;

      const topics = parsed.topics
        .map((t) => cleanPhrase(t, AI_CONFIG.TOPIC_MAX_LEN))
        .filter((t) => t.length >= AI_CONFIG.TOPIC_MIN_LEN && t.length <= AI_CONFIG.TOPIC_MAX_LEN)
        .slice(0, AI_CONFIG.TRENDING_TOPICS_COUNT);

      const keywords = Array.isArray(parsed.keywords)
        ? parsed.keywords
            .map((k) => cleanPhrase(k, AI_CONFIG.KEYWORD_MAX_LEN).toLowerCase())
            .filter((k) => k.length >= AI_CONFIG.KEYWORD_MIN_LEN && k.length <= AI_CONFIG.KEYWORD_MAX_LEN)
            .slice(0, AI_CONFIG.GOOGLE_KEYWORDS_COUNT)
        : [];

      if (
        topics.length >= AI_CONFIG.TRENDING_PARSE_MIN_ITEMS &&
        keywords.length >= AI_CONFIG.TRENDING_PARSE_MIN_ITEMS
      ) {
        return { topics, keywords };
      }
    } catch {
      // try next
    }
  }

  throw new Error("unparseable trending topics");
}

async function fetchLiveTrending(): Promise<ParsedTrending> {
  const candidates = buildModelCandidates(getModelName());
  let lastError: unknown;

  for (const modelName of candidates) {
    try {
      // Prefer Google Search grounding for real-time signals.
      try {
        const grounded = await withRetry(
          () =>
            studioGenerateContent({
              model: modelName,
              contents: AI_PROMPTS.TRENDING_TOPICS_USER,
              systemInstruction: AI_PROMPTS.TRENDING_TOPICS_SYSTEM,
              maxOutputTokens: AI_CONFIG.MAX_TRENDING_TOPICS_TOKENS,
              temperature: AI_CONFIG.TEMPERATURE_EDIT,
              tools: [{ googleSearch: {} }],
            }),
          { attempts: 1 },
        );
        return parseTrendingPayload(getText(grounded));
      } catch {
        // Grounding may be blocked or conflict with free-tier — try without tools.
      }

      const plain = await withRetry(
        () =>
          studioGenerateContent({
            model: modelName,
            contents: AI_PROMPTS.TRENDING_TOPICS_USER,
            systemInstruction: AI_PROMPTS.TRENDING_TOPICS_SYSTEM,
            maxOutputTokens: AI_CONFIG.MAX_TRENDING_TOPICS_TOKENS,
            temperature: AI_CONFIG.TEMPERATURE_EDIT,
            responseMimeType: "application/json",
          }),
        { attempts: 1 },
      );
      return parseTrendingPayload(getText(plain));
    } catch (err) {
      lastError = err;
      if (!isFallbackWorthyError(err)) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Return 6 trending topics + 8 Google SEO keywords. Uses short TTL cache.
 */
export async function getTrendingTopics(options: { refresh?: boolean } = {}): Promise<TrendingTopicsResult> {
  const now = Date.now();
  if (!options.refresh && cache && cache.expiresAt > now) {
    return {
      topics: cache.topics,
      keywords: cache.keywords,
      source: cache.source,
      cached: true,
      updatedAt: new Date(cache.expiresAt - AI_CONFIG.TRENDING_TOPICS_CACHE_MS).toISOString(),
    };
  }

  if (!hasStudioKey()) {
    throw new AppError(ERROR_MESSAGES.AI_TRENDING_TOPICS_FAILED, HTTP_STATUS.BAD_GATEWAY);
  }

  try {
    const { topics, keywords } = await fetchLiveTrending();
    const source: TrendingTopicsSource = "google_search";
    cache = {
      topics,
      keywords,
      source,
      expiresAt: now + AI_CONFIG.TRENDING_TOPICS_CACHE_MS,
    };
    return {
      topics,
      keywords,
      source,
      cached: false,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`Trending topics failed — ${msg.slice(0, 180)}`);
    throw new AppError(ERROR_MESSAGES.AI_TRENDING_TOPICS_FAILED, HTTP_STATUS.BAD_GATEWAY);
  }
}
