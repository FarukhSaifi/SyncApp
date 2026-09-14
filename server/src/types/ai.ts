/**
 * AI module domain types, interfaces, and DTOs.
 */
import type { GenerateContentConfig } from "@google/genai";

export type AiProvider = "studio" | "none";

export interface AiCapabilities {
  textAi: boolean;
  imageAi: boolean;
  provider: AiProvider;
  defaultModel: string;
  studioUrl: string;
}

export type StudioGenerateOptions = {
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

export type ParsedTrending = {
  topics: string[];
  keywords: string[];
};

export type TrendingCacheEntry = {
  topics: string[];
  keywords: string[];
  source: TrendingTopicsSource;
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
