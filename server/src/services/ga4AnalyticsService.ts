/**
 * GA4 Data API reports for the public blog property (CANONICAL_BASE_URL host).
 * Uses GOOGLE_ANALYTICS_PROPERTY_ID + existing Google SA / ADC credentials.
 * Never logs credential values.
 */

import { config } from "@config";
import { AI_CONFIG, ANALYTICS_SYNC, ERROR_MESSAGES, GA4_SOURCE_CHANNEL_MAP } from "@constants";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { Ga4TrafficSourceRow, Ga4WebsiteAnalytics } from "@src/types/analytics";
import { hasGoogleCloudCredentialsEnv, loadGoogleServiceAccountCredentials } from "@utils/googleCredentials";
import { createLogger } from "@utils/logger";
import dayjs from "dayjs";

import type { Ga4TrafficChannelId } from "@constants/analytics";

const logger = createLogger("GA4_ANALYTICS");

type DateRangeInput = {
  startDate?: string;
  endDate?: string;
};

function resolveDateRange(input: DateRangeInput): { startDate: string; endDate: string } {
  const end = input.endDate && dayjs(input.endDate).isValid() ? dayjs(input.endDate) : dayjs();
  const startDefault = end.subtract(ANALYTICS_SYNC["GA4_DEFAULT_DAYS"] - 1, "day");
  const start = input.startDate && dayjs(input.startDate).isValid() ? dayjs(input.startDate) : startDefault;

  return {
    startDate: start.format("YYYY-MM-DD"),
    endDate: end.format("YYYY-MM-DD"),
  };
}

function mapSourceToChannel(source: string, medium: string): Ga4TrafficChannelId {
  const src = source.trim().toLowerCase();
  const med = medium.trim().toLowerCase();

  if (src === "(direct)" || (src === "" && med === "(none)")) {
    return "direct";
  }

  const mapped = GA4_SOURCE_CHANNEL_MAP[src as keyof typeof GA4_SOURCE_CHANNEL_MAP];
  if (mapped) {
    if (mapped === "google_organic" && med && med !== "organic" && med !== "(not set)") {
      // Paid google etc. still bucket as other for organic-focused dashboard.
      if (med.includes("organic")) {
        return "google_organic";
      }
      return "other";
    }
    return mapped;
  }

  if (src.includes("linkedin") || src.includes("lnkd")) {
    return "linkedin";
  }
  if (src.includes("dev.to") || src.includes("devto")) {
    return "devto";
  }
  if (med === "organic") {
    return "google_organic";
  }

  return "other";
}

function createGa4Client(): BetaAnalyticsDataClient {
  const sa = loadGoogleServiceAccountCredentials();
  const clientEmail = sa?.[AI_CONFIG["CREDENTIAL_FIELD_CLIENT_EMAIL"]];
  const privateKey = sa?.[AI_CONFIG["CREDENTIAL_FIELD_PRIVATE_KEY"]];
  const projectId = sa?.[AI_CONFIG["CREDENTIAL_FIELD_PROJECT_ID"]];

  if (typeof clientEmail === "string" && typeof privateKey === "string") {
    return new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      projectId: typeof projectId === "string" ? projectId : undefined,
    });
  }

  // Fall through to ADC (GOOGLE_APPLICATION_CREDENTIALS) if JSON env is unset.
  return new BetaAnalyticsDataClient();
}

function metricValue(row: { metricValues?: Array<{ value?: string | null }> | null }, index: number): number {
  const raw = row.metricValues?.[index]?.value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function isGa4Configured(): boolean {
  return Boolean(config.googleAnalyticsPropertyId.trim());
}

export function getGa4ConfigStatus(): { configured: boolean; propertyIdSet: boolean; credentialsAvailable: boolean } {
  const propertyIdSet = Boolean(config.googleAnalyticsPropertyId.trim());
  const credentialsAvailable = hasGoogleCloudCredentialsEnv();
  return {
    configured: propertyIdSet && credentialsAvailable,
    propertyIdSet,
    credentialsAvailable,
  };
}

/**
 * Fetch website sessions, pageviews, and traffic sources for the configured GA4 property.
 */
export async function getWebsiteAnalytics(range: DateRangeInput = {}): Promise<Ga4WebsiteAnalytics> {
  const status = getGa4ConfigStatus();
  if (!status.propertyIdSet) {
    return {
      configured: false,
      setupRequired: true,
      message: ERROR_MESSAGES["ANALYTICS_GA4_NOT_CONFIGURED"],
      propertyIdSet: false,
      credentialsAvailable: status.credentialsAvailable,
      dateRange: resolveDateRange(range),
      totals: { sessions: 0, pageviews: 0, activeUsers: 0 },
      sources: [],
      topPages: [],
    };
  }

  if (!status.credentialsAvailable) {
    return {
      configured: false,
      setupRequired: true,
      message: ERROR_MESSAGES["ANALYTICS_GA4_CREDENTIALS_MISSING"],
      propertyIdSet: true,
      credentialsAvailable: false,
      dateRange: resolveDateRange(range),
      totals: { sessions: 0, pageviews: 0, activeUsers: 0 },
      sources: [],
      topPages: [],
    };
  }

  const dateRange = resolveDateRange(range);
  const property = `properties/${config.googleAnalyticsPropertyId}`;
  const client = createGa4Client();

  try {
    const [[totalsResponse], [sourcesResponse], [pagesResponse]] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }, { name: "activeUsers" }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: ANALYTICS_SYNC["GA4_MAX_SOURCE_ROWS"],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: ANALYTICS_SYNC["GA4_MAX_PAGE_ROWS"],
      }),
    ]);

    const totalsRow = totalsResponse.rows?.[0];
    const totals = {
      sessions: totalsRow ? metricValue(totalsRow, 0) : 0,
      pageviews: totalsRow ? metricValue(totalsRow, 1) : 0,
      activeUsers: totalsRow ? metricValue(totalsRow, 2) : 0,
    };

    const channelBuckets = new Map<Ga4TrafficChannelId, Ga4TrafficSourceRow>();
    for (const row of sourcesResponse.rows || []) {
      const source = row.dimensionValues?.[0]?.value || "(direct)";
      const medium = row.dimensionValues?.[1]?.value || "(none)";
      const channel = mapSourceToChannel(source, medium);
      const sessions = metricValue(row, 0);
      const pageviews = metricValue(row, 1);
      const existing = channelBuckets.get(channel);
      if (existing) {
        existing.sessions += sessions;
        existing.pageviews += pageviews;
      } else {
        channelBuckets.set(channel, {
          id: channel,
          source,
          medium,
          sessions,
          pageviews,
        });
      }
    }

    const sources = [...channelBuckets.values()].sort((a, b) => b.sessions - a.sessions);

    const topPages = (pagesResponse.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      pageviews: metricValue(row, 0),
      sessions: metricValue(row, 1),
    }));

    return {
      configured: true,
      setupRequired: false,
      message: null,
      propertyIdSet: true,
      credentialsAvailable: true,
      dateRange,
      totals,
      sources,
      topPages,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`GA4 runReport failed: ${message.slice(0, 200)}`);
    // Soft-fail so admin analytics dashboards still load when GA4 is misconfigured.
    return {
      configured: false,
      setupRequired: true,
      message: `${ERROR_MESSAGES["ANALYTICS_GA4_FETCH_FAILED"]}: ${message.slice(0, 160)}`,
      propertyIdSet: true,
      credentialsAvailable: true,
      dateRange,
      totals: { sessions: 0, pageviews: 0, activeUsers: 0 },
      sources: [],
      topPages: [],
    };
  }
}
