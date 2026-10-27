/**
 * AI Assistant, Generation, and Prompt types.
 */

export interface AiContentModel {
  id: string;
  label: string;
  description?: string;
}

export type AiImageSource = "gemini" | "imagen";

/** Active AI job key while a sidebar/modal generation is in flight. */
export type AiLoadingKey = "" | "post" | "image" | "linkedin" | "improve";

/** Suggestion feed source identifiers from AI trending / tags APIs. */
export type AiTopicsSource = "google_search";
export type AiReachTagsSource = "devto";

export interface TrendingTopicsResult {
  topics: string[];
  keywords: string[];
  source: AiTopicsSource;
  cached: boolean;
  updatedAt: string;
}

/** Search-intent labels from keyword research (AI estimates). */
export type KeywordIntentLabel = "transactional" | "commercial" | "informational";

export interface KeywordResearchItem {
  keyword: string;
  commercialIntent: number;
  competition: number;
  opportunityScore: number;
  intentLabel: KeywordIntentLabel;
  monetizationAngle: string;
  rationale: string;
}

export interface KeywordResearchResult {
  seed: string;
  keywords: KeywordResearchItem[];
  source: "google_search";
  cached: boolean;
  updatedAt: string;
  scoresEstimated: true;
}

/** Monetization context passed from keyword research into draft generation. */
export interface GeneratePostResearchContext {
  monetizationAngle?: string;
  intentLabel?: KeywordIntentLabel;
}

export interface SuggestionErrorProps {
  message: string;
}

export interface KeywordResearchSectionProps {
  seed: string;
  onSeedChange: (value: string) => void;
  results: KeywordResearchItem[];
  loading: boolean;
  error: string | null;
  cached: boolean;
  updatedAt: string | null;
  selectedKeyword: string;
  onResearch: () => void;
  onPick: (item: KeywordResearchItem) => void;
  disabled?: boolean;
}

export interface GeneratedPostData {
  title: string;
  meta_description: string;
  tags: string[];
  content: string;
  linkedin_post?: string;
  read_more_url?: string;
  linkedin_missing_canonical?: boolean;
}

export interface GeneratePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
  models: AiContentModel[];
  targetPlatforms: string[];
  onTargetPlatformsChange: (platforms: string[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  researchContext: GeneratePostResearchContext | null;
  /** Apply a researched keyword + monetization context for draft generation. */
  onResearchPick: (item: KeywordResearchItem) => void;
  /**
   * Select a trending/Google keyword and clear research monetization context atomically
   * (including when the text matches a prior research pick).
   */
  onSelectSuggestionKeyword: (value: string) => void;
}

export interface UseEditorAIOptions {
  postId?: string;
  /** Preferred public article URL for LinkedIn Read more (post canonical). */
  preferredReadMoreUrl?: string;
  /** Current editor title + body for LinkedIn-only summary generation. */
  getArticleContext: () => { title: string; content: string };
  onDraftGenerated: (data: GeneratedPostData) => void;
  onLinkedInSummaryGenerated: (data: {
    linkedin_post: string;
    read_more_url?: string;
    linkedin_missing_canonical?: boolean;
  }) => void;
  onCoverImageSet: (url: string) => void;
}

export interface SeoImproveReviewItem {
  id: string;
  field: import("./editor").SeoImproveField;
  applyMode: import("./editor").SeoImproveApplyMode;
  issue: string;
  currentValue: string;
  value: string;
  note?: string;
  selected: boolean;
}

export interface SeoImproveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SeoImproveReviewItem[];
  onToggleItem: (id: string) => void;
  onApply: () => void;
  isApplying?: boolean;
}

export interface UseEditorAIReturn {
  aiKeyword: string;
  setAiKeyword: (v: string) => void;
  aiModel: string;
  setAiModel: (v: string) => void;
  aiModels: AiContentModel[];
  targetPlatforms: string[];
  setTargetPlatforms: (platforms: string[]) => void;
  aiImagePrompt: string;
  setAiImagePrompt: (v: string) => void;
  aiLoading: AiLoadingKey;
  generatedImageDataUrl: string | null;
  generatedImageUrl: string | null;
  generatedImageSource: AiImageSource | null;
  uploadingCover: boolean;
  linkedinPost: string | null;
  linkedinReadMoreUrl: string | null;
  linkedinMissingCanonical: boolean;
  researchContext: GeneratePostResearchContext | null;
  applyResearchPick: (item: KeywordResearchItem) => void;
  clearResearchContext: () => void;
  selectSuggestionKeyword: (value: string) => void;
  handleGeneratePost: () => Promise<void>;
  handleGenerateLinkedInSummary: () => Promise<void>;
  handleGenerateImage: () => Promise<void>;
  handleUseAsFeaturedImage: () => void;
  handleUploadAndAttach: () => Promise<void>;
  handleCopyLinkedInPost: () => Promise<void>;
  handleCopyImageUrl: () => Promise<void>;
  handleDownloadImage: () => void;
  hydrateLinkedInPost: (post: string | null, missingCanonical?: boolean) => void;
  clearLinkedInPost: () => void;
  /** Targeted SEO improve: request snippet fixes, then review before apply. */
  improveReviewItems: SeoImproveReviewItem[];
  improveReviewOpen: boolean;
  closeImproveReview: () => void;
  toggleImproveReviewItem: (id: string) => void;
  handleImproveWithAi: (targets: import("./editor").SeoImproveTarget[]) => Promise<void>;
  handleApplyImproveFixes: (apply: (fixes: import("./editor").SeoImproveProposedFix[]) => void) => void;
}
