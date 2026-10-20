/**
 * AI module domain types, interfaces, and DTOs.
 */
import type { GenerateContentConfig } from "@google/genai";

/** Matches AI_PROVIDERS in constants/ai.ts */
export type AiProvider = "vertex" | "studio" | "none";

export interface AiCapabilities {
  textAi: boolean;
  imageAi: boolean;
  provider: AiProvider;
  defaultModel: string;
  studioUrl: string;
  /** GCP project when provider is vertex. */
  project?: string;
  /** Vertex AI location when provider is vertex. */
  location?: string;
}

export type AiGenerateOptions = {
  model: string;
  contents: string;
  systemInstruction?: string;
  maxOutputTokens: number;
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
  responseSchema?: GenerateContentConfig["responseSchema"];
  tools?: GenerateContentConfig["tools"];
};

/** @deprecated Prefer AiGenerateOptions. */
export type StudioGenerateOptions = AiGenerateOptions;

/** Image backend label; `imagen` retained for older clients but is no longer produced. */
export type ImageSource = "gemini" | "imagen";

export interface GenerateImageResult {
  imageDataUrl: string;
  imageUrl?: string;
  source: ImageSource;
}

export type TrendingTopicsSource = "google_search";

export interface TrendingTopicsResult {
  topics: string[];
  keywords: string[];
  source: TrendingTopicsSource;
  cached: boolean;
  updatedAt: string;
}

/** Search-intent labels from keyword research (AI estimates). */
export type KeywordIntentLabel = "transactional" | "commercial" | "informational";

export type KeywordResearchSource = "google_search";

export interface KeywordResearchItem {
  keyword: string;
  /** Buyer / transactional intent estimate 0–100. */
  commercialIntent: number;
  /** Estimated SERP difficulty 0–100 (lower = easier). */
  competition: number;
  /** Ranked opportunity: high intent × low competition, 0–100. */
  opportunityScore: number;
  intentLabel: KeywordIntentLabel;
  monetizationAngle: string;
  rationale: string;
}

export interface KeywordResearchResult {
  seed: string;
  keywords: KeywordResearchItem[];
  source: KeywordResearchSource;
  cached: boolean;
  updatedAt: string;
  /** Scores are AI estimates from Search grounding, not measured volume/KD. */
  scoresEstimated: true;
}

export type KeywordResearchCacheEntry = {
  seed: string;
  keywords: KeywordResearchItem[];
  source: KeywordResearchSource;
  fetchedAt: number;
  expiresAt: number;
};

/** Optional monetization context passed from keyword research into draft generation. */
export interface GeneratePostResearchContext {
  monetizationAngle?: string;
  intentLabel?: KeywordIntentLabel;
}

export type ParsedTrending = {
  topics: string[];
  keywords: string[];
};

export type TrendingCacheEntry = {
  topics: string[];
  keywords: string[];
  source: TrendingTopicsSource;
  /** Epoch ms when the live Google/Studio fetch completed. */
  fetchedAt: number;
  expiresAt: number;
};

export interface DevtoReachTagsResult {
  tags: string[];
  source: "devto";
  cached: boolean;
  updatedAt: string;
}

export type DevtoCacheEntry = {
  tags: string[];
  expiresAt: number;
};

export type GenerateLinkedInSummaryInput = {
  title?: string;
  content?: string;
  model?: string;
  readMoreUrl?: string;
};

export type GenerateLinkedInSummaryResult = {
  linkedin_post: string;
  read_more_url?: string;
  linkedin_missing_canonical?: boolean;
};

export type ParseGeneratePostOptions = {
  includeLinkedIn?: boolean;
};

export interface GeneratePostResult {
  title?: string;
  content?: string;
  meta_description?: string;
  tags?: string[];
  linkedin_post?: string;
  read_more_url?: string;
  linkedin_missing_canonical?: boolean;
}

/** Request DTOs for AI controllers */
export interface GeneratePostRequestBody {
  keyword: string;
  model?: string;
  targetPlatforms?: string[];
  researchContext?: GeneratePostResearchContext;
}

export interface KeywordResearchRequestBody {
  seed: string;
}

export interface GenerateImageRequestBody {
  topic: string;
  additionalPrompt?: string;
}

export interface GenerateEditRequestBody {
  action: string;
  text: string;
}

export interface GenerateLinkedInSummaryRequestBody {
  title?: string;
  content?: string;
  model?: string;
  readMoreUrl?: string;
}
