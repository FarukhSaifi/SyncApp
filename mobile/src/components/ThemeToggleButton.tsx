import { Ionicons } from "@expo/vector-icons";

import { IconHeaderButton } from "@/src/components/IconHeaderButton";
import { HEADER_ICON_BUTTON } from "@/src/constants/designTokens";
import { LABELS } from "@/src/constants/messages";
import { useTheme, useThemeColors } from "@/src/contexts/ThemeContext";

type ThemeToggleButtonProps = {
  /** Use in stack headers (default) or floating on auth screens */
  variant?: "header" | "floating";
};

export function ThemeToggleButton({ variant = "header" }: ThemeToggleButtonProps) {
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const iconColor = variant === "floating" ? colors.foreground : colors.primary;

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
