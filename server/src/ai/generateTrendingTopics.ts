/**
 * Real-time trending blog topics + Google SEO keywords via Vertex AI (preferred) or Studio + Search grounding.
 * Throws AppError when search/quota is unavailable so the client can show an error.
 */
import { AI_CONFIG, AI_PROMPTS, AI_PROVIDERS, AI_SEED_TOPIC_CATEGORIES, AI_SUGGESTION_SOURCES } from "@constants";
import { AppError } from "@middleware/errorHandler";
import type { ParsedTrending, TrendingCacheEntry, TrendingTopicsResult, TrendingTopicsSource } from "@types";
import { logger } from "@utils/logger";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

import {
  buildModelCandidates,
  generateAiContent,
  getModelName,
  getText,
  hasAiConfigured,
  resolveAiProvider,
} from "./client";
import { isCreditsDepletedError, isFallbackWorthyError } from "./errors";
import { fetchGoogleSearchSuggestions } from "./googleSuggest";
import { buildJsonParseAttempts, cleanPhrase } from "./parseHelpers";
import { withRetry } from "./retries";

export type { TrendingTopicsResult, TrendingTopicsSource };

let cache: TrendingCacheEntry | null = null;

function getRandomSeeds(): string[] {
  const shuffled = [...AI_SEED_TOPIC_CATEGORIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, AI_CONFIG["TRENDING_SEED_CATEGORY_COUNT"]).flat();
}

