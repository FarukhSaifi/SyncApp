/**
 * Shared type definitions for SyncApp server.
 * Use for request/response shapes, service layers, and models.
 */

export interface IPlatformStatus {
  published: boolean;
  post_id?: string;
  url?: string;
  published_at?: Date;
}

export interface IPost {
  _id: string;
  slug?: string;
  title: string;
  content_markdown: string;
  status: "draft" | "published" | "archived";
  author: string;
  platform_status?: {
    medium?: IPlatformStatus;
    devto?: IPlatformStatus;
    wordpress?: IPlatformStatus;
  };
  tags: string[];
  cover_image?: string;
  canonical_url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  role: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICredential {
  _id: string;
  user: string;
  platform: string;
  api_key?: string;
  site_url?: string;
  platform_config?: Record<string, unknown>;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
