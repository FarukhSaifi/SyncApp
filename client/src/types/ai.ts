/**
 * AI Assistant, Generation, and Prompt types.
 */

export interface AiContentModel {
  id: string;
  label: string;
  description?: string;
}

export type AiImageSource = "gemini" | "imagen";

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
  aiLoading: string;
  generatedImageDataUrl: string | null;
  generatedImageUrl: string | null;
  generatedImageSource: AiImageSource | null;
  uploadingCover: boolean;
  linkedinPost: string | null;
  linkedinReadMoreUrl: string | null;
  linkedinMissingCanonical: boolean;
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
}