function parseTrendingPayload(rawText: string): ParsedTrending {
  for (const candidate of buildJsonParseAttempts(rawText)) {
    try {
      const parsed = JSON.parse(candidate) as { topics?: unknown; keywords?: unknown };
      if (!Array.isArray(parsed.topics)) {
        continue;
      }

      const topics = parsed.topics
        .map((t) => cleanPhrase(t, AI_CONFIG["TOPIC_MAX_LEN"]))
        .filter((t) => t.length >= AI_CONFIG["TOPIC_MIN_LEN"] && t.length <= AI_CONFIG["TOPIC_MAX_LEN"])
        .slice(0, AI_CONFIG["TRENDING_TOPICS_COUNT"]);

      const rawKeywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      const keywords = rawKeywords
        .map((k) => cleanPhrase(k, AI_CONFIG["KEYWORD_MAX_LEN"]).toLowerCase())
        .filter((k) => k.length >= AI_CONFIG["KEYWORD_MIN_LEN"] && k.length <= AI_CONFIG["KEYWORD_MAX_LEN"])
        .slice(0, AI_CONFIG["GOOGLE_KEYWORDS_COUNT"]);

      if (topics.length > 0) {
        return { topics: [...new Set(topics)], keywords: [...new Set(keywords)] };
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(ERROR_MESSAGES.AI_TRENDING_PARSE_FAILED);
}

/**
 * Fetch fresh real-time search queries from Google Search suggestions for developers.
 */
async function getLiveDeveloperSearchContext(): Promise<string> {
  const seeds = getRandomSeeds();
  const suggestions = await Promise.all(seeds.map((s) => fetchGoogleSearchSuggestions(s)));
  const allSuggestions = [...new Set(suggestions.flat())].filter(
    (s) => s.length > AI_CONFIG["TOPIC_MIN_LEN"] && s.length < AI_CONFIG["KEYWORD_MAX_LEN"],
  );

  if (allSuggestions.length === 0) {
    return "";
  }
  const sampled = allSuggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, AI_CONFIG["TRENDING_AUTOCOMPLETE_SAMPLE_MAX"]);
  return `Real-time search queries developers are actively typing into Google right now:\n${sampled.map((s) => `- "${s}"`).join("\n")}\n\n`;
}

/**
 * Request real-time trending topics and keywords from the active AI provider.
 */
async function fetchTrendingFromModel(): Promise<ParsedTrending> {
  const liveSearchContext = await getLiveDeveloperSearchContext();
  const providerLabel =
    resolveAiProvider() === AI_PROVIDERS.VERTEX ? AI_CONFIG.PROVIDER_LABEL_VERTEX : AI_CONFIG["PROVIDER_LABEL_STUDIO"];

  const systemInstruction = AI_PROMPTS.TRENDING_TOPICS_SYSTEM(liveSearchContext);
  const userPrompt = AI_PROMPTS.TRENDING_TOPICS_USER;

  const candidates = buildModelCandidates(getModelName());
  let lastError: unknown;

  for (const modelName of candidates) {
    try {
      try {
        const grounded = await withRetry(
          () =>
            generateAiContent({
              model: modelName,
              contents: userPrompt,
              systemInstruction,
              maxOutputTokens: AI_CONFIG["MAX_TRENDING_TOPICS_TOKENS"],
              temperature: AI_CONFIG["TEMPERATURE_TRENDING"],
              tools: [{ googleSearch: {} }],
            }),
          { attempts: AI_CONFIG["RETRY_ATTEMPTS_ONCE"] },
        );
        const parsed = parseTrendingPayload(getText(grounded));
        if (parsed.topics.length >= AI_CONFIG["TRENDING_PARSE_MIN_ITEMS"]) {
          logger.info(`Fetched real-time trending topics via ${providerLabel} Google Search Grounding (${modelName})`);
          return parsed;
        }
      } catch (groundingErr) {
        if (isCreditsDepletedError(groundingErr)) {
          throw groundingErr;
        }
      }

      const plain = await withRetry(
        () =>
          generateAiContent({
            model: modelName,
            contents: userPrompt,
            systemInstruction,
            maxOutputTokens: AI_CONFIG["MAX_TRENDING_TOPICS_TOKENS"],
            temperature: AI_CONFIG["TEMPERATURE_TRENDING"],
            responseMimeType: AI_CONFIG["RESPONSE_MIME_JSON"],
          }),
        { attempts: AI_CONFIG["RETRY_ATTEMPTS_ONCE"] },
      );
      return parseTrendingPayload(getText(plain));
    } catch (err) {
      lastError = err;
      if (isCreditsDepletedError(err) || !isFallbackWorthyError(err)) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Return 6 trending topics + 8 Google SEO keywords. Uses a short in-memory TTL;
 * pass `{ refresh: true }` (query `?refresh=1`) to always hit the live AI provider.
 */
export async function getTrendingTopics(options: { refresh?: boolean } = {}): Promise<TrendingTopicsResult> {
  const now = Date.now();
  if (!options.refresh && cache && cache.expiresAt > now) {
    return {
      topics: cache.topics,
      keywords: cache.keywords,
      source: cache.source,
      cached: true,
      updatedAt: new Date(cache.fetchedAt).toISOString(),
    };
  }

  if (!hasAiConfigured()) {
    throw new AppError(
      `${ERROR_MESSAGES["AI_PROVIDER_REQUIRED"]}${ERROR_MESSAGES["AI_TRENDING_REQUIRES_PROVIDER"]}`,
      HTTP_STATUS["SERVICE_UNAVAILABLE"],
    );
  }

  try {
    const parsed = await fetchTrendingFromModel();
    const fetchedAt = Date.now();
    cache = {
      topics: parsed.topics,
      keywords: parsed.keywords,
      source: AI_SUGGESTION_SOURCES.GOOGLE_SEARCH,
      fetchedAt,
      expiresAt: fetchedAt + AI_CONFIG["TRENDING_TOPICS_CACHE_MS"],
    };
    return {
      topics: parsed.topics,
      keywords: parsed.keywords,
      source: AI_SUGGESTION_SOURCES.GOOGLE_SEARCH,
      cached: false,
      updatedAt: new Date(fetchedAt).toISOString(),
    };
  } catch (err) {
    const msg = (err as Error).message || String(err);
    logger.warn(
      `Trending topics fetch failed (${resolveAiProvider()}): ${msg.slice(0, AI_CONFIG["AI_ERROR_LOG_MAX_CHARS"])}`,
    );

    if (cache && cache.topics.length > 0) {
      logger.warn(`Trending topics refresh failed, using stale cache: ${msg}`);
      return {
        topics: cache.topics,
        keywords: cache.keywords,
        source: cache.source,
        cached: true,
        updatedAt: new Date(cache.fetchedAt).toISOString(),
      };
    }

    if (isCreditsDepletedError(err)) {
      throw new AppError(ERROR_MESSAGES["AI_CREDITS_DEPLETED"], HTTP_STATUS["PAYMENT_REQUIRED"]);
    }

    if (AI_CONFIG["ERR_RATE_LIMIT_PATTERN"].test(msg)) {
      throw new AppError(ERROR_MESSAGES["AI_RATE_LIMITED"], HTTP_STATUS["TOO_MANY_REQUESTS"]);
    }

    throw new AppError(ERROR_MESSAGES["AI_TRENDING_FETCH_FAILED"], HTTP_STATUS["SERVICE_UNAVAILABLE"]);
  }
}
