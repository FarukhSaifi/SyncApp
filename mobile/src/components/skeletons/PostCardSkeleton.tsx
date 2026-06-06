import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton } from "@/src/components/Skeleton";
import { IOS26, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export function PostCardSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width="68%" height={18} />
        <Skeleton width={64} height={22} borderRadius={RADIUS.FULL} />
      </View>
      <View style={styles.tags}>
        <Skeleton width={56} height={20} borderRadius={RADIUS.FULL} />
        <Skeleton width={48} height={20} borderRadius={RADIUS.FULL} />
      </View>
      <View style={styles.dates}>
        <Skeleton width="45%" height={32} />
        <Skeleton width="45%" height={32} />
      </View>
      <View style={styles.actions}>
        <Skeleton height={36} style={styles.flex} borderRadius={RADIUS.MD} />
        <Skeleton height={36} style={styles.flex} borderRadius={RADIUS.MD} />
      </View>
    </View>
  );
}

export function PostListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: IOS26.GROUPED_GAP }}>
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    header: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    tags: { flexDirection: "row", gap: 8, marginTop: 12 },
    dates: { flexDirection: "row", gap: 12, marginTop: 14 },
    actions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    flex: { flex: 1 },
  });
