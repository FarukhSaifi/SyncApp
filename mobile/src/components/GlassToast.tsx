import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { ToastConfigParams } from "react-native-toast-message";

import { GlassSurface } from "@/src/components/GlassSurface";
import { APP_CONFIG } from "@/src/constants/config";
import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { isLiquidGlassAvailable } from "@/src/utils/nativeGlass";

export type GlassToastVariant = "success" | "error" | "info";

const ICONS: Record<GlassToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  info: "information-circle",
};

type GlassToastCardProps = ToastConfigParams<object> & {
  variant: GlassToastVariant;
};

function GlassToastCard({ variant, text1, text2, onPress }: GlassToastCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasGlass = isLiquidGlassAvailable();

  const accent = variant === "success" ? colors.positive : variant === "error" ? colors.destructive : colors.primary;

  const hasText1 = Boolean(text1?.trim());
  const hasText2 = Boolean(text2?.trim());
  if (!hasText1 && !hasText2) return null;

  return (
    <Pressable onPress={onPress} style={styles.pressable} accessibilityRole="alert">
      <View style={styles.shell}>
        <GlassSurface borderRadius={RADIUS.LG} />
        {!hasGlass ? (
          <View style={[styles.fallbackBorder, { borderColor: `${colors.border}99` }]} pointerEvents="none" />
        ) : null}
        <View style={[styles.accentBar, { backgroundColor: accent }]} pointerEvents="none" />
        <View style={styles.content}>
          <Ionicons name={ICONS[variant]} size={22} color={accent} style={styles.icon} />
          <View style={styles.textCol}>
            {hasText1 ? (
              <Text style={styles.text1} numberOfLines={2}>
                {text1}
              </Text>
            ) : null}
            {hasText2 ? (
              <Text style={styles.text2} numberOfLines={3}>
                {text2}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const glassToastConfig = {
  success: (props: ToastConfigParams<object>) => <GlassToastCard {...props} variant="success" />,
  error: (props: ToastConfigParams<object>) => <GlassToastCard {...props} variant="error" />,
  info: (props: ToastConfigParams<object>) => <GlassToastCard {...props} variant="info" />,
  default: (props: ToastConfigParams<object>) => <GlassToastCard {...props} variant="info" />,
};

export const glassToastDefaults = {
  visibilityTime: APP_CONFIG.TOAST_AUTO_CLOSE_DELAY,
  swipeable: true,
};

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    pressable: {
      width: "92%",
      maxWidth: 400,
      alignSelf: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
        },
        android: { elevation: 8 },
        default: {},
      }),
    },
    shell: {
      borderRadius: RADIUS.LG,
      overflow: "hidden",
      minHeight: 52,
    },
    fallbackBorder: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: RADIUS.LG,
      borderWidth: StyleSheet.hairlineWidth,
    },
    accentBar: {
      position: "absolute",
      left: 0,
      top: 10,
      bottom: 10,
      width: 3,
      borderRadius: RADIUS.FULL,
      zIndex: 2,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      paddingLeft: 16,
      zIndex: 3,
    },
    icon: {
      marginRight: 10,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    text1: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
    },
    text2: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
    },
  });
