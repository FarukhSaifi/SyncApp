/**
 * SyncApp color palette — web globals.css + iOS 26 grouped backgrounds.
 */
import type { ThemeColors } from "../types/theme";

export type { ThemeColors } from "../types/theme";

/** Aligned with client `globals.css` v2 soft SaaS canvas. */
export const lightColors: ThemeColors = {
  background: "#f4f6f9",
  groupedBackground: "#f4f6f9",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  primary: "#8b5cf6",
  primaryForeground: "#ffffff",
  secondary: "#f0ebfb",
  secondaryForeground: "#4c1d95",
  muted: "#eceff4",
  mutedForeground: "#64748b",
  accent: "#3b82f6",
  accentForeground: "#ffffff",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  warning: "#f97316",
  warningForeground: "#ffffff",
  positive: "#22c55e",
  positiveForeground: "#ffffff",
  border: "#e2e6ee",
  input: "#e2e6ee",
  ring: "#8b5cf6",
  chrome: "rgba(255,255,255,0.78)",
  text: "#0f172a",
  textMuted: "#64748b",
  surface: "#eceff4",
  danger: "#ef4444",
  success: "#22c55e",
};

export const darkColors: ThemeColors = {
  background: "#15181e",
  groupedBackground: "#0c0d10",
  foreground: "#fafafa",
  card: "#1e2128",
  cardForeground: "#fafafa",
  primary: "#8b5cf6",
  primaryForeground: "#ffffff",
  secondary: "#352456",
  secondaryForeground: "#ede9fe",
  muted: "#242830",
  mutedForeground: "#a3a3a3",
  accent: "#3b82f6",
  accentForeground: "#ffffff",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  warning: "#f97316",
  warningForeground: "#ffffff",
  positive: "#22c55e",
  positiveForeground: "#ffffff",
  border: "#2c3038",
  input: "#2c3038",
  ring: "#8b5cf6",
  chrome: "rgba(28,28,30,0.85)",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  surface: "#242830",
  danger: "#ef4444",
  success: "#22c55e",
};

/** Fenced code-block mock colors in VisualBlockPreview (dark editor chrome). */
export const CODE_BLOCK_PREVIEW = Object.freeze({
  BACKGROUND: "#16181D",
  BORDER: "#262B35",
  HEADER_BORDER: "#333A48",
  LANG: "#8B949E",
  TEXT: "#E6EDF3",
} as const);
