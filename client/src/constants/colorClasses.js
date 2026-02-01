/**
 * Tailwind Color Classes - Semantic Usage
 * Maps common color patterns to theme-aware classes
 */

export const COLOR_CLASSES = Object.freeze({
  // Icon backgrounds
  ICON_BG: {
    WARNING: "bg-warning/15",
    PRIMARY: "bg-primary/15",
    ACCENT: "bg-accent/15",
    POSITIVE: "bg-positive/15",
    DESTRUCTIVE: "bg-destructive/15",
  },

  // Icon colors
  ICON_COLOR: {
    WARNING: "text-warning",
    PRIMARY: "text-primary",
    ACCENT: "text-accent",
    POSITIVE: "text-positive",
    DESTRUCTIVE: "text-destructive",
  },

  // Alert/Info boxes
  ALERT_BG: {
    WARNING: "bg-warning/10 border-warning/30",
    PRIMARY: "bg-primary/10 border-primary/30",
    ACCENT: "bg-accent/10 border-accent/30",
    POSITIVE: "bg-positive/10 border-positive/30",
    DESTRUCTIVE: "bg-destructive/10 border-destructive/30",
  },

  // Alert text
  ALERT_TEXT: {
    WARNING: "text-warning",
    PRIMARY: "text-primary",
    ACCENT: "text-accent",
    POSITIVE: "text-positive",
    DESTRUCTIVE: "text-destructive",
  },

  // Button hover states (for icon buttons/links)
  HOVER_DESTRUCTIVE: "hover:text-destructive/90 hover:bg-destructive/10",
  HOVER_WARNING: "hover:text-warning/90 hover:bg-warning/10",
  HOVER_PRIMARY: "hover:text-primary/90 hover:bg-primary/10",

  // Status indicators (dots)
  STATUS_DOT: {
    WARNING: "text-warning",
    PRIMARY: "text-primary",
    ACCENT: "text-accent",
    POSITIVE: "text-positive",
  },

  // Badge colors (for roles, statuses)
  BADGE: {
    ADMIN: "bg-accent/15 text-accent",
    VERIFIED: "bg-positive/15 text-positive",
    UNVERIFIED: "bg-warning/15 text-warning",
  },
});
