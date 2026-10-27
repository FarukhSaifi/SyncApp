import React from "react";

import type { Editor } from "@tiptap/react";
import type { ImageProps } from "next/image";
import type { ToasterProps as HotToasterProps } from "react-hot-toast";

import {
  APP_LOGO_VARIANTS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  INPUT_SIZES,
  MODAL_SIZES,
  PILL_SIZES,
  POST_COVER_THUMB,
} from "@constants/designTokens";

import type { PostData, UserData } from "./models";

export type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonSize = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
export type InputSize = (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];
export type PillSize = keyof typeof PILL_SIZES;
export type ModalSize = (typeof MODAL_SIZES)[keyof typeof MODAL_SIZES];
export type IconComponent = React.ComponentType<{ className?: string }>;
export type PostCoverThumbSize = keyof typeof POST_COVER_THUMB;

/** Props forwarded to `next/image` after LazyImage handles layout/loading. */
export type LazyImagePassthroughProps = Omit<
  ImageProps,
  "src" | "alt" | "width" | "height" | "fill" | "onLoad" | "onError" | "className" | "sizes"
>;

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

export interface LazyImageProps extends LazyImagePassthroughProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
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

/** Props for the shared published-platforms row on PostCard / PostRow. */
export interface PostPlatformStatusProps {
  post: PostData;
  linkClassName?: string;
  emptyClassName?: string;
}

/** Cover placeholder when thumbnail src is missing or failed. */
export interface PostCoverPlaceholderProps {
  size: PostCoverThumbSize;
}

/** Skeleton overlay for cover / featured image preview areas. */
export interface ImagePreviewSkeletonProps {
  className?: string;
}

export interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledFor: string;
  /** Platforms previously saved on the post (intersected with connected on open). */
  scheduledPlatforms: string[];
  /** Connected credential platform slugs available for scheduling. */
  connectedPlatforms: string[];
  onScheduleSave: (scheduledFor: string, platforms: string[]) => Promise<boolean>;
  isPublished?: boolean;
  isSaving?: boolean;
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
    title?: string;
    seo_score?: number | null;
    seo_score_summary?: string;
    /** Legacy list fields — unused when seo_score is present. */
    content_markdown?: string;
    meta_description?: string;
    cover_image?: string;
    tags?: string[];
  };
  compact?: boolean;
}

/** Colored SEO checklist (editor sidebar + dashboard tooltip). */
export interface SeoScoreBreakdownProps {
  checks: import("./editor").SeoCheck[];
  categories?: import("./editor").SeoScorecardCategoryGroup[];
  score?: number;
  maxScore?: number;
  /** Show score header + density note (dashboard tooltip). */
  showHeader?: boolean;
  className?: string;
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

export interface DebouncedSearchInputProps extends Omit<InputProps, "value" | "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  showSearchIcon?: boolean;
}

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: string;
  hint?: string;
  error?: string;
  size?: InputSize;
}

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  className?: string;
  contentClassName?: string;
  /**
   * Render the panel in a document.body portal with fixed positioning.
   * Use inside overflow-hidden / overflow-x-auto tables so the tip is not clipped.
   */
  portal?: boolean;
  /** Accessible name when the trigger is not already labeled */
  "aria-label"?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  size?: InputSize;
  /** Stretch to parent width (forms/filters). Default true. */
  fullWidth?: boolean;
  className?: string;
  selectClassName?: string;
}

export interface TagChipsProps {
  tags: string[];
  limit: number;
  className?: string;
  chipClassName?: string;
  emptyLabel?: string;
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

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export type CardProps = React.HTMLAttributes<HTMLDivElement>;
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export type TableProps = React.HTMLAttributes<HTMLTableElement>;
export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;
export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;
export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;
export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export type ToasterProps = HotToasterProps;

export interface LoadingScreenProps {
  message?: string;
  inline?: boolean;
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

export interface WithToastOptions {
  loading?: string;
  success?: string;
  error?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
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

export interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

export type AppLogoVariant = (typeof APP_LOGO_VARIANTS)[keyof typeof APP_LOGO_VARIANTS];

export interface AppLogoProps {
  /** Visual size variant — header (default) or auth screens. */
  variant?: AppLogoVariant;
  className?: string;
  priority?: boolean;
}

export interface SettingsPageHeaderProps {
  title: string;
  description: string;
}

export interface SettingsSectionNavItem {
  id: string;
  label: string;
}

export interface SettingsSectionNavProps {
  items: SettingsSectionNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
}
