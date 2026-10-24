/**
 * Service-layer helper types shared across analytics, posts, OAuth, and AI helpers.
 */

export type DevtoArticlePayload = {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  page_views_count?: unknown;
  page_views?: unknown;
  public_reactions_count?: unknown;
  positive_reactions_count?: unknown;
  comments_count?: unknown;
};

export type DateRangeInput = {
  startDate?: string;
  endDate?: string;
};

export type PopulatedAuthor = { _id: { toString(): string }; name?: string; email?: string };

export type LeanPost = {
  _id?: unknown;
  status?: string;
  author?: PopulatedAuthor;
  createdAt?: Date;
  updatedAt?: Date;
  platform_status?: Record<string, { published: boolean }>;
} & Record<string, unknown>;

export type LinkedInOAuthState = {
  userId: string;
  purpose: string;
};

export type LinkedInTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

export type DevtoTagRow = {
  name?: unknown;
};

export type SlackBlock = Record<string, unknown>;

export type MongooseCache = {
  conn: typeof import("mongoose") | null;
  promise: Promise<typeof import("mongoose")> | null;
};
