import { StyleSheet, View } from "react-native";

import { ProfileHeaderButton } from "@/src/components/ProfileHeaderButton";
import { ThemeToggleButton } from "@/src/components/ThemeToggleButton";
import { HEADER_ACTION } from "@/src/constants/headerActions";

type HeaderActionSlotProps = {
  children: React.ReactNode;
  edge?: "left" | "right";
};

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
  },
});

export function HeaderActionSlot({ children, edge }: HeaderActionSlotProps) {
  return (
    <View style={[slotStyles.slot, edge === "left" && slotStyles.insetLeft, edge === "right" && slotStyles.insetRight]}>
      {children}
    </View>
  );
}

export function AppHeaderLeft() {
  return (
    <HeaderActionSlot edge="left">
      <ThemeToggleButton />
    </HeaderActionSlot>
  );
}

/** Profile button — tabs headerRight and iOS stack headerRightItems. */
export function AppHeaderRight() {
  return (
    <View style={slotStyles.trailingHost}>
      <HeaderActionSlot edge="right">
        <ProfileHeaderButton />
      </HeaderActionSlot>
    </View>
  );
}
