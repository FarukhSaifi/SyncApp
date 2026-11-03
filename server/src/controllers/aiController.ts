/**
 * AI Controller – generate post, image, edit, capabilities
 */


import {
  HTTP_STATUS,
  isAllowedContentModel,
  isValidOptimizationTargets,
  resolveOptimizationTargets,
} from "@constants";
import { AppError, asyncHandler } from "@middleware/errorHandler";
import * as aiService from "@services/aiService";
import type {
  GenerateEditRequestBody,
  GenerateImageRequestBody,
  GenerateLinkedInSummaryRequestBody,
  GeneratePostRequestBody,
  ImproveSeoRequestBody,
  KeywordResearchRequestBody,
} from "@types";
import type { Request, Response } from "express";

import { ERROR_MESSAGES } from "@constants/messages";

function isRefreshQuery(value: unknown): boolean {
  const raw = String(value || "");
  return raw === "1" || raw === "true";
}

function validateRequestedModel(model?: string): void {
  if (model !== undefined && model !== null && model !== "" && !isAllowedContentModel(model)) {
    throw new AppError(ERROR_MESSAGES.AI_INVALID_MODEL, HTTP_STATUS.BAD_REQUEST);
  }
}

export const getCapabilities = asyncHandler(async (_req: Request, res: Response) => {
  const data = aiService.getAiCapabilities();
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const getTrendingTopics = asyncHandler(async (req: Request, res: Response) => {
  const refresh = isRefreshQuery(req.query.refresh);
  const data = await aiService.getTrendingTopics({ refresh });
  // Prefer fresh fetches over intermediary HTTP caches; in-memory TTL is short.
  res.setHeader("Cache-Control", refresh ? "no-store" : "private, max-age=0, must-revalidate");
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const getDevtoReachTags = asyncHandler(async (req: Request, res: Response) => {
  const data = await aiService.getDevtoReachTags({ refresh: isRefreshQuery(req.query.refresh) });
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const postGenerate = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, model, targetPlatforms, researchContext } = req.body as GeneratePostRequestBody;

  validateRequestedModel(model);

  if (
    targetPlatforms !== undefined &&
    targetPlatforms !== null &&
    (!Array.isArray(targetPlatforms) || !isValidOptimizationTargets(targetPlatforms))
  ) {
    throw new AppError(ERROR_MESSAGES.AI_INVALID_OPTIMIZATION_TARGETS, HTTP_STATUS.BAD_REQUEST);
  }

  const resolvedTargets = resolveOptimizationTargets(targetPlatforms);

  const result = await aiService.generatePost(keyword, {
    model: model?.trim() || undefined,
    targetPlatforms: resolvedTargets,
    researchContext,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

export const postKeywordResearch = asyncHandler(async (req: Request, res: Response) => {
  const { seed } = req.body as KeywordResearchRequestBody;
  const data = await aiService.generateKeywordResearch(seed);
  res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const postGenerateImage = asyncHandler(async (req: Request, res: Response) => {
  const { topic, additionalPrompt } = req.body as GenerateImageRequestBody;
  const result = await aiService.generateImageFromTopic(topic, additionalPrompt);
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

export const postEdit = asyncHandler(async (req: Request, res: Response) => {
  const { action, text } = req.body as GenerateEditRequestBody;
  const editedText = await aiService.generateEdit(action, text);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { result: editedText } });
});

export const postImproveSeo = asyncHandler(async (req: Request, res: Response) => {
  const { targets, model, primaryKeyword, title, platforms } = req.body as ImproveSeoRequestBody;
  validateRequestedModel(model);
  const data = await aiService.improveSeoFromScorecard({
    targets,
    model: model?.trim() || undefined,
    primaryKeyword,
    title,
    platforms,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const postGenerateLinkedInSummary = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, model, readMoreUrl } = req.body as GenerateLinkedInSummaryRequestBody;

  validateRequestedModel(model);

  const result = await aiService.generateLinkedInSummary({
    title,
    content,
    model: model?.trim() || undefined,
    readMoreUrl,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});
