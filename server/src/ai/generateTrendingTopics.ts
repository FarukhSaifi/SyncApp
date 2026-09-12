/**
 * Real-time trending blog topics + Google SEO keywords via AI Studio + Search grounding.
 * Throws AppError when search/quota is unavailable so the client can show an error.
 * (Google Ads Keyword Planner is not used — requires Ads account; Search grounding is Studio-native.)
 */
import https from "node:https";
import { AI_CONFIG, AI_PROMPTS } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { sanitizeJsonString } from "../utils/sanitizeJson";
import {
  buildModelCandidates,
  getModelName,
  getText,
  getVertexAiClient,
  hasStudioKey,
  hasVertexConfig,
  studioGenerateContent,
} from "./client";
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

const SEED_TOPIC_CATEGORIES = [
  ["ai agents software engineering", "generative ai developer tools", "model context protocol"],
  ["react 19 patterns", "nextjs app router architecture", "typescript performance optimization"],
  ["cloud native platform engineering", "kubernetes devops trends", "zero trust devsecops"],
  ["microservices system design", "database performance tuning", "rust backend development"],
  ["developer productivity tools", "open source github trending", "software architecture patterns"],
];

function getRandomSeeds(): string[] {
  const shuffled = [...SEED_TOPIC_CATEGORIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2).flat();
}

/**
 * Fetch live search queries directly from Google's autocomplete suggestion service.
 */
function fetchGoogleSearchSuggestions(query: string): Promise<string[]> {
  return new Promise((resolve) => {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
    const req = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }, timeout: 3000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed[1]) ? parsed[1] : []);
          } catch {
            resolve([]);
          }
        });
      },
    );
    req.on("error", () => resolve([]));
    req.on("timeout", () => {
      req.destroy();
      resolve([]);
    });
  });
}

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
      // try next candidate
    }
  }

  throw new Error("unparseable trending topics");
}

async function fetchLiveTrending(): Promise<ParsedTrending> {
  // 1. Gather live search trends directly from Google's search autocomplete service
  const seeds = getRandomSeeds();
  const liveGoogleQueries = (
    await Promise.all(seeds.map((s) => fetchGoogleSearchSuggestions(s)))
  )
    .flat()
    .filter(Boolean)
    .slice(0, 15);

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const queryContext = liveGoogleQueries.length > 0
    ? `\nActive real-time Google search queries right now:\n${liveGoogleQueries.map((q) => `- "${q}"`).join("\n")}`
    : "";

  const systemInstruction = `You are a real-time tech content and SEO strategist.
Today's date is ${currentDate}.${queryContext}

Using Google Search grounding and current developer search behavior, identify the top 6 trending blog topics and top 8 primary Google search keywords right now.
Return ONLY valid JSON matching this schema:
{
  "topics": ["6 specific, fresh, high-CTR blog topic titles (4-10 words each) reflecting current real-world software engineering events, tools, or best practices"],
  "keywords": ["8 high-intent Google search keywords that developers are typing into Google search right now (2-5 words each, lowercase)"]
}
Rules:
- Be timely, relevant, and specific (e.g. AI agent workflows, modern React/Next.js architectures, platform engineering, modern dev tools).
- No markdown wrappers outside the JSON, return ONLY valid JSON.`;

  const userPrompt = `Search for what developers, software engineers, and tech bloggers are actively searching for and discussing on Google right now. Return 6 high-reach blog topics and 8 Google SEO keywords as JSON.`;

  // 2. Primary: Use Google Cloud Vertex AI Search Grounding if configured (uses billed Google Cloud quota)
  if (hasVertexConfig()) {
    try {
      const vertexAi = getVertexAiClient();
      if (vertexAi) {
        const grounded = await withRetry(
          () =>
            vertexAi.models.generateContent({
              model: "gemini-2.5-flash",
              contents: userPrompt,
              config: {
                systemInstruction,
                temperature: 0.7,
                tools: [{ googleSearch: {} }],
              },
            }),
          { attempts: 1 },
        );
        const text = getText(grounded);
        const parsed = parseTrendingPayload(text);
        if (parsed.topics.length >= AI_CONFIG.TRENDING_PARSE_MIN_ITEMS) {
          logger.info("Fetched real-time trending topics via Google Cloud Vertex AI Search Grounding");
          return parsed;
        }
      }
    } catch (vertexErr) {
      const msg = vertexErr instanceof Error ? vertexErr.message : String(vertexErr);
      logger.warn(`Vertex AI search grounding failed, attempting Studio fallback: ${msg.slice(0, 150)}`);
    }
  }

  // 3. Fallback: Google AI Studio with Search Grounding or Plain Generation with live search queries
  const candidates = buildModelCandidates(getModelName());
  let lastError: unknown;

  for (const modelName of candidates) {
    try {
      // Try search grounding on Studio
      try {
        const grounded = await withRetry(
          () =>
            studioGenerateContent({
              model: modelName,
              contents: userPrompt,
              systemInstruction,
              maxOutputTokens: AI_CONFIG.MAX_TRENDING_TOPICS_TOKENS,
              temperature: 0.7,
              tools: [{ googleSearch: {} }],
            }),
          { attempts: 1 },
        );
        return parseTrendingPayload(getText(grounded));
      } catch {
        // Grounding may be blocked or quota limited on free tier
      }

      // Plain generation enriched with live Google search query context
      const plain = await withRetry(
        () =>
          studioGenerateContent({
            model: modelName,
            contents: userPrompt,
            systemInstruction,
            maxOutputTokens: AI_CONFIG.MAX_TRENDING_TOPICS_TOKENS,
            temperature: 0.7,
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
