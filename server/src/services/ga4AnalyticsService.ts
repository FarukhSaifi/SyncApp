/**
 * GA4 Data API reports for the public blog property (CANONICAL_BASE_URL host).
 * Uses GOOGLE_ANALYTICS_PROPERTY_ID + existing Google SA / ADC credentials.
 * Never logs credential values.
 */

import { config } from "@config";
import {
  AI_CONFIG,
  ANALYTICS_SYNC,
  DEFAULT_VALUES,
  ERROR_MESSAGES,
  GA4_EMPTY_TOTALS,
  GA4_REPORT,
  GA4_SOURCE_CHANNEL_MAP,
  GA4_TRAFFIC_CHANNELS,
} from "@constants";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { Ga4TrafficSourceRow, Ga4WebsiteAnalytics } from "@src/types/analytics";
import { hasGoogleCloudCredentialsEnv, loadGoogleServiceAccountCredentials } from "@utils/googleCredentials";
import { createLogger } from "@utils/logger";
import dayjs from "dayjs";

import type { Ga4TrafficChannelId } from "@constants/analytics";

import type { DateRangeInput } from "@types";

const logger = createLogger(GA4_REPORT.LOGGER_NAME);

function resolveDateRange(input: DateRangeInput): { startDate: string; endDate: string } {
  const end = input.endDate && dayjs(input.endDate).isValid() ? dayjs(input.endDate) : dayjs();
  const startDefault = end.subtract(
    ANALYTICS_SYNC["GA4_DEFAULT_DAYS"] - GA4_REPORT.INCLUSIVE_DAY_OFFSET,
    GA4_REPORT.DAY_UNIT,
  );
  const start = input.startDate && dayjs(input.startDate).isValid() ? dayjs(input.startDate) : startDefault;

  return {
    startDate: start.format(GA4_REPORT.DATE_FORMAT),
    endDate: end.format(GA4_REPORT.DATE_FORMAT),
  };
}

