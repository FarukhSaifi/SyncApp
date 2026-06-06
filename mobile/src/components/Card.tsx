import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Inset grouped card (iOS 26 list row group) */
  grouped?: boolean;
}

export function Card({ children, style, grouped = true, ...props }: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, grouped && styles.grouped, style]} {...props}>
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

export function CardHeader({ title, description, style }: CardHeaderProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.header, style]}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function CardContent({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      overflow: "hidden",
    },
    grouped: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    header: { marginBottom: 16, alignItems: "center" },
    title: { fontSize: 20, fontWeight: "600", color: colors.foreground, textAlign: "center" },
    description: { fontSize: 14, color: colors.mutedForeground, marginTop: 4, textAlign: "center" },
  });
