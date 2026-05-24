import type { Request, Response } from "express";
import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "../constants";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import * as postsService from "../services/postsService";
import { uploadToGCS } from "../services/storage";

/**
 * Create a new post
 */
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.createPost({ ...req.body, author: req.userId });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: post });
});

/**
 * Get all posts with pagination
 */
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await postsService.getPosts({ page, limit, userId: req.userId });
  res.json({ success: true, ...result });
});

/**
 * Get post by ID
 */
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.getPostById(req.params.id as string, req.userId);
  res.json({ success: true, data: post });
});

/**
 * Get post by slug
 */
export const getPostBySlug = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.getPostBySlug(req.params.slug as string, req.userId);
  res.json({ success: true, data: post });
});

/**
 * Update post
 */
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.updatePost(req.params.id as string, req.body as Record<string, unknown>, req.userId!);
  res.json({ success: true, data: post, message: SUCCESS_MESSAGES.POST_UPDATED });
});

/**
 * Delete post
 */
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await postsService.deletePost(req.params.id as string, req.userId!);
  res.json({ success: true, message: SUCCESS_MESSAGES.POST_DELETED });
});

/**
 * Upload cover image for a post (data URL from AI-generated or pasted image).
 * Uploads to Google Cloud Storage and updates post.cover_image with the GCS URL.
 */
export const uploadPostCover = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const { image: imageDataUrl } = req.body as { image?: string };

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    throw new AppError(ERROR_MESSAGES.UPLOAD_IMAGE_DATA_URL_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  // Parse data URL → buffer for GCS upload
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new AppError(ERROR_MESSAGES.UPLOAD_IMAGE_DATA_URL_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }
  const mimetype = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const filename = `cover-${postId}-${Date.now()}.png`;

  const url = await uploadToGCS(buffer, filename, mimetype);
  const post = await postsService.updatePost(postId, { cover_image: url }, req.userId!);

  res.status(HTTP_STATUS.OK).json({ success: true, data: { url, post } });
});