function mapSourceToChannel(source: string, medium: string): Ga4TrafficChannelId {
  const src = source.trim().toLowerCase();
  const med = medium.trim().toLowerCase();

  if (src === GA4_REPORT.SOURCE_DIRECT || (src === "" && med === GA4_REPORT.MEDIUM_NONE)) {
    return GA4_TRAFFIC_CHANNELS.DIRECT;
  }

  const mapped = GA4_SOURCE_CHANNEL_MAP[src as keyof typeof GA4_SOURCE_CHANNEL_MAP];
  if (mapped) {
    if (
      mapped === GA4_TRAFFIC_CHANNELS.GOOGLE_ORGANIC &&
      med &&
      med !== GA4_REPORT.MEDIUM_ORGANIC &&
      med !== GA4_REPORT.MEDIUM_NOT_SET
    ) {
      // Paid google etc. still bucket as other for organic-focused dashboard.
      if (med.includes(GA4_REPORT.MEDIUM_ORGANIC)) {
        return GA4_TRAFFIC_CHANNELS.GOOGLE_ORGANIC;
      }
      return GA4_TRAFFIC_CHANNELS.OTHER;
    }
    return mapped;
  }

  if (src.includes(GA4_REPORT.SOURCE_INCLUDES_LINKEDIN) || src.includes(GA4_REPORT.SOURCE_INCLUDES_LNKD)) {
    return GA4_TRAFFIC_CHANNELS.LINKEDIN;
  }
  if (src.includes(GA4_REPORT.SOURCE_INCLUDES_DEV_TO) || src.includes(GA4_REPORT.SOURCE_INCLUDES_DEVTO)) {
    return GA4_TRAFFIC_CHANNELS.DEVTO;
  }
  if (med === GA4_REPORT.MEDIUM_ORGANIC) {
    return GA4_TRAFFIC_CHANNELS.GOOGLE_ORGANIC;
  }

  return GA4_TRAFFIC_CHANNELS.OTHER;
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
  const n = Number(raw ?? GA4_REPORT.EMPTY_METRIC);
  return Number.isFinite(n) ? n : GA4_REPORT.EMPTY_METRIC;
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
      totals: { ...GA4_EMPTY_TOTALS },
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
      totals: { ...GA4_EMPTY_TOTALS },
      sources: [],
      topPages: [],
    };
  }

  const dateRange = resolveDateRange(range);
  const property = `${GA4_REPORT.PROPERTY_PATH_PREFIX}${config.googleAnalyticsPropertyId}`;
  const client = createGa4Client();
  const { METRICS, DIMENSIONS } = GA4_REPORT;

  try {
    const [[totalsResponse], [sourcesResponse], [pagesResponse]] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [{ name: METRICS.SESSIONS }, { name: METRICS.SCREEN_PAGE_VIEWS }, { name: METRICS.ACTIVE_USERS }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        dimensions: [{ name: DIMENSIONS.SESSION_SOURCE }, { name: DIMENSIONS.SESSION_MEDIUM }],
        metrics: [{ name: METRICS.SESSIONS }, { name: METRICS.SCREEN_PAGE_VIEWS }],
        orderBys: [{ metric: { metricName: METRICS.SESSIONS }, desc: true }],
        limit: ANALYTICS_SYNC["GA4_MAX_SOURCE_ROWS"],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        dimensions: [{ name: DIMENSIONS.PAGE_PATH }],
        metrics: [{ name: METRICS.SCREEN_PAGE_VIEWS }, { name: METRICS.SESSIONS }],
        orderBys: [{ metric: { metricName: METRICS.SCREEN_PAGE_VIEWS }, desc: true }],
        limit: ANALYTICS_SYNC["GA4_MAX_PAGE_ROWS"],
      }),
    ]);

    const totalsRow = totalsResponse.rows?.[0];
    const totals = {
      sessions: totalsRow ? metricValue(totalsRow, GA4_REPORT.TOTALS_METRIC_SESSIONS) : GA4_REPORT.EMPTY_METRIC,
      pageviews: totalsRow ? metricValue(totalsRow, GA4_REPORT.TOTALS_METRIC_PAGEVIEWS) : GA4_REPORT.EMPTY_METRIC,
      activeUsers: totalsRow ? metricValue(totalsRow, GA4_REPORT.TOTALS_METRIC_ACTIVE_USERS) : GA4_REPORT.EMPTY_METRIC,
    };

    const channelBuckets = new Map<Ga4TrafficChannelId, Ga4TrafficSourceRow>();
    for (const row of sourcesResponse.rows || []) {
      const source = row.dimensionValues?.[GA4_REPORT.DIMENSION_SOURCE]?.value || GA4_REPORT.SOURCE_DIRECT;
      const medium = row.dimensionValues?.[GA4_REPORT.DIMENSION_MEDIUM]?.value || GA4_REPORT.MEDIUM_NONE;
      const channel = mapSourceToChannel(source, medium);
      const sessions = metricValue(row, GA4_REPORT.ROW_METRIC_PRIMARY);
      const pageviews = metricValue(row, GA4_REPORT.ROW_METRIC_SECONDARY);
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
      path: row.dimensionValues?.[GA4_REPORT.DIMENSION_PATH]?.value || GA4_REPORT.EMPTY_PATH,
      pageviews: metricValue(row, GA4_REPORT.ROW_METRIC_PRIMARY),
      sessions: metricValue(row, GA4_REPORT.ROW_METRIC_SECONDARY),
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
    logger.warn(
      `${GA4_REPORT.RUN_REPORT_FAILED_LOG_PREFIX}${message.slice(0, DEFAULT_VALUES.ERROR_SNIPPET_LONG_CHARS)}`,
    );
    // Soft-fail so admin analytics dashboards still load when GA4 is misconfigured.
    return {
      configured: false,
      setupRequired: true,
      message: `${ERROR_MESSAGES["ANALYTICS_GA4_FETCH_FAILED"]}: ${message.slice(0, DEFAULT_VALUES.ERROR_SNIPPET_MEDIUM_CHARS)}`,
      propertyIdSet: true,
      credentialsAvailable: true,
      dateRange,
      totals: { ...GA4_EMPTY_TOTALS },
      sources: [],
      topPages: [],
    };
  }
}
