/**
 * UTM conventions for outbound SyncApp → public blog links (GA4 attribution).
 * Canonical SEO URLs stay clean; marketing / Read more links get these params.
 * See docs/ANALYTICS_PLAN.md Phase 0.
 */
export const UTM_PARAM_KEYS = Object.freeze({
  SOURCE: "utm_source",
  MEDIUM: "utm_medium",
  CAMPAIGN: "utm_campaign",
  CONTENT: "utm_content",
} as const);

export const UTM_SOURCES = Object.freeze({
  LINKEDIN: "linkedin",
  DEVTO: "devto",
  MEDIUM: "medium",
  WORDPRESS: "wordpress",
  SYNCAPP: "syncapp",
} as const);

export const UTM_MEDIUMS = Object.freeze({
  SOCIAL: "social",
} as const);

export const UTM_CAMPAIGNS = Object.freeze({
  SYNCAPP: "syncapp",
} as const);

export type UtmSource = (typeof UTM_SOURCES)[keyof typeof UTM_SOURCES];
export type UtmMedium = (typeof UTM_MEDIUMS)[keyof typeof UTM_MEDIUMS];

export type UtmBuildOptions = {
  source: UtmSource | string;
  medium?: UtmMedium | string;
  campaign?: string;
  content?: string;
};
