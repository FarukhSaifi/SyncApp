/**
 * AI Controller – generate post, image, edit, capabilities
 */

import type { Request, Response } from "express";
import {
  HTTP_STATUS,
  isAllowedContentModel,
  isValidOptimizationTargets,
  resolveOptimizationTargets,
} from "../constants";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import * as aiService from "../services/aiService";

function isRefreshQuery(value: unknown): boolean {
  const raw = String(value || "");
  return raw === "1" || raw === "true";
}

export const getCapabilities = asyncHandler(async (_req: Request, res: Response) => {
  const data = aiService.getAiCapabilities();
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const getTrendingTopics = asyncHandler(async (req: Request, res: Response) => {
  const data = await aiService.getTrendingTopics({ refresh: isRefreshQuery(req.query.refresh) });
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const getDevtoReachTags = asyncHandler(async (req: Request, res: Response) => {
  const data = await aiService.getDevtoReachTags({ refresh: isRefreshQuery(req.query.refresh) });
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const postGenerate = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, model, targetPlatforms } = req.body as {
    keyword: string;
    model?: string;
    targetPlatforms?: string[];
  };

  if (model !== undefined && model !== null && model !== "" && !isAllowedContentModel(model)) {
    throw new AppError(ERROR_MESSAGES.AI_INVALID_MODEL, HTTP_STATUS.BAD_REQUEST);
  }

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
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

export const postGenerateImage = asyncHandler(async (req: Request, res: Response) => {
  const { topic, additionalPrompt } = req.body as { topic: string; additionalPrompt?: string };
  const result = await aiService.generateImageFromTopic(topic, additionalPrompt);
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

export const postEdit = asyncHandler(async (req: Request, res: Response) => {
  const { action, text } = req.body as { action: string; text: string };
  const editedText = await aiService.generateEdit(action, text);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { result: editedText } });
});
