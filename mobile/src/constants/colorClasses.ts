import type { ThemeColors } from "@/src/constants/palette";

/** Semantic badge / alert styles for React Native — mirrors client colorClasses.ts */
export function getBadgeStyles(colors: ThemeColors) {
  return {
    admin: { backgroundColor: `${colors.accent}26`, color: colors.accent },
    verified: { backgroundColor: `${colors.positive}26`, color: colors.positive },
    unverified: { backgroundColor: `${colors.warning}26`, color: colors.warning },
    primary: { backgroundColor: `${colors.primary}26`, color: colors.primary },
  } as const;
}

export const ANALYTICS_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444"] as const;
