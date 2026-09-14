/**
 * Post domain types and query parameter interfaces.
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
    linkedin?: IPlatformStatus;
  };
  tags: string[];
  cover_image?: string;
  canonical_url?: string;
  /** Short LinkedIn-native teaser (AI draft / publish body). */
  linkedin_post?: string;
  /** Public article URL appended as Read more when publishing to LinkedIn. */
  linkedin_read_more_url?: string;
  scheduled_for?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePostInput {
  title?: string;
  content_markdown?: string;
  status?: "draft" | "published" | "archived" | string;
  tags?: string[];
  cover_image?: string | null;
  canonical_url?: string;
  scheduled_for?: Date | string;
  meta_description?: string;
  linkedin_post?: string;
  linkedin_read_more_url?: string;
  author?: string;
}

export interface GetPostsParams {
  page?: number | string;
  limit?: number | string;
  status?: string;
  search?: string;
  userId?: string;
}
