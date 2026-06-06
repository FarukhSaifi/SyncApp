import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Skeleton } from "@/src/components/Skeleton";
import { IOS26, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export function AnalyticsSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <StatSkeleton styles={styles} />
        <StatSkeleton styles={styles} />
      </View>
      <View style={styles.row}>
        <StatSkeleton styles={styles} />
        <StatSkeleton styles={styles} />
      </View>
      <Skeleton width={140} height={20} style={{ marginTop: 8, marginBottom: 12 }} />
      <View style={styles.chartCard}>
        <Skeleton width="100%" height={180} borderRadius={RADIUS.MD} />
      </View>
      <Skeleton width={160} height={20} style={{ marginTop: 16, marginBottom: 12 }} />
      <View style={styles.chartCard}>
        <Skeleton width="100%" height={160} borderRadius={RADIUS.MD} />
      </View>
    </ScrollView>
  );
}

function StatSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.statCard}>
      <Skeleton width="60%" height={12} />
      <Skeleton width="40%" height={28} style={{ marginTop: 10 }} />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.groupedBackground },
    content: { padding: IOS26.SCREEN_PADDING, paddingBottom: 32 },
    row: { flexDirection: "row", gap: IOS26.GROUPED_GAP, marginBottom: IOS26.GROUPED_GAP },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  });
