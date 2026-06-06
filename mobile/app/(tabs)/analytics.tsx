import { useEffect, useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

import { Card } from "@/src/components/Card";
import { ScreenIntro } from "@/src/components/ScreenIntro";
import { AnalyticsSkeleton } from "@/src/components/skeletons/AnalyticsSkeleton";
import { ERRORS, LABELS } from "@/src/constants";
import { ANALYTICS_COLORS } from "@/src/constants/colorClasses";
import { ANALYTICS_CHART, IOS26, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { useTabBarInset } from "@/src/hooks/useTabBarInset";
import { toast } from "@/src/hooks/useToast";
import { apiClient } from "@/src/services/apiClient";
import type { AnalyticsStats } from "@/src/types";

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const tabBarInset = useTabBarInset();
  const styles = useMemo(() => createStyles(colors, tabBarInset), [colors, tabBarInset]);
  const [data, setData] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiClient.getAnalyticsStats();
        if (res.success && res.data) setData(res.data);
        else toast.error(res.error ?? ERRORS.SAVE_FAILED);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <AnalyticsSkeleton />;

  if (!data) {
    return (
      <View collapsable={false} style={styles.shell}>
        <Text style={styles.empty}>{LABELS.NO_ANALYTICS}</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get("window").width - ANALYTICS_CHART.WIDTH_PADDING;
  const activePlatforms = Object.values(data.platformStats).filter((v) => v > 0).length;
  const postsLine = data.history.map((h) => ({ value: h.posts, label: h.date.slice(5) }));
  const publishedLine = data.history.map((h) => ({ value: h.published, label: h.date.slice(5) }));
  const pieData = [
    { value: data.summary.totalDrafts, color: ANALYTICS_COLORS[2], text: LABELS.DRAFTS },
    { value: data.summary.totalPublished, color: colors.positive, text: LABELS.PUBLISHED },
  ].filter((d) => d.value > 0);
  const barData = [
    { value: data.platformStats.medium, label: LABELS.MEDIUM, frontColor: colors.primary },
    { value: data.platformStats.devto, label: LABELS.DEVTO, frontColor: ANALYTICS_COLORS[0] },
    { value: data.platformStats.wordpress, label: LABELS.WORDPRESS_SHORT, frontColor: ANALYTICS_COLORS[2] },
  ];

  return (
    <View collapsable={false} style={styles.shell}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ScreenIntro description={LABELS.ANALYTICS_INTRO} />

        <View style={styles.row}>
          <StatCard label={LABELS.TOTAL_POSTS} value={data.summary.totalPosts} styles={styles} />
          <StatCard label={LABELS.PUBLISHED} value={data.summary.totalPublished} styles={styles} />
        </View>
        <View style={styles.row}>
          <StatCard label={LABELS.PUBLISH_RATE} value={`${data.summary.publishRate}%`} styles={styles} />
          <StatCard label={LABELS.ACTIVE_PLATFORMS} value={activePlatforms} styles={styles} />
        </View>

        <Text style={styles.section}>{LABELS.ACTIVITY}</Text>
        <Card style={styles.chartCard}>
          {postsLine.length > 0 ? (
            <>
              <View style={styles.legend}>
                <LegendDot color={colors.primary} label={LABELS.POSTS_CREATED} />
                <LegendDot color={colors.positive} label={LABELS.POSTS_PUBLISHED} />
              </View>
              <LineChart
                dataSet={[
                  { data: postsLine, color: colors.primary },
                  { data: publishedLine, color: colors.positive },
                ]}
                width={chartWidth - ANALYTICS_CHART.INNER_PADDING}
                height={ANALYTICS_CHART.LINE_HEIGHT}
                spacing={ANALYTICS_CHART.SPACING}
                curved
              />
            </>
          ) : (
            <Text style={styles.emptyChart}>{LABELS.NO_ACTIVITY}</Text>
          )}
        </Card>

        <Text style={styles.section}>{LABELS.STATUS_DISTRIBUTION}</Text>
        <Card style={styles.chartCard}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              donut
              radius={80}
              innerRadius={52}
              innerCircleColor={colors.card}
              centerLabelComponent={() => (
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {data.summary.totalPosts}
                </Text>
              )}
            />
          ) : (
            <Text style={styles.emptyChart}>{LABELS.NO_ANALYTICS}</Text>
          )}
        </Card>

        <Text style={styles.section}>{LABELS.PLATFORM_STATS}</Text>
        <Card style={styles.chartCard}>
          <BarChart
            data={barData}
            width={chartWidth - ANALYTICS_CHART.INNER_PADDING}
            height={ANALYTICS_CHART.BAR_HEIGHT}
            barWidth={ANALYTICS_CHART.BAR_WIDTH}
            showGradient={false}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  styles,
}: {
  label: string;
  value: string | number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: "#888" }}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, tabBarInset: number) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.groupedBackground },
    scroll: { flex: 1 },
    content: { padding: IOS26.SCREEN_PADDING, paddingBottom: tabBarInset },
    row: { flexDirection: "row", gap: IOS26.GROUPED_GAP, marginBottom: IOS26.GROUPED_GAP },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chartCard: { paddingVertical: 12, overflow: "hidden", alignItems: "center" },
    legend: { flexDirection: "row", gap: 16, marginBottom: 8, alignSelf: "flex-start", paddingHorizontal: 8 },
    cardLabel: { fontSize: 12, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.3 },
    cardValue: { fontSize: 28, fontWeight: "700", color: colors.foreground, marginTop: 4 },
    section: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 20,
      marginBottom: 12,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    empty: { padding: 24, textAlign: "center", color: colors.mutedForeground, fontSize: 16 },
    emptyChart: { padding: 16, textAlign: "center", color: colors.mutedForeground, fontSize: 14 },
  });
