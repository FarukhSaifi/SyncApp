"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ANALYTICS_AVAILABILITY,
  ANALYTICS_CHART_COLORS,
  ANALYTICS_CHART_KEYS,
  ANALYTICS_DATE_FIELDS,
  ANALYTICS_DATE_PRESET_OPTIONS,
  ANALYTICS_LABELS,
  ANALYTICS_OVERVIEW_CARD_IDS,
  ANALYTICS_UI,
  APP_CONFIG,
  USER_ROLES,
} from "@constants";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@hooks/useToast";
import type {
  AnalyticsDateRange,
  AnalyticsOverviewCardModel,
  AnalyticsStats,
  AnalyticsStatusChartDatum,
  DevtoEngagementSummary,
  Ga4WebsiteAnalytics,
} from "@types";
import {
  buildOverviewCards,
  buildPlatformRows,
  buildTrafficSources,
  createDefaultDateRange,
  filterHistoryByRange,
  topEngagementPosts,
} from "@utils/analyticsDashboard";
import { apiClient } from "@utils/apiClient";
import dayjs from "dayjs";
import {
  FiActivity,
  FiBarChart2,
  FiExternalLink,
  FiEye,
  FiGlobe,
  FiMousePointer,
  FiPieChart,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BUTTON_SIZES, BUTTON_VARIANTS, INPUT_SIZES } from "@constants/designTokens";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import Input from "@components/common/Input";
import Skeleton from "@components/common/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/common/Table";

function formatMetric(value: number | null | undefined, available: boolean): string {
  if (!available || value === null || value === undefined) {
    return ANALYTICS_LABELS["METRIC_UNAVAILABLE"];
  }
  return value.toLocaleString();
}

function availabilityBadgeLabel(availability: AnalyticsOverviewCardModel["availability"]): string {
  if (availability === ANALYTICS_AVAILABILITY["LIVE"]) {
    return ANALYTICS_LABELS["PHASE_BADGE_LIVE"];
  }
  if (availability === ANALYTICS_AVAILABILITY["SOON"]) {
    return ANALYTICS_LABELS["PHASE_BADGE_SOON"];
  }
  return ANALYTICS_LABELS["PHASE_BADGE_EMPTY"];
}

function availabilityBadgeClass(availability: AnalyticsOverviewCardModel["availability"]): string {
  if (availability === ANALYTICS_AVAILABILITY["LIVE"]) {
    return `${ANALYTICS_UI["BADGE_BASE"]} ${ANALYTICS_UI["BADGE_LIVE"]}`;
  }
  if (availability === ANALYTICS_AVAILABILITY["SOON"]) {
    return `${ANALYTICS_UI["BADGE_BASE"]} ${ANALYTICS_UI["BADGE_SOON"]}`;
  }
  return `${ANALYTICS_UI["BADGE_BASE"]} ${ANALYTICS_UI["BADGE_EMPTY"]}`;
}

function overviewCardIcon(cardId: string) {
  const iconClass = ANALYTICS_UI["ICON_SM"];
  if (cardId === ANALYTICS_OVERVIEW_CARD_IDS["VIEWS"]) {
    return <FiEye className={iconClass} aria-hidden />;
  }
  if (cardId === ANALYTICS_OVERVIEW_CARD_IDS["CLICKS"]) {
    return <FiMousePointer className={iconClass} aria-hidden />;
  }
  if (cardId === ANALYTICS_OVERVIEW_CARD_IDS["ENGAGEMENT"]) {
    return <FiActivity className={iconClass} aria-hidden />;
  }
  if (cardId === ANALYTICS_OVERVIEW_CARD_IDS["TOTAL_POSTS"]) {
    return <FiGlobe className={iconClass} aria-hidden />;
  }
  if (cardId === ANALYTICS_OVERVIEW_CARD_IDS["PUBLISHED"]) {
    return <FiTrendingUp className={iconClass} aria-hidden />;
  }
  if (cardId === ANALYTICS_OVERVIEW_CARD_IDS["DRAFTS"]) {
    return <FiPieChart className={iconClass} aria-hidden />;
  }
  return null;
}

