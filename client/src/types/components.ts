import React from "react";
import type { Editor } from "@tiptap/react";
import { BUTTON_SIZES, BUTTON_VARIANTS, INPUT_SIZES, PILL_SIZES } from "@constants/designTokens";
import type { PostData, UserData } from "./models";

export type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonSize = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
export type InputSize = (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];
export type PillSize = keyof typeof PILL_SIZES;
export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
export type IconComponent = React.ComponentType<{ className?: string }>;
export type PostCoverThumbSize = "sm" | "md";

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

export interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> {
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

export interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledFor: string;
  onScheduleSave: (value: string) => Promise<boolean>;
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
    title: string;
    content_markdown: string;
    meta_description?: string;
    cover_image?: string;
    tags?: string[];
  };
  compact?: boolean;
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
