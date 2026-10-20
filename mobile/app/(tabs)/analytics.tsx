import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { ScreenIntro } from "@components/ScreenIntro";
import { AnalyticsSkeleton } from "@components/skeletons/AnalyticsSkeleton";
import { ANALYTICS_DATE_PRESET_OPTIONS, ANALYTICS_LABELS, BUTTON_VARIANTS, LABELS } from "@constants";
import { ANALYTICS_COLORS } from "@constants/colorClasses";
import { ANALYTICS_CHART, IOS26, RADIUS } from "@constants/designTokens";
import { USER_ROLES } from "@constants/userRoles";
import { useAuth } from "@contexts/AuthContext";
import { useThemeColors } from "@contexts/ThemeContext";
import { useResponsiveLayout } from "@hooks/useResponsiveLayout";
import { useTabBarInset } from "@hooks/useTabBarInset";
import { toast } from "@hooks/useToast";
import { apiClient } from "@services/apiClient";
import type { AnalyticsDateRange, AnalyticsStats, DevtoEngagementSummary, Ga4WebsiteAnalytics } from "@types";
import {
  createDefaultDateRange,
  engagementTotals,
  filterHistoryByRange,
  formatMetric,
  settleAnalyticsRequest,
  topEngagementPosts,
  websiteConfigured,
} from "@utils/analyticsDashboard";

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const tabBarInset = useTabBarInset();
  const { width } = useWindowDimensions();
  const layout = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(colors, tabBarInset, layout.isCompact),
    [colors, tabBarInset, layout.isCompact],
  );

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [engagement, setEngagement] = useState<DevtoEngagementSummary | null>(null);
  const [website, setWebsite] = useState<Ga4WebsiteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<AnalyticsDateRange>(() => createDefaultDateRange());

  const loadAll = useCallback(
    async (nextRange: AnalyticsDateRange, options?: { syncDevto?: boolean }) => {
      const syncDevto = options?.syncDevto === true;
      if (syncDevto) setRefreshing(true);
      else setLoading(true);

      const engagementPromise = syncDevto
        ? settleAnalyticsRequest(apiClient.refreshAnalyticsEngagement()).then((res) => ({
            success: res.success,
            data: res.data?.summary,
            error: res.error,
            message: res.message,
          }))
        : settleAnalyticsRequest(apiClient.getAnalyticsEngagement());

      const [statsRes, engagementRes, websiteRes] = await Promise.all([
        settleAnalyticsRequest(apiClient.getAnalyticsStats()),
        engagementPromise,
        isAdmin
          ? settleAnalyticsRequest(
              apiClient.getAnalyticsWebsite({
                startDate: nextRange.start,
                endDate: nextRange.end,
              }),
            )
          : Promise.resolve({ success: true as const, data: null }),
      ]);

      if (statsRes.success) setStats(statsRes.data ?? null);
      else toast.error(statsRes.error ?? ANALYTICS_LABELS.LOAD_FAILED);

      if (engagementRes.success) {
        setEngagement(engagementRes.data ?? null);
        if (syncDevto && engagementRes.message) {
          toast.success(String(engagementRes.message) || ANALYTICS_LABELS.ENGAGEMENT_REFRESH_OK);
        }
      } else if (engagementRes.error) {
        toast.error(
          engagementRes.error ||
            (syncDevto ? ANALYTICS_LABELS.ENGAGEMENT_REFRESH_FAILED : ANALYTICS_LABELS.ENGAGEMENT_LOAD_FAILED),
        );
        if (!syncDevto) setEngagement(null);
      }

      if (!isAdmin) {
        setWebsite(null);
      } else if (websiteRes.success) {
        setWebsite(websiteRes.data ?? null);
      } else if (websiteRes.error) {
        toast.error(String(websiteRes.error) || ANALYTICS_LABELS.GA4_LOAD_FAILED);
        setWebsite(null);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [isAdmin],
  );

  useEffect(() => {
    void loadAll(range);
  }, [loadAll, range]);

  const applyPreset = (days: number) => {
    setRange(createDefaultDateRange(days));
  };

  if (loading && !stats) return <AnalyticsSkeleton />;

  if (!stats) {
    return (
      <View collapsable={false} style={styles.shell}>
        <Text style={styles.empty}>{LABELS.NO_ANALYTICS}</Text>
      </View>
    );
  }

  const filteredHistory = filterHistoryByRange(stats.history, range);
  const chartWidth = width - ANALYTICS_CHART.WIDTH_PADDING - (layout.isCompact ? 8 : 0);
  const eng = engagementTotals(engagement);
  const topPosts = topEngagementPosts(engagement);
  const ga4Live = websiteConfigured(website);
  const activePlatforms = Object.values(stats.platformStats).filter((v) => v > 0).length;

  const postsLine = filteredHistory.map((h) => ({
    value: h.posts,
    label: h.date.slice(5),
  }));
  const publishedLine = filteredHistory.map((h) => ({
    value: h.published,
    label: h.date.slice(5),
  }));
  const pieData = [
    { value: stats.summary.totalDrafts, color: ANALYTICS_COLORS[2], text: LABELS.DRAFTS },
    { value: stats.summary.totalPublished, color: colors.positive, text: LABELS.PUBLISHED },
  ].filter((d) => d.value > 0);
  const barData = [
    { value: stats.platformStats.medium, label: LABELS.MEDIUM, frontColor: colors.primary },
    { value: stats.platformStats.devto, label: LABELS.DEVTO, frontColor: ANALYTICS_COLORS[0] },
    {
      value: stats.platformStats.wordpress,
      label: LABELS.WORDPRESS_SHORT,
      frontColor: ANALYTICS_COLORS[2],
    },
    {
      value: stats.platformStats.linkedin ?? 0,
      label: LABELS.LINKEDIN,
      frontColor: ANALYTICS_COLORS[1],
    },
  ];

  return (
    <View collapsable={false} style={styles.shell}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ScreenIntro description={ANALYTICS_LABELS.PAGE_DESCRIPTION} />

        <View style={styles.actionsRow}>
          <Button
            title={refreshing ? ANALYTICS_LABELS.REFRESHING : ANALYTICS_LABELS.REFRESH_ALL}
            variant={BUTTON_VARIANTS.OUTLINE}
            onPress={() => void loadAll(range)}
            loading={loading && !refreshing}
            style={styles.actionBtn}
          />
          <Button
            title={ANALYTICS_LABELS.REFRESH_ENGAGEMENT}
            onPress={() => void loadAll(range, { syncDevto: true })}
            loading={refreshing}
            style={styles.actionBtn}
          />
        </View>

        <Text style={styles.section}>{ANALYTICS_LABELS.DATE_RANGE}</Text>
        <View style={styles.presetRow}>
          {ANALYTICS_DATE_PRESET_OPTIONS.map((opt) => {
            const active = range.presetDays === opt.days;
            return (
              <Pressable
                key={opt.days}
                onPress={() => applyPreset(opt.days)}
                style={[styles.presetChip, active && styles.presetChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.presetText, active && styles.presetTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.row}>
          <StatCard label={LABELS.TOTAL_POSTS} value={stats.summary.totalPosts} styles={styles} />
          <StatCard label={LABELS.PUBLISHED} value={stats.summary.totalPublished} styles={styles} />
        </View>
        <View style={styles.row}>
          <StatCard label={LABELS.PUBLISH_RATE} value={`${stats.summary.publishRate}%`} styles={styles} />
          <StatCard label={LABELS.ACTIVE_PLATFORMS} value={activePlatforms} styles={styles} />
        </View>
        <View style={styles.row}>
          <StatCard
            label={ANALYTICS_LABELS.VIEWS}
            value={formatMetric(eng.views, eng.hasData)}
            hint={ANALYTICS_LABELS.VIEWS_HINT}
            styles={styles}
          />
          <StatCard
            label={ANALYTICS_LABELS.ENGAGEMENT}
            value={formatMetric(eng.engagementScore, eng.hasData)}
            hint={ANALYTICS_LABELS.ENGAGEMENT_HINT}
            styles={styles}
          />
        </View>
        {isAdmin ? (
          <View style={styles.row}>
            <StatCard
              label={ANALYTICS_LABELS.CLICKS}
              value={formatMetric(website?.totals.pageviews, ga4Live)}
              hint={ANALYTICS_LABELS.CLICKS_HINT}
              styles={styles}
            />
            <StatCard
              label={ANALYTICS_LABELS.WEBSITE_SESSIONS}
              value={formatMetric(website?.totals.sessions, ga4Live)}
              hint={ANALYTICS_LABELS.WEBSITE_TITLE}
              styles={styles}
            />
          </View>
        ) : null}

        <Text style={styles.metaSync}>
          {ANALYTICS_LABELS.LAST_SYNCED}:{" "}
          {eng.lastSyncedAt ? dayjs(eng.lastSyncedAt).format("MMM D, YYYY h:mm A") : ANALYTICS_LABELS.NEVER_SYNCED}
        </Text>

        <Text style={styles.section}>{LABELS.ACTIVITY}</Text>
        <Card style={styles.chartCard}>
          {postsLine.length > 0 ? (
            <>
              <View style={styles.legend}>
                <LegendDot
                  color={colors.primary}
                  label={ANALYTICS_LABELS.SERIES_CREATED}
                  muted={colors.mutedForeground}
                />
                <LegendDot
                  color={colors.positive}
                  label={ANALYTICS_LABELS.SERIES_PUBLISHED}
                  muted={colors.mutedForeground}
                />
              </View>
              <LineChart
                dataSet={[
                  { data: postsLine, color: colors.primary },
                  { data: publishedLine, color: colors.positive },
                ]}
                width={Math.max(chartWidth - ANALYTICS_CHART.INNER_PADDING, 200)}
                height={layout.isCompact ? ANALYTICS_CHART.LINE_HEIGHT - 24 : ANALYTICS_CHART.LINE_HEIGHT}
                spacing={layout.isCompact ? ANALYTICS_CHART.SPACING - 6 : ANALYTICS_CHART.SPACING}
                curved
              />
            </>
          ) : (
            <Text style={styles.emptyChart}>{ANALYTICS_LABELS.EMPTY_ACTIVITY}</Text>
          )}
        </Card>

        <Text style={styles.section}>{LABELS.STATUS_DISTRIBUTION}</Text>
        <Card style={styles.chartCard}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              donut
              radius={layout.isCompact ? 64 : 80}
              innerRadius={layout.isCompact ? 40 : 52}
              innerCircleColor={colors.card}
              centerLabelComponent={() => (
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {stats.summary.totalPosts}
                </Text>
              )}
            />
          ) : (
            <Text style={styles.emptyChart}>{LABELS.NO_ANALYTICS}</Text>
          )}
        </Card>

        <Text style={styles.section}>{ANALYTICS_LABELS.PLATFORM_BREAKDOWN}</Text>
        <Card style={styles.chartCard}>
          <BarChart
            data={barData}
            width={Math.max(chartWidth - ANALYTICS_CHART.INNER_PADDING, 200)}
            height={layout.isCompact ? ANALYTICS_CHART.BAR_HEIGHT - 20 : ANALYTICS_CHART.BAR_HEIGHT}
            barWidth={layout.isCompact ? 28 : ANALYTICS_CHART.BAR_WIDTH}
            showGradient={false}
          />
        </Card>

        <Text style={styles.section}>{ANALYTICS_LABELS.TOP_POSTS}</Text>
        <Card style={styles.listCard}>
          {topPosts.length === 0 ? (
            <>
              <Text style={styles.emptyChart}>{ANALYTICS_LABELS.EMPTY_TOP_POSTS}</Text>
              <Text style={styles.hint}>{ANALYTICS_LABELS.EMPTY_TOP_POSTS_HINT}</Text>
            </>
          ) : (
            topPosts.map((post) => (
              <Pressable
                key={post.postId}
                style={styles.topPostRow}
                onPress={() => {
                  if (post.url) void Linking.openURL(post.url);
                }}
              >
                <Text style={styles.topPostTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.topPostMeta}>
                  {post.views.toLocaleString()} views · {post.reactions} reactions · {post.comments} comments
                </Text>
              </Pressable>
            ))
          )}
        </Card>

        {isAdmin ? (
          <>
            <Text style={styles.section}>{ANALYTICS_LABELS.WEBSITE_TITLE}</Text>
            <Card style={styles.listCard}>
              <Text style={styles.hint}>{ANALYTICS_LABELS.WEBSITE_DESC}</Text>
              {!ga4Live ? (
                <>
                  <Text style={[styles.emptyChart, { marginTop: 8 }]}>
                    {website?.message || ANALYTICS_LABELS.EMPTY_TRAFFIC}
                  </Text>
                  <Text style={styles.hint}>{ANALYTICS_LABELS.EMPTY_TRAFFIC_HINT}</Text>
                </>
              ) : (
                <View style={styles.ga4Grid}>
                  <Ga4Metric
                    label={ANALYTICS_LABELS.WEBSITE_SESSIONS}
                    value={website!.totals.sessions}
                    styles={styles}
                  />
                  <Ga4Metric
                    label={ANALYTICS_LABELS.WEBSITE_PAGEVIEWS}
                    value={website!.totals.pageviews}
                    styles={styles}
                  />
                  <Ga4Metric
                    label={ANALYTICS_LABELS.WEBSITE_USERS}
                    value={website!.totals.activeUsers}
                    styles={styles}
                  />
                </View>
              )}
            </Card>
          </>
        ) : (
          <Text style={styles.adminNote}>{ANALYTICS_LABELS.ADMIN_ONLY_GA4}</Text>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  hint,
  styles,
}: {
  label: string;
  value: string | number;
  hint?: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.cardLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.cardValue} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text style={styles.cardHint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function Ga4Metric({
  label,
  value,
  styles,
}: {
  label: string;
  value: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.ga4Metric}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.ga4Value}>{value.toLocaleString()}</Text>
    </View>
  );
}

function LegendDot({ color, label, muted }: { color: string; label: string; muted: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: muted }}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, tabBarInset: number, isCompact: boolean) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.groupedBackground },
    scroll: { flex: 1 },
    content: {
      padding: isCompact ? IOS26.SCREEN_PADDING - 4 : IOS26.SCREEN_PADDING,
      paddingBottom: tabBarInset,
    },
    actionsRow: {
      flexDirection: isCompact ? "column" : "row",
      gap: 8,
      marginBottom: 8,
    },
    actionBtn: { flex: isCompact ? undefined : 1 },
    presetRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: IOS26.GROUPED_GAP,
    },
    presetChip: {
      minHeight: 44,
      minWidth: 56,
      paddingHorizontal: 14,
      borderRadius: RADIUS.MD,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    presetChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
    presetTextActive: { color: colors.primaryForeground },
    row: {
      flexDirection: "row",
      gap: IOS26.GROUPED_GAP,
      marginBottom: IOS26.GROUPED_GAP,
    },
    statCard: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: isCompact ? 12 : 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chartCard: {
      paddingVertical: 12,
      overflow: "hidden",
      alignItems: "center",
    },
    listCard: {
      padding: 12,
      overflow: "hidden",
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 8,
      alignSelf: "flex-start",
      paddingHorizontal: 8,
    },
    cardLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    cardValue: {
      fontSize: isCompact ? 22 : 28,
      fontWeight: "700",
      color: colors.foreground,
      marginTop: 4,
    },
    cardHint: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 14,
      color: colors.mutedForeground,
    },
    section: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 20,
      marginBottom: 12,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    metaSync: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    empty: {
      padding: 24,
      textAlign: "center",
      color: colors.mutedForeground,
      fontSize: 16,
    },
    emptyChart: {
      padding: 16,
      textAlign: "center",
      color: colors.mutedForeground,
      fontSize: 14,
    },
    hint: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    topPostRow: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    topPostTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
    },
    topPostMeta: {
      marginTop: 4,
      fontSize: 12,
      color: colors.mutedForeground,
    },
    ga4Grid: {
      marginTop: 8,
      gap: 8,
    },
    ga4Metric: {
      borderRadius: RADIUS.MD,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.muted ?? colors.groupedBackground,
      padding: 12,
    },
    ga4Value: {
      marginTop: 4,
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
    },
    adminNote: {
      marginTop: 16,
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });
