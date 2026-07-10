/**
 * AI Controller – outline, draft, and full generate
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

export const postOptimise = asyncHandler(async (req: Request, res: Response) => {
  const { title, meta_description, tags, content_markdown } = req.body as {
    title?: string;
    meta_description?: string;
    tags?: string[];
    content_markdown: string;
  };
  const result = await aiService.optimiseForPublish({
    title,
    meta_description,
    tags,
    content_markdown,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});
