import type { Request, Response } from "express";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../constants";
import { asyncHandler } from "../middleware/errorHandler";
import * as usersService from "../services/usersService";

/**
 * Get all users with pagination and filtering
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, role } = req.query as Record<string, string | undefined>;
  const result = await usersService.getUsers({ page, limit, search, role });
  res.json({ success: true, data: result.users, pagination: result.pagination });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id as string);
  res.json({ success: true, data: user });
});

/**
 * Create user (admin only)
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: user, message: SUCCESS_MESSAGES.USER_CREATED });
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUser(req.params.id as string, req.body as Record<string, unknown>);
  res.json({ success: true, data: user, message: SUCCESS_MESSAGES.USER_UPDATED });
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await usersService.deleteUser(req.params.id as string);
  res.json({ success: true, message: SUCCESS_MESSAGES.USER_DELETED });
});
