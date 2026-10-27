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
  /** Platforms to syndicate when the scheduled cron runs. Empty = all active credentials (legacy). */
  scheduled_platforms?: string[];
  /** Persisted SEO score (0-100) from full-body rubric at save/generate time. */
  seo_score?: number | null;
  /** Compact checklist summary for dashboard tooltip. */
  seo_score_summary?: string;
  /** Keyword used for placement checks when the score was computed. */
  seo_primary_keyword?: string;
  /** Optimization targets used for platform-aware weighting (devto/linkedin/google). */
  seo_optimization_targets?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type SeoCategoryId = "metadata" | "structure" | "trust";

export interface SeoCheck {
  label: string;
  ok: boolean | null;
  warning?: boolean;
  category?: SeoCategoryId;
}

export interface SeoScorecardCategoryGroup {
  id: SeoCategoryId;
  checks: SeoCheck[];
}

export interface SeoScorecard {
  score: number;
  maxScore: number;
  checks: SeoCheck[];
  categories?: SeoScorecardCategoryGroup[];
  summary?: string;
}

export interface SeoScorecardContext {
  primaryKeyword?: string;
  platforms?: string[];
}

export interface SeoScorePersistFields {
  seo_score: number;
  seo_score_summary: string;
  seo_primary_keyword: string;
  seo_optimization_targets: string[];
}

export interface CreatePostInput {
  title?: string;
  content_markdown?: string;
  status?: "draft" | "published" | "archived" | string;
  tags?: string[];
  cover_image?: string | null;
  canonical_url?: string;
  scheduled_for?: Date | string;
  scheduled_platforms?: string[] | null;
  meta_description?: string;
  linkedin_post?: string;
  linkedin_read_more_url?: string;
  author?: string;
  seo_primary_keyword?: string;
  seo_optimization_targets?: string[];
}

export interface GetPostsParams {
  page?: number | string;
  limit?: number | string;
  status?: string;
  search?: string;
  userId?: string;
}

/** Unfiltered dashboard chip counts (independent of list page/status/search). */
export interface PostListStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  withPlatforms: number;
}
