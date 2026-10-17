/**
 * Append / replace UTM query params on absolute HTTP(S) URLs.
 */
import { UTM_CAMPAIGNS, UTM_MEDIUMS, UTM_PARAM_KEYS, type UtmBuildOptions } from "@constants/utm";

function extractSlugForContent(url: URL): string {
  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

/**
 * Returns the URL with SyncApp UTM params. Non-HTTP(S) or invalid URLs are returned unchanged.
 * Existing utm_* values are replaced so re-finalizing LinkedIn posts stays idempotent.
 */
export function appendUtmParams(rawUrl: string, options: UtmBuildOptions): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const medium = options.medium || UTM_MEDIUMS.SOCIAL;
    const campaign = options.campaign || UTM_CAMPAIGNS.SYNCAPP;
    const content = (options.content || extractSlugForContent(url)).trim();

    url.searchParams.set(UTM_PARAM_KEYS.SOURCE, options.source);
    url.searchParams.set(UTM_PARAM_KEYS.MEDIUM, medium);
    url.searchParams.set(UTM_PARAM_KEYS.CAMPAIGN, campaign);
    if (content) {
      url.searchParams.set(UTM_PARAM_KEYS.CONTENT, content);
    }

    return url.toString();
  } catch {
    return trimmed;
  }
}
