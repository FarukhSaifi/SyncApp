/**
 * SyncApp color palette shape — web globals.css + iOS 26 grouped backgrounds.
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

export type StatusTone = "muted" | "positive" | "warning";
