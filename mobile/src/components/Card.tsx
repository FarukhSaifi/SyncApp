import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { RADIUS, SETTINGS_LAYOUT } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { CardContentProps, CardHeaderProps, CardProps } from "@types";

/** Elevated card — matches web `rounded-xl border border-border bg-card shadow-none`. */
export function Card({ children, style, grouped = true, ...props }: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, grouped && styles.grouped, style]} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ title, description, style, trailing, align = "start" }: CardHeaderProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const centered = align === "center";
  return (
    <View style={[styles.header, centered && styles.headerCenter, style]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, centered && styles.textCenter]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, centered && styles.textCenter]}>{description}</Text>
          ) : null}
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
    </View>
  );
}

export function CardContent({ children, style }: CardContentProps) {
  const styles = useMemo(() => createStylesContent(), []);
  return <View style={[styles.content, style]}>{children}</View>;
}

const createStylesContent = () =>
  StyleSheet.create({
    content: { gap: SETTINGS_LAYOUT.CARD_GAP },
  });

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.CARD,
      padding: SETTINGS_LAYOUT.CARD_PADDING,
      overflow: "hidden",
    },
    grouped: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    header: { marginBottom: SETTINGS_LAYOUT.CARD_GAP, alignItems: "flex-start" },
    headerCenter: { alignItems: "center" },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      width: "100%",
    },
    headerText: { flex: 1, minWidth: 0 },
    trailing: { flexShrink: 0, paddingTop: 2 },
    title: {
      fontSize: SETTINGS_LAYOUT.SECTION_TITLE_SIZE,
      fontWeight: SETTINGS_LAYOUT.SECTION_TITLE_WEIGHT,
      color: colors.foreground,
      textAlign: "left",
    },
    description: {
      fontSize: SETTINGS_LAYOUT.SECTION_DESC_SIZE,
      color: colors.mutedForeground,
      marginTop: 4,
      textAlign: "left",
      lineHeight: 18,
    },
    textCenter: { textAlign: "center" },
  });
