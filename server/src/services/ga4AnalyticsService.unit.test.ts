import { config } from "@config";
import { GA4_REPORT } from "@constants";
import * as googleCredentials from "@utils/googleCredentials";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Ga4ReportRequest = { dimensions?: Array<{ name?: string }> };
type Ga4ReportResponse = Array<{
  rows?: Array<{
    metricValues?: Array<{ value: string }>;
    dimensionValues?: Array<{ value: string }>;
  }>;
}>;

const runReport = vi.hoisted(() =>
  vi.fn(async (_req?: Ga4ReportRequest): Promise<Ga4ReportResponse> => [
    {
      rows: [
        {
          metricValues: [{ value: "100" }, { value: "250" }, { value: "80" }],
          dimensionValues: [{ value: "google" }, { value: "organic" }],
        },
      ],
    },
  ]),
);

vi.mock("@google-analytics/data", () => ({
  BetaAnalyticsDataClient: vi.fn(() => ({ runReport })),
}));

import { getWebsiteAnalytics } from "./ga4AnalyticsService";

describe("ga4AnalyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.googleAnalyticsPropertyId = "123456789";
    vi.spyOn(googleCredentials, "hasGoogleCloudCredentialsEnv").mockReturnValue(true);
    vi.spyOn(googleCredentials, "loadGoogleServiceAccountCredentials").mockReturnValue({
      client_email: "sa@test.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
      project_id: "proj",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns setupRequired when GA4 credentials env missing", async () => {
    vi.mocked(googleCredentials.hasGoogleCloudCredentialsEnv).mockReturnValue(false);
    const result = await getWebsiteAnalytics();
    expect(result.configured).toBe(false);
    expect(result.credentialsAvailable).toBe(false);
    expect(result.propertyIdSet).toBe(true);
  });

  it("returns setupRequired when property id missing", async () => {
    config.googleAnalyticsPropertyId = "";
    const result = await getWebsiteAnalytics();
    expect(result.configured).toBe(false);
    expect(result.setupRequired).toBe(true);
  });

  it("returns analytics totals when GA4 reports succeed", async () => {
    runReport.mockImplementation(async (req?: Ga4ReportRequest) => {
      if (req?.dimensions?.some((d) => d.name === GA4_REPORT.DIMENSIONS.PAGE_PATH)) {
        return [{ rows: [{ dimensionValues: [{ value: "/blog" }], metricValues: [{ value: "50" }, { value: "20" }] }] }];
      }
      if (req?.dimensions) {
        return [
          {
            rows: [
              {
                dimensionValues: [{ value: "google" }, { value: "organic" }],
                metricValues: [{ value: "40" }, { value: "100" }],
              },
            ],
          },
        ];
      }
      return [
        {
          rows: [
            {
              metricValues: [{ value: "100" }, { value: "250" }, { value: "80" }],
              dimensionValues: [],
            },
          ],
        },
      ];
    });

    const result = await getWebsiteAnalytics();
    expect(result.configured).toBe(true);
    expect(result.totals.sessions).toBe(100);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.topPages[0].path).toBe("/blog");
  });

  it("soft-fails when runReport throws", async () => {
    runReport.mockRejectedValue(new Error("quota exceeded"));
    const result = await getWebsiteAnalytics();
    expect(result.configured).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it("honors custom date range input", async () => {
    runReport.mockResolvedValue([
      { rows: [{ metricValues: [{ value: "5" }, { value: "10" }, { value: "2" }], dimensionValues: [] }] },
    ]);
    const result = await getWebsiteAnalytics({ startDate: "2026-01-01", endDate: "2026-01-31" });
    expect(result.configured).toBe(true);
    expect(result.dateRange.startDate).toBe("2026-01-01");
    expect(result.dateRange.endDate).toBe("2026-01-31");
  });

  it("returns setupRequired when credentials env is missing", async () => {
    vi.spyOn(googleCredentials, "hasGoogleCloudCredentialsEnv").mockReturnValue(false);
    const result = await getWebsiteAnalytics();
    expect(result.configured).toBe(false);
    expect(result.credentialsAvailable).toBe(false);
    expect(result.propertyIdSet).toBe(true);
  });

  it("aggregates multiple source rows into the same channel bucket", async () => {
    runReport.mockImplementation(async (req?: Ga4ReportRequest) => {
      if (req?.dimensions?.some((d) => d.name === GA4_REPORT.DIMENSIONS.SESSION_SOURCE)) {
        return [
          {
            rows: [
              {
                dimensionValues: [{ value: "(direct)" }, { value: "(none)" }],
                metricValues: [{ value: "5" }, { value: "10" }],
              },
              {
                dimensionValues: [{ value: "(direct)" }, { value: "(none)" }],
                metricValues: [{ value: "3" }, { value: "4" }],
              },
            ],
          },
        ];
      }
      if (req?.dimensions?.some((d) => d.name === GA4_REPORT.DIMENSIONS.PAGE_PATH)) {
        return [{ rows: [] }];
      }
      return [
        {
          rows: [
            {
              metricValues: [{ value: "8" }, { value: "14" }, { value: "6" }],
              dimensionValues: [],
            },
          ],
        },
      ];
    });

    const result = await getWebsiteAnalytics();
    const direct = result.sources.find((s) => s.id === "direct");
    expect(direct?.sessions).toBe(8);
  });

  it("uses ADC client when service account fields are incomplete", async () => {
    vi.spyOn(googleCredentials, "loadGoogleServiceAccountCredentials").mockReturnValue({
      project_id: "proj-only",
    } as never);
    runReport.mockResolvedValue([
      { rows: [{ metricValues: [{ value: "1" }, { value: "2" }, { value: "1" }], dimensionValues: [] }] },
    ]);
    const result = await getWebsiteAnalytics();
    expect(result.configured).toBe(true);
    expect(runReport).toHaveBeenCalled();
  });

  it("maps linkedin source rows into traffic channels", async () => {
    runReport.mockImplementation(async (req?: Ga4ReportRequest) => {
      if (req?.dimensions?.some((d) => d.name === GA4_REPORT.DIMENSIONS.SESSION_SOURCE)) {
        return [
          {
            rows: [
              {
                dimensionValues: [{ value: "linkedin.com" }, { value: "social" }],
                metricValues: [{ value: "12" }, { value: "30" }],
              },
            ],
          },
        ];
      }
      if (req?.dimensions?.some((d) => d.name === GA4_REPORT.DIMENSIONS.PAGE_PATH)) {
        return [{ rows: [] }];
      }
      return [
        {
          rows: [
            {
              metricValues: [{ value: "12" }, { value: "30" }, { value: "8" }],
              dimensionValues: [],
            },
          ],
        },
      ];
    });

    const result = await getWebsiteAnalytics();
    expect(result.sources.some((s) => s.id === "linkedin" || s.source.includes("linkedin"))).toBe(true);
  });
});
