/**
 * Seeded keyword research: high commercial intent × low competition long-tail
 * via Vertex/Studio + Google Search grounding. Scores are AI estimates.
 */
import { AI_CONFIG, AI_PROMPTS, AI_PROVIDERS, AI_SUGGESTION_SOURCES } from "@constants";
import { AppError } from "@middleware/errorHandler";
import type { KeywordResearchCacheEntry, KeywordResearchItem, KeywordResearchResult } from "@types";
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
import {
  buildJsonParseAttempts,
  clampKeywordScore,
  cleanPhrase,
  deriveOpportunityScore,
  parseIntentLabel,
} from "./parseHelpers";
import { withRetry } from "./retries";

/** In-memory cache keyed by normalized seed. */
const cacheBySeed = new Map<string, KeywordResearchCacheEntry>();

function normalizeSeed(seed: string): string {
  return seed.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseKeywordResearchPayload(rawText: string): KeywordResearchItem[] {
  for (const candidate of buildJsonParseAttempts(rawText)) {
    try {
      const parsed = JSON.parse(candidate) as { keywords?: unknown };
      if (!Array.isArray(parsed.keywords)) {
        continue;
      }

      const items: KeywordResearchItem[] = [];
      const seen = new Set<string>();

      for (const row of parsed.keywords) {
        if (!row || typeof row !== "object") {
          continue;
        }
        const obj = row as Record<string, unknown>;
        const keyword = cleanPhrase(obj.keyword, AI_CONFIG["KEYWORD_MAX_LEN"]).toLowerCase();
        if (
          keyword.length < AI_CONFIG["KEYWORD_MIN_LEN"] ||
          keyword.length > AI_CONFIG["KEYWORD_MAX_LEN"] ||
          seen.has(keyword)
        ) {
          continue;
        }
        seen.add(keyword);

        const commercialIntent = clampKeywordScore(obj.commercialIntent);
        const competition = clampKeywordScore(obj.competition);
        const rawOpportunity = obj.opportunityScore;
        const opportunityScore =
          rawOpportunity === undefined || rawOpportunity === null || rawOpportunity === ""
            ? deriveOpportunityScore(commercialIntent, competition)
            : clampKeywordScore(rawOpportunity);

        items.push({
          keyword,
          commercialIntent,
          competition,
          opportunityScore,
          intentLabel: parseIntentLabel(obj.intentLabel),
          monetizationAngle: cleanPhrase(obj.monetizationAngle, AI_CONFIG["MONETIZATION_ANGLE_MAX_LEN"]),
          rationale: cleanPhrase(obj.rationale, AI_CONFIG["RATIONALE_MAX_LEN"]),
        });

        if (items.length >= AI_CONFIG["KEYWORD_RESEARCH_COUNT"]) {
          break;
        }
      }

      if (items.length > 0) {
        return items.sort((a, b) => b.opportunityScore - a.opportunityScore);
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(ERROR_MESSAGES.AI_KEYWORD_RESEARCH_PARSE_FAILED);
}

async function getAutocompleteContext(seed: string): Promise<string> {
  const suggestions = await fetchGoogleSearchSuggestions(seed);
  const filtered = [...new Set(suggestions)]
    .map((s) => s.trim())
    .filter((s) => s.length >= AI_CONFIG["KEYWORD_MIN_LEN"] && s.length <= AI_CONFIG["KEYWORD_MAX_LEN"])
    .slice(0, AI_CONFIG["KEYWORD_RESEARCH_AUTOCOMPLETE_MAX"]);

  if (filtered.length === 0) {
    return "";
  }
  return `Live Google autocomplete suggestions for this seed:\n${filtered.map((s) => `- "${s}"`).join("\n")}\n\n`;
}

async function fetchKeywordResearchFromModel(seed: string): Promise<KeywordResearchItem[]> {
  const autocompleteContext = await getAutocompleteContext(seed);
  const providerLabel =
    resolveAiProvider() === AI_PROVIDERS.VERTEX ? AI_CONFIG.PROVIDER_LABEL_VERTEX : AI_CONFIG["PROVIDER_LABEL_STUDIO"];

  const systemInstruction = AI_PROMPTS.KEYWORD_RESEARCH_SYSTEM;
  const userPrompt = AI_PROMPTS.KEYWORD_RESEARCH_USER(seed, autocompleteContext);
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
              maxOutputTokens: AI_CONFIG["MAX_KEYWORD_RESEARCH_TOKENS"],
              temperature: AI_CONFIG["TEMPERATURE_KEYWORD_RESEARCH"],
              tools: [{ googleSearch: {} }],
            }),
          { attempts: AI_CONFIG["RETRY_ATTEMPTS_ONCE"] },
        );
        const parsed = parseKeywordResearchPayload(getText(grounded));
        if (parsed.length >= AI_CONFIG["KEYWORD_RESEARCH_PARSE_MIN_ITEMS"]) {
          logger.info(
            `Keyword research via ${providerLabel} Google Search Grounding (${modelName}) for seed="${seed}"`,
          );
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
            maxOutputTokens: AI_CONFIG["MAX_KEYWORD_RESEARCH_TOKENS"],
            temperature: AI_CONFIG["TEMPERATURE_KEYWORD_RESEARCH"],
            responseMimeType: AI_CONFIG["RESPONSE_MIME_JSON"],
          }),
        { attempts: AI_CONFIG["RETRY_ATTEMPTS_ONCE"] },
      );
      return parseKeywordResearchPayload(getText(plain));
    } catch (err) {
      lastError = err;
      if (isCreditsDepletedError(err) || !isFallbackWorthyError(err)) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function validateSeed(seed: unknown): string {
  if (!seed || typeof seed !== "string" || !seed.trim()) {
    throw new AppError(ERROR_MESSAGES["AI_SEED_REQUIRED"], HTTP_STATUS.BAD_REQUEST);
  }
  const trimmed = seed.trim().replace(/\s+/g, " ");
  if (trimmed.length < AI_CONFIG["SEED_MIN_LEN"]) {
    throw new AppError(ERROR_MESSAGES["AI_SEED_TOO_SHORT"], HTTP_STATUS.BAD_REQUEST);
  }
  if (trimmed.length > AI_CONFIG["SEED_MAX_LEN"]) {
    throw new AppError(ERROR_MESSAGES["AI_SEED_TOO_LONG"], HTTP_STATUS.BAD_REQUEST);
  }
  return trimmed;
}

/**
 * Expand a broad seed into scored long-tail keywords (commercial intent × low competition).
 */
export async function generateKeywordResearch(
  seedInput: string,
  options: { refresh?: boolean } = {},
): Promise<KeywordResearchResult> {
  const seed = validateSeed(seedInput);
  const cacheKey = normalizeSeed(seed);
  const now = Date.now();

  if (!options.refresh) {
    const hit = cacheBySeed.get(cacheKey);
    if (hit && hit.expiresAt > now) {
      return {
        seed,
        keywords: hit.keywords,
        source: hit.source,
        cached: true,
        updatedAt: new Date(hit.fetchedAt).toISOString(),
        scoresEstimated: true,
      };
    }
  }

  if (!hasAiConfigured()) {
    throw new AppError(
      `${ERROR_MESSAGES["AI_PROVIDER_REQUIRED"]}${ERROR_MESSAGES["AI_KEYWORD_RESEARCH_REQUIRES_PROVIDER"]}`,
      HTTP_STATUS["SERVICE_UNAVAILABLE"],
    );
  }

  try {
    const keywords = await fetchKeywordResearchFromModel(seed);
    const fetchedAt = Date.now();
    cacheBySeed.set(cacheKey, {
      seed,
      keywords,
      source: AI_SUGGESTION_SOURCES.GOOGLE_SEARCH,
      fetchedAt,
      expiresAt: fetchedAt + AI_CONFIG["KEYWORD_RESEARCH_CACHE_MS"],
    });
    return {
      seed,
      keywords,
      source: AI_SUGGESTION_SOURCES.GOOGLE_SEARCH,
      cached: false,
      updatedAt: new Date(fetchedAt).toISOString(),
      scoresEstimated: true,
    };
  } catch (err) {
    const msg = (err as Error).message || String(err);
    logger.warn(
      `Keyword research failed (${resolveAiProvider()}): ${msg.slice(0, AI_CONFIG["AI_ERROR_LOG_MAX_CHARS"])}`,
    );

    const stale = cacheBySeed.get(cacheKey);
    if (stale && stale.keywords.length > 0) {
      logger.warn(`Keyword research refresh failed, using stale cache: ${msg}`);
      return {
        seed: stale.seed,
        keywords: stale.keywords,
        source: stale.source,
        cached: true,
        updatedAt: new Date(stale.fetchedAt).toISOString(),
        scoresEstimated: true,
      };
    }

    if (isCreditsDepletedError(err)) {
      throw new AppError(ERROR_MESSAGES["AI_CREDITS_DEPLETED"], HTTP_STATUS["PAYMENT_REQUIRED"]);
    }

    if (AI_CONFIG["ERR_RATE_LIMIT_PATTERN"].test(msg)) {
      throw new AppError(ERROR_MESSAGES["AI_RATE_LIMITED"], HTTP_STATUS["TOO_MANY_REQUESTS"]);
    }

    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError(ERROR_MESSAGES["AI_KEYWORD_RESEARCH_FAILED"], HTTP_STATUS["SERVICE_UNAVAILABLE"]);
  }
}
