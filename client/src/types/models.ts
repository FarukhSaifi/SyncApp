/**
 * Core domain entities and models for SyncApp client.
 */

export interface PlatformStatus {
  published: boolean;
  post_id?: string;
  url?: string;
  published_at?: string;
}

export interface UserRef {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  role: "user" | "admin";
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

/** API responses may include both `_id` and `id` */
export type UserData = User & {
  id?: string;
};

export interface Post {
  _id: string;
  slug?: string;
  title: string;
  content_markdown: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  meta_description?: string;
  cover_image?: string;
  canonical_url?: string;
  scheduled_for?: string;
  author: UserRef | string;
  platform_status?: {
    medium?: PlatformStatus;
    devto?: PlatformStatus;
    wordpress?: PlatformStatus;
    linkedin?: PlatformStatus;
  };
  linkedin_post?: string;
  linkedin_read_more_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** API responses may include both camelCase and snake_case fields */
export type PostData = Post & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
};

export interface Credential {
  _id: string;
  platform: string;
  user: string;
  api_key?: string;
  site_url?: string;
  platform_config?: Record<string, unknown>;
}

export interface ApiCredential extends Credential {
  platform_name: string;
}
