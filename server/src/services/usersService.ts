import mongoose from "mongoose";
import { DEFAULT_PASSWORDS, ERROR_MESSAGES, FIELDS, SUCCESS_MESSAGES } from "../constants";
import { USER_ROLES, VALID_USER_ROLES } from "../constants/userRoles";
import Credential from "../models/Credential";
import Post from "../models/Post";
import User from "../models/User";
import type { CreateUserData, GetUsersParams } from "../types/index";
import { cache, cacheKeys } from "../utils/cache";
import { toObjectId } from "../utils/objectId";

/**
 * Get all users with pagination and filtering
 */
export async function getUsers({ page = 1, limit = 20, search = "", role = "" }: GetUsersParams = {}) {
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }
  if (role) {
    query.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select(FIELDS.USER_FIELDS.SELECT_WITHOUT_PASSWORD)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const user = await User.findById(userId).select(FIELDS.USER_FIELDS.SELECT_WITHOUT_PASSWORD);
  if (!user) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }
  return user;
}

/**
 * Update user (admin only)
 */
export async function updateUser(userId: string, updateData: Record<string, unknown>) {
  const updateFields: Record<string, unknown> = {};

  FIELDS.USER_FIELDS.UPDATABLE_FIELDS.forEach((field) => {
    if (updateData[field] !== undefined) {
      updateFields[field] = updateData[field];
    }
  });

  if (updateFields.role && !(VALID_USER_ROLES as readonly string[]).includes(updateFields.role as string)) {
    throw new Error(ERROR_MESSAGES.INVALID_ROLE);
  }

  const user = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true }).select(
    FIELDS.USER_FIELDS.SELECT_WITHOUT_PASSWORD,
  );

  if (!user) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return user;
}

/**
 * Create user (admin only)
 */
export async function createUser(userData: CreateUserData) {
  const { username, email, password, firstName, lastName, bio, avatar, role, isVerified } = userData;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new Error(ERROR_MESSAGES.USER_ALREADY_EXISTS);
  }

  if (role && !(VALID_USER_ROLES as readonly string[]).includes(role)) {
    throw new Error(ERROR_MESSAGES.INVALID_ROLE);
  }

  const user = new User({
    username,
    email,
    password: password || DEFAULT_PASSWORDS.TEMP_PASSWORD,
    firstName,
    lastName,
    bio,
    avatar,
    role: role || USER_ROLES.USER,
    isVerified: isVerified || false,
  });

  await user.save();

  const userObj = user.toObject() as unknown as Record<string, unknown>;
  delete userObj.password;
  return userObj;
}

/**
 * Delete user and owned data (admin only)
 */
export async function deleteUser(userId: string) {
  const authorId = toObjectId(userId);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const [credentialResult, postResult] = await Promise.all([
      Credential.deleteMany({ author: authorId }, { session }),
      Post.deleteMany({ author: authorId }, { session }),
    ]);

    await User.findByIdAndDelete(userId, { session });
    await session.commitTransaction();

    cache.delete(cacheKeys.credentials.list(userId));
    cache.invalidatePattern(cacheKeys.credentials.all());
    cache.invalidatePattern(cacheKeys.posts.all());
    cache.delete(cacheKeys.user.profile(userId));

    return {
      message: SUCCESS_MESSAGES.USER_DELETED,
      deletedCredentials: credentialResult.deletedCount,
      deletedPosts: postResult.deletedCount,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
