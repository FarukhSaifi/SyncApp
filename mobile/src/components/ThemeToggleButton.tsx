import { Ionicons } from "@expo/vector-icons";

import { IconHeaderButton } from "@components/IconHeaderButton";
import { HEADER_ICON_BUTTON } from "@constants/designTokens";
import { LABELS } from "@constants/messages";
import { useTheme, useThemeColors } from "@contexts/ThemeContext";
import type { ThemeToggleButtonProps } from "@types";

export function ThemeToggleButton({ variant = "header" }: ThemeToggleButtonProps) {
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const iconColor = variant === "floating" ? colors.foreground : colors.mutedForeground;

  return (
    <IconHeaderButton accessibilityLabel={LABELS.TOGGLE_THEME_ARIA} onPress={toggleTheme}>
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={HEADER_ICON_BUTTON.ICON_SIZE}
        color={iconColor}
      />
    </IconHeaderButton>
  );
}
