/**
 * AI Controller – outline, draft, and full generate
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as aiService from '../services/aiService';
import { HTTP_STATUS } from '../constants';

export const postOutline = asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.body as { keyword: string };
  const outline = await aiService.generateOutline(keyword);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { outline } });
});

export const postDraft = asyncHandler(async (req: Request, res: Response) => {
  const { outline } = req.body as { outline: string };
  const draft = await aiService.generateDraft(outline);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { draft } });
});

export const postGenerate = asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.body as { keyword: string };
  const result = await aiService.generatePost(keyword);
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

export const postGenerateImage = asyncHandler(async (req: Request, res: Response) => {
  const { outline } = req.body as { outline: string };
  const result = await aiService.generateImageFromOutline(outline);
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

export const postEdit = asyncHandler(async (req: Request, res: Response) => {
  const { action, text } = req.body as { action: string; text: string };
  const editedText = await aiService.generateEdit(action, text);
  res.status(HTTP_STATUS.OK).json({ success: true, data: { result: editedText } });
});
