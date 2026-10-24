import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import type {
  ImageStyle,
  StyleProp,
  TextInputProps,
  ViewProps,
  ViewStyle,
} from "react-native";
import type { ToastConfigParams } from "react-native-toast-message";

import { BUTTON_SIZES, BUTTON_VARIANTS, INPUT_SIZES } from "@constants/designTokens";
import type { OptimizationTarget, PlatformSlug, PLATFORMS } from "@constants/platforms";

import type { EditorForm, EditorMode, EditorReadiness, Post, User } from "./index";

export type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS] | "danger";
export type ButtonSize = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  size?: (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];
  containerStyle?: StyleProp<ViewStyle>;
}

export type PasswordInputProps = Omit<InputProps, "secureTextEntry">;

export interface CardProps extends ViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  grouped?: boolean;
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  trailing?: ReactNode;
  align?: "start" | "center";
}

export interface CardContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export interface UserCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

export interface PostCardProps {
  post: Post;
  onPress: () => void;
  onDelete: () => void;
}

export type ThemeToggleButtonProps = {
  variant?: "header" | "floating";
};

export interface SettingsSectionNavItem {
  id: string;
  label: string;
}

export interface SettingsSectionNavProps {
  items: SettingsSectionNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export interface IconHeaderButtonProps {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface ScreenIntroProps {
  title?: string;
  description: string;
}

export interface ConnectionStatusPillProps {
  connected: boolean;
  saved?: boolean;
}

export type StatusPillTone = "positive" | "muted" | "primary" | "warning" | "destructive";

export interface StatusPillProps {
  label: string;
  tone?: StatusPillTone;
}

export type AppLogoVariant = "header" | "auth";

export type AppLogoProps = {
  variant?: AppLogoVariant;
  style?: StyleProp<ImageStyle>;
};

export type HeaderActionSlotProps = {
  children: ReactNode;
  edge?: "left" | "right";
};

export interface TabBarGlassProps {
  style?: StyleProp<ViewStyle>;
}

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export interface LoadingScreenProps {
  message?: string;
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface ImagePreviewFrameProps {
  generating: boolean;
  uri: string | null;
  emptyHint?: string;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
}

export interface ImageDataUrlPreviewProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export interface GlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  borderRadius: number;
  interactive?: boolean;
}

export interface CoverImagePreviewProps {
  uri: string;
  onRemove?: () => void;
  onPress?: () => void;
}

export type GlassToastVariant = "success" | "error" | "info";

export type GlassToastCardProps = ToastConfigParams<object> & {
  variant: GlassToastVariant;
};

export interface ContentBlockDef {
  id: string;
  category: "text" | "lists" | "code" | "media";
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  template: string;
  accent?: string;
}

export interface BlockInserterSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectBlock: (template: string) => void;
  onTriggerAiImage?: () => void;
}

export interface EditorWorkspaceProps {
  form: EditorForm;
  saving: boolean;
  publishing: boolean;
  aiLoading: boolean;
  readiness: EditorReadiness;
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
  handleSave: (forceStatus?: string) => Promise<Post | null>;
  publish: (platform: string, savedPostId?: string) => Promise<void>;
  publishAll: (savedPostId?: string) => Promise<void>;
  unpublish: (platform: string) => Promise<void>;
  generatePost: (keyword: string) => Promise<void>;
  generateLinkedInSummary: () => Promise<void>;
  uploadCoverFromUri: (uri: string, filename: string, mimeType: string) => Promise<string | null>;
  aiEdit: (action: string) => Promise<void>;
  openGenerateImage: () => void;
  platforms: typeof PLATFORMS;
  connectedPlatforms: PlatformSlug[];
  loadingPlatforms?: boolean;
  platformStatus?: Post["platform_status"];
  aiTargetPlatforms: OptimizationTarget[];
  toggleAiTargetPlatform: (target: OptimizationTarget) => void;
}

export interface AiCopilotSheetProps {
  visible: boolean;
  onClose: () => void;
  currentContent: string;
  onAcceptReplace: (newContent: string) => void;
  onAcceptAppend: (newContent: string) => void;
  onAiEdit: (action: string) => Promise<string | void>;
  onGeneratePost: (topic: string) => Promise<void>;
  aiLoading: boolean;
  aiTargetPlatforms: OptimizationTarget[];
  toggleAiTargetPlatform: (target: OptimizationTarget) => void;
}

export interface ReviewPublishSheetProps {
  visible: boolean;
  form: EditorForm;
  readiness: EditorReadiness;
  connectedPlatforms: PlatformSlug[];
  selectedPlatforms: PlatformSlug[];
  togglePlatform: (platform: PlatformSlug) => void;
  onClose: () => void;
  onPublish: () => void;
  publishing: boolean;
}

export interface DetailsTabProps {
  form: EditorForm;
  connectedPlatforms: PlatformSlug[];
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
}

export interface ChannelsTabProps {
  form: EditorForm;
  platforms: typeof PLATFORMS;
  connectedPlatforms: PlatformSlug[];
  loadingPlatforms?: boolean;
  selectedPlatforms: PlatformSlug[];
  togglePlatform: (platform: PlatformSlug) => void;
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
  generateLinkedInSummary: () => Promise<void>;
  aiLoading: boolean;
  platformStatus?: Post["platform_status"];
  unpublish: (platform: string) => Promise<void>;
  publishing: boolean;
}

export interface VisualBlockPreviewProps {
  title: string;
  markdown: string;
  coverImage?: string;
  onToggleCheckbox?: (lineIndex: number) => void;
}

export type ParsedBlock =
  | { type: "h1"; text: string; id: string }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string; id: string }
  | { type: "quote"; text: string; id: string }
  | { type: "code"; code: string; lang: string; id: string }
  | { type: "bullet"; text: string; id: string }
  | { type: "numbered"; num: string; text: string; id: string }
  | { type: "checklist"; checked: boolean; text: string; lineIndex: number; id: string }
  | { type: "divider"; id: string }
  | { type: "image"; alt: string; url: string; id: string }
  | { type: "paragraph"; text: string; id: string };

export interface FormattingAccessoryBarProps {
  onOpenBlockInserter: () => void;
  onOpenAiStudio: () => void;
  onFormat: (prefix: string, suffix?: string, defaultText?: string) => void;
}

export interface FormatTool {
  id: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  prefix: string;
  suffix?: string;
  defaultText?: string;
  tooltip: string;
}

export interface EditorModeTabsProps {
  mode: EditorMode;
  onChangeMode: (mode: EditorMode) => void;
  channelCount: number;
}

export interface WriteTabProps {
  form: EditorForm;
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
  openGenerateImage: () => void;
  uploadCoverFromUri: (uri: string, filename: string, mimeType: string) => Promise<string | null>;
  aiEdit: (action: string) => Promise<string | void>;
  generatePost: (topic: string) => Promise<void>;
  aiLoading: boolean;
  aiTargetPlatforms: OptimizationTarget[];
  toggleAiTargetPlatform: (target: OptimizationTarget) => void;
}

export interface EditorHeaderProps {
  title: string;
  wordCount: number;
  saving: boolean;
  isDirty?: boolean;
  readiness: EditorReadiness;
  onOpenReview: () => void;
}

export interface GlassSurfaceLayerProps {
  isDark: boolean;
  interactive: boolean;
}
