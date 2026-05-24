/**
 * AI Controller – outline, draft, and full generate
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as aiService from '../services/aiService';
import { HTTP_STATUS } from '../constants';

export const postGenerate = asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.body as { keyword: string };
  const result = await aiService.generatePost(keyword);
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
