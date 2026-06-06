import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton } from "@/src/components/Skeleton";
import { IOS26, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export function UserCardSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Skeleton width="50%" height={18} />
      <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width={72} height={22} borderRadius={RADIUS.FULL} style={{ marginTop: 10 }} />
      <Skeleton width="90%" height={12} style={{ marginTop: 10 }} />
    </View>
  );
}

export function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={{ gap: IOS26.GROUPED_GAP }}>
      {Array.from({ length: count }, (_, i) => (
        <UserCardSkeleton key={i} />
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
      marginBottom: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  });
