import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { IconHeaderButton } from "@components/IconHeaderButton";
import { ROUTES } from "@constants";
import { HEADER_ICON_BUTTON } from "@constants/designTokens";
import { LABELS } from "@constants/messages";
import { useThemeColors } from "@contexts/ThemeContext";

/** Opens profile as a root-stack modal popup. */
export function ProfileHeaderButton() {
  const colors = useThemeColors();

  return (
    <IconHeaderButton accessibilityLabel={LABELS.PROFILE} onPress={() => router.push(ROUTES.PROFILE)}>
      <Ionicons name="person-circle-outline" size={HEADER_ICON_BUTTON.PROFILE_ICON_SIZE} color={colors.primary} />
    </IconHeaderButton>
  );
}
