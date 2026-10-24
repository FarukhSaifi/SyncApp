import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { StatusPillProps } from "@types";

/** Soft status chip — matches web StatusPill / ConnectionStatusPill. */
export function StatusPill({ label, tone = "muted" }: StatusPillProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const toneStyle = styles[tone];

  return (
    <View style={[styles.base, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={[styles.text, { color: toneStyle.color }]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    base: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.FULL,
    },
    text: { fontSize: 11, fontWeight: "600" },
    positive: { backgroundColor: `${colors.positive}26`, color: colors.positive },
    muted: { backgroundColor: colors.muted, color: colors.mutedForeground },
    primary: { backgroundColor: `${colors.primary}1a`, color: colors.primary },
    warning: { backgroundColor: `${colors.warning}26`, color: colors.warning },
    destructive: { backgroundColor: `${colors.destructive}26`, color: colors.destructive },
  });
