import { useMemo } from "react";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { Spinner } from "@components/Spinner";
import { BUTTON_SIZES, BUTTON_VARIANTS, RADIUS } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { ButtonProps, ButtonSize, ButtonVariant } from "@types";

export function Button({
  title,
  onPress,
  variant = BUTTON_VARIANTS.PRIMARY,
  size = BUTTON_SIZES.DEFAULT,
  disabled,
  loading,
  style,
}: ButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const variantStyle = getVariantStyle(styles, variant);
  const sizeStyle = size === BUTTON_SIZES.SM ? styles.sm : size === BUTTON_SIZES.LG ? styles.lg : styles.default;
  const textStyle = getTextStyle(styles, variant);
  const spinnerColor =
    variant === BUTTON_VARIANTS.OUTLINE || variant === BUTTON_VARIANTS.GHOST
      ? colors.primary
      : colors.primaryForeground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        sizeStyle,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? <Spinner size="sm" color={spinnerColor} /> : <Text style={[styles.text, textStyle]}>{title}</Text>}
    </Pressable>
  );
}

function getVariantStyle(styles: ReturnType<typeof createStyles>, variant: ButtonVariant) {
  switch (variant) {
    case BUTTON_VARIANTS.OUTLINE:
      return styles.outline;
    case BUTTON_VARIANTS.SECONDARY:
      return styles.secondary;
    case BUTTON_VARIANTS.ACCENT:
      return styles.accent;
    case BUTTON_VARIANTS.DANGER:
    case "danger":
    case BUTTON_VARIANTS.DESTRUCTIVE:
      return styles.destructive;
    case BUTTON_VARIANTS.POSITIVE:
      return styles.positive;
    case BUTTON_VARIANTS.WARNING:
      return styles.warning;
    case BUTTON_VARIANTS.GHOST:
      return styles.ghost;
    case BUTTON_VARIANTS.DEFAULT:
      return styles.defaultVariant;
    default:
      return styles.primary;
  }
}

function getTextStyle(styles: ReturnType<typeof createStyles>, variant: ButtonVariant) {
  switch (variant) {
    case BUTTON_VARIANTS.OUTLINE:
    case BUTTON_VARIANTS.GHOST:
      return styles.outlineText;
    case BUTTON_VARIANTS.SECONDARY:
      return styles.secondaryText;
    default:
      return styles.textOnColor;
  }
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    base: {
      borderRadius: RADIUS.MD,
      alignItems: "center",
      justifyContent: "center",
    },
    default: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 40 },
    sm: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
    lg: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 },
    text: { fontWeight: "600", fontSize: 14 },
    textOnColor: { color: colors.primaryForeground },
    outlineText: { color: colors.foreground },
    secondaryText: { color: colors.secondaryForeground },
    primary: { backgroundColor: colors.primary },
    defaultVariant: { backgroundColor: colors.secondary },
    secondary: { backgroundColor: colors.secondary },
    accent: { backgroundColor: colors.accent },
    destructive: { backgroundColor: colors.destructive },
    positive: { backgroundColor: colors.positive },
    warning: { backgroundColor: colors.warning },
    outline: {
      backgroundColor: "transparent",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    ghost: { backgroundColor: "transparent" },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.88 },
  });
