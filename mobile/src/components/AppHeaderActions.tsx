import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@components/AppLogo";
import { ProfileHeaderButton } from "@components/ProfileHeaderButton";
import { ThemeToggleButton } from "@components/ThemeToggleButton";
import { APP_CONFIG, LABELS, ROUTES } from "@constants";
import { APP_LOGO } from "@constants/designTokens";
import { HEADER_ACTION } from "@constants/headerActions";
import { useThemeColors } from "@contexts/ThemeContext";
import type { HeaderActionSlotProps } from "@types";

const slotStyles = StyleSheet.create({
  slot: {
    width: HEADER_ACTION.SLOT_SIZE,
    height: HEADER_ACTION.SLOT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  insetLeft: {
    marginLeft: HEADER_ACTION.HORIZONTAL_INSET,
  },
  insetRight: {
    marginRight: HEADER_ACTION.HORIZONTAL_INSET,
  },
  trailingHost: {
    width: HEADER_ACTION.TRAILING_HOST_WIDTH,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginLeft: "auto",
    gap: 2,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: APP_LOGO["BRAND_GAP"],
    marginLeft: APP_LOGO["BRAND_HORIZONTAL_INSET"],
    maxWidth: 180,
  },
  brandName: {
    fontSize: APP_LOGO["BRAND_NAME_SIZE"],
    fontWeight: APP_LOGO["BRAND_NAME_WEIGHT"],
  },
});

export function HeaderActionSlot({ children, edge }: HeaderActionSlotProps) {
  return (
    <View style={[slotStyles.slot, edge === "left" && slotStyles.insetLeft, edge === "right" && slotStyles.insetRight]}>
      {children}
    </View>
  );
}

/** Brand mark + wordmark — matches client app header logo. */
export function AppHeaderLeft() {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={LABELS["APP_HOME_ARIA"]}
      onPress={() => router.push(ROUTES.TABS)}
      style={slotStyles.brand}
      hitSlop={8}
    >
      <AppLogo variant="header" />
      <Text style={[slotStyles.brandName, { color: colors.foreground }]} numberOfLines={1}>
        {APP_CONFIG.APP_NAME}
      </Text>
    </Pressable>
  );
}

/** Theme + profile — trailing actions (same roles as client header). */
export function AppHeaderRight() {
  return (
    <View style={slotStyles.trailingHost}>
      <HeaderActionSlot>
        <ThemeToggleButton />
      </HeaderActionSlot>
      <HeaderActionSlot edge="right">
        <ProfileHeaderButton />
      </HeaderActionSlot>
    </View>
  );
}
