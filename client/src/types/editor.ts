import React from "react";

import type { AiContentModel, AiImageSource, AiLoadingKey } from "./ai";
import type { Post } from "./models";

export interface EditorFormData {
  title: string;
  content_markdown: string;
  meta_description: string;
  cover_image: string;
  canonical_url: string;
  scheduled_for: string;
  status: string;
  linkedin_post: string;
  linkedin_read_more_url: string;
  [key: string]: string | string[];
}

export interface UseEditorStateOptions {
  onPostCreate: (post: Post) => void;
  onPostUpdate: (post: Post) => void;
}

export type PublishFormOverrides = Partial<Pick<EditorFormData, "linkedin_post" | "linkedin_read_more_url">>;

export interface WordCountStats {
  words: number;
  characters: number;
  readingTimeMinutes: number;
}

export interface EditorSidebarLeftProps {
  isOpen: boolean;
  /** Close mobile temporary drawer (ignored on desktop docked sidebar). */
  onClose: () => void;
  formData: EditorFormData;
  tagList: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Set or clear the featured/cover image URL (GCS public URL after upload). */
  onCoverImageChange: (url: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  contentLoading?: boolean;
}

export interface EditorSidebarRightProps {
  isOpen: boolean;
  /** Close mobile temporary drawer (ignored on desktop docked sidebar). */
  onClose: () => void;
  postId?: string;
  status: string;
  publishing: boolean;
  loading: boolean;
  onSaveDraft: () => void;
  onPublishToPlatform: (platform: string) => void;
  onPublishToAll: () => void;
  onDownloadMdx: () => void;
  scheduledFor: string;
  onScheduleSave: (value: string) => Promise<boolean>;
  coverImage?: string;
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
  generatedImageUrl?: string | null;
  generatedImageSource?: AiImageSource | null;
  uploadingCover: boolean;
  linkedinPost: string | null;
  linkedinReadMoreUrl: string | null;
  linkedinMissingCanonical: boolean;
  linkedinConnected: boolean;
  onCopyLinkedInPost: () => void;
  onPublishLinkedInPost: () => void;
  onGenerateLinkedInSummary: () => void;
  onGeneratePost: () => void;
  onGenerateImage: () => void;
  onUseAsFeaturedImage: () => void;
  onUploadAndAttach: () => void;
  onCopyImageUrl?: () => void;
  onDownloadImage?: () => void;
  connectedPlatforms: string[];
}

export interface EditorStatusBarProps {
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  lastSavedAt: Date | null;
  isDirty: boolean;
}

export interface EditorToolbarProps {
  isEditing: boolean;
  activeTab: "edit" | "preview";
  onTogglePreview: () => void;
  onSave: () => void;
  onBack: () => void;
  loading: boolean;
  isDirty: boolean;
  wordCount: number;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export interface EditorPreviewProps {
  title: string;
  coverImage?: string;
  previewContent: string;
  tagList: string[];
}

export interface EditorContentProps {
  formData: EditorFormData;
  activeTab: "edit" | "preview";
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange: (html: string) => void;
  tagList: string[];
}

export interface EditorProps {
  onPostCreate: (post: Post) => void;
  onPostUpdate: (post: Post) => void;
}

export interface SeoCheck {
  label: string;
  ok: boolean | null;
  warning?: boolean;
}

export interface SeoScorecard {
  score: number;
  maxScore: number;
  checks: SeoCheck[];
  summary?: string;
}

/** Collapsible section shared by left/right editor sidebars. */
export interface EditorSidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Circular SEO score indicator in the left sidebar. */
export interface SeoScoreRingProps {
  score: number;
  maxScore: number;
}

/** LinkedIn summary + publish panel in the right sidebar. */
export interface LinkedInPostPanelProps {
  linkedinPost: string | null;
  linkedinReadMoreUrl: string | null;
  linkedinMissingCanonical: boolean;
  linkedinConnected: boolean;
  publishing?: boolean;
  generating?: boolean;
  onCopy: () => void;
  onPublish: () => void;
  onGenerate: () => void;
  disabled?: boolean;
}
