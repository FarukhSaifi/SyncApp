/**
 * AI Service — stable import path for controllers and services.
 * Powered by Vertex AI (preferred) or Google AI Studio via @google/genai.
 */
export { getAiClient } from "@ai/client";
export {
  generateEdit,
  generateImageFromTopic,
  generateKeywordResearch,
  generateLinkedInSummary,
  generatePost,
  getAiCapabilities,
  getDevtoReachTags,
  getTrendingTopics,
  improveSeoFromScorecard,
} from "@ai";