const Analytics = () => {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [engagement, setEngagement] = useState<DevtoEngagementSummary | null>(null);
  const [website, setWebsite] = useState<Ga4WebsiteAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [range, setRange] = useState<AnalyticsDateRange>(() => createDefaultDateRange());

  const chartPalette = ANALYTICS_CHART_COLORS["SERIES"];
  const tooltipContentStyle = useMemo(
    () => ({
      backgroundColor: ANALYTICS_CHART_COLORS["CARD"],
      border: `1px solid ${ANALYTICS_CHART_COLORS["BORDER"]}`,
      borderRadius: `${ANALYTICS_UI["TOOLTIP_BORDER_RADIUS_PX"]}px`,
      color: ANALYTICS_CHART_COLORS["FOREGROUND"],
    }),
    [],
  );
  const axisTick = useMemo(
    () => ({
      fill: ANALYTICS_CHART_COLORS["MUTED_FG"],
      fontSize: ANALYTICS_UI["CHART_FONT_SIZE"],
    }),
    [],
  );
  const axisTickSm = useMemo(
    () => ({
      fill: ANALYTICS_CHART_COLORS["MUTED_FG"],
      fontSize: ANALYTICS_UI["CHART_FONT_SIZE_SM"],
    }),
    [],
  );

  const loadAll = useCallback(
    async (nextRange: AnalyticsDateRange, options?: { syncDevto?: boolean }) => {
      const syncDevto = options?.syncDevto === true;
      try {
        if (syncDevto) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [statsRes, engagementRes, websiteRes] = await Promise.all([
          apiClient.getAnalyticsStats(),
          syncDevto
            ? apiClient.refreshAnalyticsEngagement().then((res) => ({
                success: res.success,
                data: res.data?.summary,
                error: res.error,
                message: res.message,
              }))
            : apiClient.getAnalyticsEngagement(),
          isAdmin
            ? apiClient.getAnalyticsWebsite({
                startDate: nextRange.start,
                endDate: nextRange.end,
              })
            : Promise.resolve({ success: true as const, data: null }),
        ]);

        if (statsRes?.success) {
          setStats(statsRes.data ?? null);
        } else {
          toast.apiError(statsRes?.error || ANALYTICS_LABELS["LOAD_FAILED"]);
        }

        if (engagementRes?.success) {
          setEngagement(engagementRes.data ?? null);
          if (syncDevto && "message" in engagementRes && engagementRes.message) {
            toast.apiSuccess(String(engagementRes.message), ANALYTICS_LABELS["ENGAGEMENT_REFRESH_OK"]);
          }
        } else if (engagementRes?.error) {
          toast.apiError(engagementRes.error || ANALYTICS_LABELS["ENGAGEMENT_LOAD_FAILED"]);
          if (!syncDevto) {
            setEngagement(null);
          }
        }

        if (!isAdmin) {
          setWebsite(null);
        } else if (websiteRes?.success) {
          setWebsite(websiteRes.data ?? null);
        } else if (websiteRes?.error) {
          toast.apiError(websiteRes.error || ANALYTICS_LABELS["GA4_LOAD_FAILED"]);
          setWebsite(null);
        }
      } catch {
        toast.apiError(ANALYTICS_LABELS["LOAD_ERROR"]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin, toast],
  );

  useEffect(() => {
    void loadAll(range);
    // Initial load only — range changes call loadAll explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHistory = useMemo(() => filterHistoryByRange(stats?.history ?? [], range), [stats, range]);

  const overviewCards = useMemo(() => buildOverviewCards(stats, engagement, website), [stats, engagement, website]);

  const platformRows = useMemo(() => buildPlatformRows(stats, engagement), [stats, engagement]);

  const trafficSources = useMemo(() => buildTrafficSources(website), [website]);

  const topPosts = useMemo(() => topEngagementPosts(engagement), [engagement]);

  const statusData = useMemo((): AnalyticsStatusChartDatum[] => {
    return [
      { name: ANALYTICS_LABELS["CHART_DRAFTS"], value: stats?.summary.totalDrafts ?? 0 },
      { name: ANALYTICS_LABELS["CHART_PUBLISHED"], value: stats?.summary.totalPublished ?? 0 },
    ];
  }, [stats]);

  const handlePreset = (days: number | null) => {
    if (days === null) {
      setRange((prev) => ({ ...prev, presetDays: null }));
      return;
    }
    const next = createDefaultDateRange(days);
    setRange(next);
    void loadAll(next);
  };

  const handleCustomDate = (
    field: (typeof ANALYTICS_DATE_FIELDS)["START"] | (typeof ANALYTICS_DATE_FIELDS)["END"],
    value: string,
  ) => {
    const next: AnalyticsDateRange = {
      ...range,
      [field]: value,
      presetDays: null,
    };
    setRange(next);
    if (dayjs(next.start).isValid() && dayjs(next.end).isValid()) {
      void loadAll(next);
    }
  };

  const isCustomRange = range.presetDays === null;

  if (loading && !stats) {
    return (
      <div className={ANALYTICS_UI["PAGE_LOADING_ROOT"]}>
        <div>
          <Skeleton className={ANALYTICS_UI["SKELETON_TITLE"]} />
          <Skeleton className={ANALYTICS_UI["SKELETON_DESC"]} />
        </div>
        <div className={ANALYTICS_UI["OVERVIEW_GRID_SKELETON"]}>
          {Array.from({ length: ANALYTICS_UI["OVERVIEW_CARD_COUNT"] }, (_, i) => (
            <Card key={`${ANALYTICS_UI["OVERVIEW_SKEL_KEY_PREFIX"]}${i}`} className={ANALYTICS_UI["CARD_SURFACE"]}>
              <CardHeader className={ANALYTICS_UI["CARD_HEADER_OVERVIEW"]}>
                <Skeleton className={ANALYTICS_UI["SKELETON_CHIP"]} />
                <Skeleton className={ANALYTICS_UI["SKELETON_VALUE"]} />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card className={ANALYTICS_UI["CARD_SURFACE"]}>
          <CardHeader>
            <Skeleton className={ANALYTICS_UI["SKELETON_CHART_TITLE"]} />
          </CardHeader>
          <CardContent className={ANALYTICS_UI["SKELETON_CHART_BODY"]}>
            {Array.from({ length: ANALYTICS_UI["SKELETON_ACTIVITY_BARS"] }, (_, n) => (
              <Skeleton
                key={`${ANALYTICS_UI["ACTIVITY_SKEL_KEY_PREFIX"]}${n}`}
                className={ANALYTICS_UI["SKELETON_BAR"]}
                style={{
                  height: `${ANALYTICS_UI["SKELETON_BAR_BASE_PCT"] + (n % ANALYTICS_UI["SKELETON_BAR_MOD"]) * ANALYTICS_UI["SKELETON_BAR_STEP_PCT"]}%`,
                }}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={ANALYTICS_UI["PAGE_ROOT"]}>
      <div className={ANALYTICS_UI["HEADER_ROW"]}>
        <div className="min-w-0">
          <h1 className={ANALYTICS_UI["HEADER_TITLE"]}>{ANALYTICS_LABELS["PAGE_TITLE"]}</h1>
          <p className={ANALYTICS_UI["HEADER_DESC"]}>{ANALYTICS_LABELS["PAGE_DESCRIPTION"]}</p>
        </div>
        <div className={ANALYTICS_UI["HEADER_ACTIONS"]}>
          <Button
            type="button"
            variant={BUTTON_VARIANTS["OUTLINE"]}
            size={BUTTON_SIZES["SM"]}
            disabled={refreshing}
            onClick={() => void loadAll(range, { syncDevto: true })}
            className={ANALYTICS_UI["ACTION_BTN"]}
          >
            <FiRefreshCw className={refreshing ? ANALYTICS_UI["ICON_REFRESH_SPIN"] : ANALYTICS_UI["ICON_REFRESH"]} />
            <span className="truncate">
              {refreshing ? ANALYTICS_LABELS["REFRESHING"] : ANALYTICS_LABELS["REFRESH_ENGAGEMENT"]}
            </span>
          </Button>
          <Button
            type="button"
            variant={BUTTON_VARIANTS["PRIMARY"]}
            size={BUTTON_SIZES["SM"]}
            disabled={loading || refreshing}
            onClick={() => void loadAll(range)}
            className={ANALYTICS_UI["ACTION_BTN"]}
          >
            <FiRefreshCw className={ANALYTICS_UI["ICON_REFRESH"]} />
            {ANALYTICS_LABELS["REFRESH_ALL"]}
          </Button>
        </div>
      </div>

      <Card className={ANALYTICS_UI["CARD_SURFACE"]}>
        <CardHeader className={ANALYTICS_UI["DATE_CARD_HEADER"]}>
          <CardTitle className={ANALYTICS_UI["DATE_CARD_TITLE"]}>{ANALYTICS_LABELS["DATE_RANGE_LABEL"]}</CardTitle>
        </CardHeader>
        <CardContent className={ANALYTICS_UI["DATE_CARD_BODY"]}>
          <div className={ANALYTICS_UI["PRESET_GROUP"]} role="group" aria-label={ANALYTICS_LABELS["DATE_RANGE_LABEL"]}>
            {ANALYTICS_DATE_PRESET_OPTIONS.map((opt) => {
              const active = range.presetDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => handlePreset(opt.days)}
                  className={`${ANALYTICS_UI["PRESET_BTN"]} ${active ? ANALYTICS_UI["PRESET_BTN_ACTIVE"] : ""}`}
                  aria-pressed={active}
                >
                  {ANALYTICS_LABELS[opt.labelKey]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handlePreset(null)}
              className={`${ANALYTICS_UI["PRESET_BTN"]} ${isCustomRange ? ANALYTICS_UI["PRESET_BTN_ACTIVE"] : ""}`}
              aria-pressed={isCustomRange}
            >
              {ANALYTICS_LABELS["RANGE_CUSTOM"]}
            </button>
          </div>
          <div className={ANALYTICS_UI["DATE_FIELDS_ROW"]}>
            <Input
              label={ANALYTICS_LABELS["RANGE_FROM"]}
              type={ANALYTICS_UI["INPUT_TYPE_DATE"]}
              size={INPUT_SIZES["SM"]}
              value={range.start}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleCustomDate(ANALYTICS_DATE_FIELDS["START"], e.target.value);
              }}
            />
            <Input
              label={ANALYTICS_LABELS["RANGE_TO"]}
              type={ANALYTICS_UI["INPUT_TYPE_DATE"]}
              size={INPUT_SIZES["SM"]}
              value={range.end}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleCustomDate(ANALYTICS_DATE_FIELDS["END"], e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className={ANALYTICS_UI["OVERVIEW_GRID"]}>
        {overviewCards.map((card) => (
          <Card key={card.id} className={ANALYTICS_UI["CARD_SURFACE"]}>
            <CardHeader className={ANALYTICS_UI["CARD_HEADER_OVERVIEW"]}>
              <div className={ANALYTICS_UI["CARD_HEADER_ROW"]}>
                <CardDescription className={ANALYTICS_UI["CARD_LABEL_ROW"]}>
                  {overviewCardIcon(card.id)}
                  <span className={ANALYTICS_UI["CARD_LABEL_TEXT"]}>{card.label}</span>
                </CardDescription>
                <span className={availabilityBadgeClass(card.availability)}>
                  {availabilityBadgeLabel(card.availability)}
                </span>
              </div>
              <CardTitle className={ANALYTICS_UI["CARD_VALUE"]}>{card.value}</CardTitle>
              <p className={ANALYTICS_UI["CARD_HINT"]}>{card.hint}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className={ANALYTICS_UI["SECTION_GRID"]}>
        <Card className={`${ANALYTICS_UI["CARD_SURFACE"]} ${ANALYTICS_UI["SECTION_SPAN_FULL"]}`}>
          <CardHeader>
            <CardTitle>{ANALYTICS_LABELS["DAILY_ACTIVITY_TITLE"]}</CardTitle>
            <CardDescription>{ANALYTICS_LABELS["DAILY_ACTIVITY_DESC"]}</CardDescription>
          </CardHeader>
          <CardContent className={ANALYTICS_UI["CHART_ACTIVITY"]}>
            {filteredHistory.length === 0 ? (
              <div className={ANALYTICS_UI["CHART_EMPTY"]}>{ANALYTICS_LABELS["EMPTY_ACTIVITY"]}</div>
            ) : (
              <ResponsiveContainer
                width={ANALYTICS_UI["CHART_WIDTH_PCT"]}
                height={ANALYTICS_UI["CHART_HEIGHT_PCT"]}
                minWidth={ANALYTICS_UI["CHART_MIN_SIZE"]}
                minHeight={ANALYTICS_UI["CHART_MIN_SIZE"]}
              >
                <LineChart data={filteredHistory}>
                  <CartesianGrid
                    strokeDasharray={ANALYTICS_UI["CHART_STROKE_DASH"]}
                    vertical={ANALYTICS_UI["GRID_STROKE_VERTICAL"]}
                    stroke={ANALYTICS_CHART_COLORS["BORDER"]}
                  />
                  <XAxis
                    dataKey={ANALYTICS_CHART_KEYS["DATE"]}
                    stroke={ANALYTICS_CHART_COLORS["BORDER"]}
                    tick={axisTick}
                    tickFormatter={(str: string) => dayjs(str).format(APP_CONFIG["DATE_FORMAT"])}
                  />
                  <YAxis stroke={ANALYTICS_CHART_COLORS["BORDER"]} tick={axisTick} />
                  <Tooltip contentStyle={tooltipContentStyle} />
                  <Line
                    type={ANALYTICS_UI["CHART_LINE_TYPE"]}
                    dataKey={ANALYTICS_CHART_KEYS["POSTS"]}
                    name={ANALYTICS_LABELS["SERIES_CREATED"]}
                    stroke={chartPalette[0]}
                    strokeWidth={ANALYTICS_UI["CHART_STROKE_WIDTH"]}
                    dot={false}
                  />
                  <Line
                    type={ANALYTICS_UI["CHART_LINE_TYPE"]}
                    dataKey={ANALYTICS_CHART_KEYS["PUBLISHED"]}
                    name={ANALYTICS_LABELS["SERIES_PUBLISHED"]}
                    stroke={chartPalette[1]}
                    strokeWidth={ANALYTICS_UI["CHART_STROKE_WIDTH"]}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className={ANALYTICS_UI["CARD_SURFACE"]}>
          <CardHeader>
            <CardTitle>{ANALYTICS_LABELS["STATUS_DISTRIBUTION_TITLE"]}</CardTitle>
            <CardDescription>{ANALYTICS_LABELS["STATUS_DISTRIBUTION_DESC"]}</CardDescription>
          </CardHeader>
          <CardContent className={ANALYTICS_UI["CHART_STATUS"]}>
            <ResponsiveContainer
              width={ANALYTICS_UI["CHART_WIDTH_PCT"]}
              height={ANALYTICS_UI["CHART_HEIGHT_PCT"]}
              minWidth={ANALYTICS_UI["CHART_MIN_SIZE"]}
              minHeight={ANALYTICS_UI["CHART_MIN_SIZE"]}
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx={ANALYTICS_UI["PIE_CENTER"]}
                  cy={ANALYTICS_UI["PIE_CENTER"]}
                  innerRadius={ANALYTICS_UI["PIE_INNER_DESKTOP"]}
                  outerRadius={ANALYTICS_UI["PIE_OUTER_DESKTOP"]}
                  paddingAngle={ANALYTICS_UI["PIE_PADDING_ANGLE"]}
                  dataKey={ANALYTICS_CHART_KEYS["VALUE"]}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={ANALYTICS_UI["CARD_SURFACE"]}>
          <CardHeader>
            <CardTitle className={ANALYTICS_UI["TITLE_PLATFORM_ROW"]}>
              <FiBarChart2 className={ANALYTICS_UI["ICON_MD"]} />
              {ANALYTICS_LABELS["PLATFORM_BREAKDOWN_TITLE"]}
            </CardTitle>
            <CardDescription>{ANALYTICS_LABELS["PLATFORM_BREAKDOWN_DESC"]}</CardDescription>
          </CardHeader>
          <CardContent className={ANALYTICS_UI["SCROLL_X"]}>
            <div className={ANALYTICS_UI["PLATFORM_MOBILE_LIST"]}>
              {platformRows.map((row) => (
                <div key={row.platform} className={ANALYTICS_UI["PLATFORM_MOBILE_CARD"]}>
                  <p className={ANALYTICS_UI["PLATFORM_MOBILE_TITLE"]}>{row.label}</p>
                  <div className={ANALYTICS_UI["PLATFORM_MOBILE_METRICS"]}>
                    <span>
                      {ANALYTICS_LABELS["METRIC_PUBLISHED_POSTS"]}: {row.publishedCount}
                    </span>
                    <span>
                      {ANALYTICS_LABELS["METRIC_VIEWS"]}: {formatMetric(row.views, row.viewsAvailable)}
                    </span>
                    <span>
                      {ANALYTICS_LABELS["METRIC_REACTIONS"]}: {formatMetric(row.reactions, row.engagementAvailable)}
                    </span>
                    <span>
                      {ANALYTICS_LABELS["METRIC_COMMENTS"]}: {formatMetric(row.comments, row.engagementAvailable)}
                    </span>
                    <span>
                      {ANALYTICS_LABELS["METRIC_CLICKS"]}: {formatMetric(row.clicks, row.clicksAvailable)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className={ANALYTICS_UI["PLATFORM_DESKTOP_TABLE"]}>
              <Table className={ANALYTICS_UI["TABLE_PLATFORM_MIN_WIDTH_CLASS"]}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ANALYTICS_LABELS["TABLE_PLATFORM"]}</TableHead>
                    <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                      {ANALYTICS_LABELS["METRIC_PUBLISHED_POSTS"]}
                    </TableHead>
                    <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                      {ANALYTICS_LABELS["METRIC_VIEWS"]}
                    </TableHead>
                    <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                      {ANALYTICS_LABELS["METRIC_REACTIONS"]}
                    </TableHead>
                    <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                      {ANALYTICS_LABELS["METRIC_COMMENTS"]}
                    </TableHead>
                    <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                      {ANALYTICS_LABELS["METRIC_CLICKS"]}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformRows.map((row) => (
                    <TableRow key={row.platform}>
                      <TableCell className={ANALYTICS_UI["TABLE_CELL_NOWRAP"]}>{row.label}</TableCell>
                      <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>{row.publishedCount}</TableCell>
                      <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>
                        {formatMetric(row.views, row.viewsAvailable)}
                      </TableCell>
                      <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>
                        {formatMetric(row.reactions, row.engagementAvailable)}
                      </TableCell>
                      <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>
                        {formatMetric(row.comments, row.engagementAvailable)}
                      </TableCell>
                      <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>
                        {formatMetric(row.clicks, row.clicksAvailable)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {engagement?.lastSyncedAt ? (
              <p className={ANALYTICS_UI["META_SYNC"]}>
                {ANALYTICS_LABELS["LAST_SYNCED"]}:{" "}
                {dayjs(engagement.lastSyncedAt).format(APP_CONFIG["DATE_FORMAT_WITH_TIME"])}
              </p>
            ) : (
              <p className={ANALYTICS_UI["META_SYNC"]}>{ANALYTICS_LABELS["NEVER_SYNCED"]}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={ANALYTICS_UI["SECTION_GRID"]}>
        <Card className={ANALYTICS_UI["CARD_SURFACE"]}>
          <CardHeader>
            <CardTitle>{ANALYTICS_LABELS["TOP_POSTS_TITLE"]}</CardTitle>
            <CardDescription>{ANALYTICS_LABELS["TOP_POSTS_DESC"]}</CardDescription>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <div className={ANALYTICS_UI["ALERT_INFO"]} role="status">
                <div className={ANALYTICS_UI["ALERT_TITLE"]}>{ANALYTICS_LABELS["EMPTY_TOP_POSTS"]}</div>
                <div className={ANALYTICS_UI["ALERT_BODY"]}>{ANALYTICS_LABELS["EMPTY_TOP_POSTS_HINT"]}</div>
              </div>
            ) : (
              <>
                <div className={ANALYTICS_UI["TOP_POSTS_MOBILE_LIST"]}>
                  {topPosts.map((post) => (
                    <div key={post.postId} className={ANALYTICS_UI["PLATFORM_MOBILE_CARD"]}>
                      <p className={ANALYTICS_UI["PLATFORM_MOBILE_TITLE"]}>{post.title || post.postId}</p>
                      <div className={ANALYTICS_UI["PLATFORM_MOBILE_METRICS"]}>
                        <span>
                          {ANALYTICS_LABELS["METRIC_VIEWS"]}: {post.views.toLocaleString()}
                        </span>
                        <span>
                          {ANALYTICS_LABELS["METRIC_REACTIONS"]}: {post.reactions.toLocaleString()}
                        </span>
                        <span>
                          {ANALYTICS_LABELS["METRIC_COMMENTS"]}: {post.comments.toLocaleString()}
                        </span>
                      </div>
                      {post.url ? (
                        <a
                          href={post.url}
                          target={ANALYTICS_UI["LINK_TARGET_BLANK"]}
                          rel={ANALYTICS_UI["LINK_REL"]}
                          className={ANALYTICS_UI["LINK_DEVTO"]}
                        >
                          {ANALYTICS_LABELS["OPEN_ON_DEVTO"]}
                          <FiExternalLink className={ANALYTICS_UI["ICON_SM"]} />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className={`${ANALYTICS_UI["TOP_POSTS_DESKTOP_TABLE"]} ${ANALYTICS_UI["SCROLL_X"]}`}>
                  <Table className={ANALYTICS_UI["TABLE_TOP_POSTS_MIN_WIDTH_CLASS"]}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{ANALYTICS_LABELS["TABLE_POST"]}</TableHead>
                        <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                          {ANALYTICS_LABELS["METRIC_VIEWS"]}
                        </TableHead>
                        <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                          {ANALYTICS_LABELS["METRIC_REACTIONS"]}
                        </TableHead>
                        <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]}>
                          {ANALYTICS_LABELS["METRIC_COMMENTS"]}
                        </TableHead>
                        <TableHead className={ANALYTICS_UI["TABLE_HEAD_RIGHT"]} />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPosts.map((post) => (
                        <TableRow key={post.postId}>
                          <TableCell className={ANALYTICS_UI["TITLE_CELL_CLASS"]}>
                            {post.title || post.postId}
                          </TableCell>
                          <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>
                            {post.views.toLocaleString()}
                          </TableCell>
                          <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>
                            {post.reactions.toLocaleString()}
                          </TableCell>
                          <TableCell className={ANALYTICS_UI["TABLE_CELL_RIGHT"]}>
                            {post.comments.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className={`${ANALYTICS_UI["TABLE_CELL_RIGHT"]} ${ANALYTICS_UI["TABLE_CELL_NOWRAP"]}`}
                          >
                            {post.url ? (
                              <a
                                href={post.url}
                                target={ANALYTICS_UI["LINK_TARGET_BLANK"]}
                                rel={ANALYTICS_UI["LINK_REL"]}
                                className={ANALYTICS_UI["LINK_DEVTO"]}
                              >
                                {ANALYTICS_LABELS["OPEN_ON_DEVTO"]}
                                <FiExternalLink className={ANALYTICS_UI["ICON_SM"]} />
                              </a>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={ANALYTICS_UI["CARD_SURFACE"]}>
          <CardHeader>
            <CardTitle>{ANALYTICS_LABELS["WEBSITE_TITLE"]}</CardTitle>
            <CardDescription>{ANALYTICS_LABELS["WEBSITE_DESC"]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!website?.configured ? (
              <div className={ANALYTICS_UI["ALERT_WARNING"]} role="status">
                <div className={ANALYTICS_UI["ALERT_TITLE"]}>{ANALYTICS_LABELS["SETUP_GA4_TITLE"]}</div>
                <div className={ANALYTICS_UI["ALERT_BODY"]}>
                  {website?.message || ANALYTICS_LABELS["EMPTY_TRAFFIC_HINT"]}
                </div>
              </div>
            ) : (
              <>
                <div className={ANALYTICS_UI["WEBSITE_METRICS_GRID"]}>
                  <div className={ANALYTICS_UI["WEBSITE_METRIC_CARD"]}>
                    <p className={ANALYTICS_UI["WEBSITE_METRIC_LABEL"]}>{ANALYTICS_LABELS["WEBSITE_SESSIONS"]}</p>
                    <p className={ANALYTICS_UI["WEBSITE_METRIC_VALUE"]}>{website.totals.sessions.toLocaleString()}</p>
                  </div>
                  <div className={ANALYTICS_UI["WEBSITE_METRIC_CARD"]}>
                    <p className={ANALYTICS_UI["WEBSITE_METRIC_LABEL"]}>{ANALYTICS_LABELS["WEBSITE_PAGEVIEWS"]}</p>
                    <p className={ANALYTICS_UI["WEBSITE_METRIC_VALUE"]}>{website.totals.pageviews.toLocaleString()}</p>
                  </div>
                  <div className={ANALYTICS_UI["WEBSITE_METRIC_CARD"]}>
                    <p className={ANALYTICS_UI["WEBSITE_METRIC_LABEL"]}>{ANALYTICS_LABELS["WEBSITE_USERS"]}</p>
                    <p className={ANALYTICS_UI["WEBSITE_METRIC_VALUE"]}>
                      {website.totals.activeUsers.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className={ANALYTICS_UI["TRAFFIC_TITLE"]}>{ANALYTICS_LABELS["TRAFFIC_SOURCES_TITLE"]}</h3>
                  <ResponsiveContainer
                    width={ANALYTICS_UI["CHART_WIDTH_PCT"]}
                    height={ANALYTICS_UI["TRAFFIC_CHART_HEIGHT_PX"]}
                    minWidth={ANALYTICS_UI["CHART_MIN_SIZE"]}
                    minHeight={ANALYTICS_UI["CHART_MIN_SIZE"]}
                  >
                    <BarChart data={trafficSources.filter((s) => s.available)}>
                      <CartesianGrid
                        strokeDasharray={ANALYTICS_UI["CHART_STROKE_DASH"]}
                        vertical={ANALYTICS_UI["GRID_STROKE_VERTICAL"]}
                        stroke={ANALYTICS_CHART_COLORS["BORDER"]}
                      />
                      <XAxis
                        dataKey={ANALYTICS_CHART_KEYS["LABEL"]}
                        stroke={ANALYTICS_CHART_COLORS["BORDER"]}
                        tick={axisTickSm}
                      />
                      <YAxis stroke={ANALYTICS_CHART_COLORS["BORDER"]} tick={axisTickSm} />
                      <Tooltip contentStyle={tooltipContentStyle} />
                      <Bar
                        dataKey={ANALYTICS_CHART_KEYS["SESSIONS"]}
                        fill={chartPalette[0]}
                        radius={[
                          ANALYTICS_UI["BAR_RADIUS"][0],
                          ANALYTICS_UI["BAR_RADIUS"][1],
                          ANALYTICS_UI["BAR_RADIUS"][2],
                          ANALYTICS_UI["BAR_RADIUS"][3],
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
