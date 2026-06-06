import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Skeleton } from "@/src/components/Skeleton";
import { IOS26, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export function EditorSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
        <Skeleton height={44} borderRadius={RADIUS.MD} />
        <Skeleton width={72} height={14} style={{ marginTop: 16, marginBottom: 8 }} />
        <Skeleton height={200} borderRadius={RADIUS.MD} />
        <Skeleton width={56} height={14} style={{ marginTop: 16, marginBottom: 8 }} />
        <Skeleton height={44} borderRadius={RADIUS.MD} />
      </View>
      <View style={styles.row}>
        <Skeleton height={48} style={styles.flex} borderRadius={RADIUS.MD} />
        <Skeleton height={48} style={styles.flex} borderRadius={RADIUS.MD} />
      </View>
      <Skeleton width={100} height={18} style={{ marginTop: 24, marginBottom: 12 }} />
      <Skeleton height={48} borderRadius={RADIUS.MD} />
      <Skeleton height={48} borderRadius={RADIUS.MD} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.groupedBackground },
    content: { padding: IOS26.SCREEN_PADDING, paddingBottom: 40 },
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { flexDirection: "row", gap: 8, marginTop: 12 },
    flex: { flex: 1 },
  });
