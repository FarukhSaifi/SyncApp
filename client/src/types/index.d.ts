import React from "react";

import type { Editor } from "@tiptap/react";

import { BUTTON_SIZES, BUTTON_VARIANTS, INPUT_SIZES, PILL_SIZES } from "@constants/designTokens";

/**
 * Shared type definitions for SyncApp client.
 * Use these for API responses, props, and state.
 */

export type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonSize = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
export type InputSize = (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];
export type PillSize = keyof typeof PILL_SIZES;
export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
export type IconComponent = React.ComponentType<{ className?: string }>;
export type PostCoverThumbSize = "sm" | "md";

export interface PlatformStatus {
  published: boolean;
  post_id?: string;
  url?: string;
  published_at?: string;
}

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
  };
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** List endpoint response: success, data array, and pagination at top level (e.g. GET /api/users) */
export interface ListResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface Credential {
  _id: string;
  platform: string;
  user: string;
  api_key?: string;
  site_url?: string;
  platform_config?: Record<string, unknown>;
}

// ----------------------------------------------------
// UI, View, Component and State Types Consolidated
// ----------------------------------------------------

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

export interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  skeletonClassName?: string;
  onImageError?: () => void;
  showSkeleton?: boolean;
  /** When true (default), image src is set only after the container enters the viewport. */
  viewportLazy?: boolean;
  /** IntersectionObserver rootMargin — prefetch slightly before entering view. */
  rootMargin?: string;
}

export interface ClientOnlyProps {
  children: React.ReactNode;
  message?: string;
}

export interface StatusPillProps {
  label: string;
  className?: string;
  size?: PillSize;
  children?: React.ReactNode;
}

export interface ConnectionStatusPillProps {
  connected: boolean;
  size?: PillSize;
}

export interface PostStatusDisplay {
  label: string;
  className: string;
}

export interface PostStatusPillProps {
  status: string;
  scheduledFor?: string;
  size?: PillSize;
}

export interface PostCoverThumbnailProps {
  src?: string | null;
  title: string;
  size?: PostCoverThumbSize;
}

export interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledFor: string;
  onScheduleSave: (value: string) => Promise<boolean>;
  isPublished?: boolean;
  isSaving?: boolean;
}

export interface AiContentModel {
  id: string;
  label: string;
}

export type AiImageSource = "gemini" | "imagen" | "svg_fallback";

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

export interface GeneratedPostData {
  title: string;
  meta_description: string;
  tags: string[];
  content: string;
}

export interface ShortcutHandlers {
  onSave?: () => void;
  onTogglePreview?: () => void;
  onEscape?: () => void;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface SeoScoreBadgeProps {
  post: {
    title: string;
    content_markdown: string;
    meta_description?: string;
    cover_image?: string;
    tags?: string[];
  };
  compact?: boolean;
}

export interface EditorSidebarRightProps {
  isOpen: boolean;
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
  aiLoading: string;
  generatedImageDataUrl: string | null;
  generatedImageSource?: AiImageSource | null;
  uploadingCover: boolean;
  onGeneratePost: () => void;
  onGenerateImage: () => void;
  onUseAsFeaturedImage: () => void;
  onUploadAndAttach: () => void;
  connectedPlatforms: string[];
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface AIToolkitDropdownProps {
  editor?: Editor | null;
  onAction?: (action: string) => void;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: (e?: React.MouseEvent | React.KeyboardEvent) => void;
  size?: InputSize;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | FormData;
  params?: Record<string, unknown>;
  timeout?: number;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
  size?: ModalSize;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export interface LoadingScreenProps {
  message?: string;
  inline?: boolean;
}

export interface EditorSidebarLeftProps {
  isOpen: boolean;
  formData: EditorFormData;
  tagList: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  contentLoading?: boolean;
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

export interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  icon?: IconComponent;
  isActive?: boolean;
  onClick?: () => void;
}

export interface ToastProp {
  success?: (title: string, message: string) => void;
  error?: (title: string, message: string) => void;
}

export interface PostRowProps {
  post: PostData;
  onDelete: (id: string) => void;
}

export interface PostCardProps {
  post: PostData;
  onDelete: (id: string) => void;
}

export interface UserTableRowProps {
  user: UserData;
  onEdit: (user: UserData) => void;
  onDelete: (id: string, username: string) => void;
}

export interface UserCardProps {
  user: UserData;
  onEdit: (user: UserData) => void;
  onDelete: (id: string, username: string) => void;
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

export interface ProfileFormState extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
}

export interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterFormState {
  [key: string]: string;
}

export interface AddUserForm extends Record<string, unknown> {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
}

export interface EditForm extends Record<string, unknown> {
  role: string;
  isVerified: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UserDeleteConfirmState {
  isOpen: boolean;
  userId: string | null;
  username: string;
}

export interface EditorProps {
  onPostCreate: (post: Post) => void;
  onPostUpdate: (post: Post) => void;
}

export interface DashboardProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onPostUpdate: (post: Post) => void;
  onPostDelete: (id: string) => void;
  onRefresh: () => void;
}

export interface DashboardDeleteConfirmState {
  isOpen: boolean;
  postId: string | null;
}

export interface LoginFormState {
  [key: string]: string;
}

export interface SavedState {
  medium: boolean;
  devto: boolean;
  wordpress: boolean;
}

export interface ApiCredential extends Credential {
  platform_name: string;
}

export interface EditorFormData {
  title: string;
  content_markdown: string;
  meta_description: string;
  cover_image: string;
  canonical_url: string;
  scheduled_for: string;
  status: string;
  [key: string]: string | string[];
}

export interface PostsApiResponse {
  success: boolean;
  data?: Post[];
  pagination?: Pagination;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface PostsCacheEntry {
  data: Post[];
  pagination: Pagination;
  timestamp: number;
}

export interface PostsStats {
  total: number;
  published: number;
  drafts: number;
  withPlatforms: number;
}

export interface AnalyticsDailyActivity {
  date: string;
  posts: number;
  published: number;
}

export interface AnalyticsStats {
  summary: {
    totalPosts: number;
    totalPublished: number;
    totalDrafts: number;
    publishRate: number;
  };
  platformStats: {
    medium: number;
    devto: number;
    wordpress: number;
  };
  history: AnalyticsDailyActivity[];
}

export interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  stats: PostsStats;
  fetchPosts: (opts?: Partial<Pagination>) => Promise<void>;
  refreshPosts: () => void;
  addPost: (newPost: Post) => void;
  updatePost: (updatedPost: Partial<Post> & { id?: string; _id?: string }) => void;
  deletePost: (postId: string) => void;
  setPagination: React.Dispatch<React.SetStateAction<Pagination>>;
}

export interface UsePostsOptions {
  enabled?: boolean;
  pagination?: Pagination;
  userId?: string | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (userData: Record<string, unknown>) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (profileData: Record<string, unknown>) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
}

declare global {
  interface Window {
    __syncapp_env?: Record<string, unknown>;
  }
}
