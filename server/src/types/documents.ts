/**
 * Mongoose document interfaces — live in types/, implemented by model schemas.
 */
import type { Document, Types } from "mongoose";

import type { ICredential } from "./credentials";
import type { IPlatformStatus, IPost } from "./posts";
import type { IUser } from "./users";

export interface IPostDocument extends Document, Omit<IPost, "_id" | "author"> {
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  created_at: Date;
  updated_at: Date;
  is_published_anywhere: boolean;
  meta_description?: string | null;
}

export interface IUserDocument extends Document, Omit<IUser, "_id"> {
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): Omit<IUserDocument, "password">;
}

export interface ICredentialDocument extends Document, Omit<ICredential, "_id" | "author" | "token_expires_at"> {
  author: Types.ObjectId;
  platform_name: string;
  encrypted_payload: string;
  api_key: string;
  site_url?: string;
  is_active: boolean;
  refresh_token?: string;
  token_expires_at?: Date;
  platform_config?: {
    devto_username?: string;
    medium_user_id?: string;
    wordpress_url?: string;
    linkedin_person_urn?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IPostAnalyticsSnapshot {
  author: Types.ObjectId;
  post: Types.ObjectId;
  platform: string;
  remote_post_id: string;
  title?: string;
  url?: string;
  views: number;
  reactions: number;
  comments: number;
  as_of: Date;
  fetched_at: Date;
}

export interface IPostAnalyticsSnapshotDocument extends Document, Omit<IPostAnalyticsSnapshot, "author" | "post"> {
  author: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type PostPlatformStatus = {
  medium?: IPlatformStatus;
  devto?: IPlatformStatus;
  wordpress?: IPlatformStatus;
  linkedin?: IPlatformStatus;
};
