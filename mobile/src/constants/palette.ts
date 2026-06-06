/**
 * SyncApp color palette — web globals.css + iOS 26 grouped backgrounds.
 */
export interface ThemeColors {
  background: string;
  foreground: string;
  /** Screen / grouped list background (iOS systemGroupedBackground) */
  groupedBackground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  warning: string;
  warningForeground: string;
  positive: string;
  positiveForeground: string;
  border: string;
  input: string;
  ring: string;
  /** Frosted chrome tint */
  chrome: string;
  /** @deprecated use foreground */
  text: string;
  /** @deprecated use mutedForeground */
  textMuted: string;
  /** @deprecated use card */
  surface: string;
  /** @deprecated use destructive */
  danger: string;
  /** @deprecated use positive */
  success: string;
}

export const lightColors: ThemeColors = {
  background: "#ffffff",
  groupedBackground: "#f2f2f7",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  primary: "#8b5cf6",
  primaryForeground: "#ffffff",
  secondary: "#ede9fe",
  secondaryForeground: "#4c1d95",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  accent: "#3b82f6",
  accentForeground: "#ffffff",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  warning: "#f97316",
  warningForeground: "#ffffff",
  positive: "#22c55e",
  positiveForeground: "#ffffff",
  border: "#e2e8f0",
  input: "#e2e8f0",
  ring: "#8b5cf6",
  chrome: "rgba(255,255,255,0.72)",
  text: "#0f172a",
  textMuted: "#64748b",
  surface: "#f1f5f9",
  danger: "#ef4444",
  success: "#22c55e",
};

export const darkColors: ThemeColors = {
  background: "#1a1d23",
  groupedBackground: "#000000",
  foreground: "#fafafa",
  card: "#1f2229",
  cardForeground: "#fafafa",
  primary: "#8b5cf6",
  primaryForeground: "#ffffff",
  secondary: "#3b2667",
  secondaryForeground: "#ede9fe",
  muted: "#272b33",
  mutedForeground: "#a3a3a3",
  accent: "#3b82f6",
  accentForeground: "#ffffff",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  warning: "#f97316",
  warningForeground: "#ffffff",
  positive: "#22c55e",
  positiveForeground: "#ffffff",
  border: "#30353e",
  input: "#30353e",
  ring: "#8b5cf6",
  chrome: "rgba(28,28,30,0.82)",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  surface: "#272b33",
  danger: "#ef4444",
  success: "#22c55e",
};
