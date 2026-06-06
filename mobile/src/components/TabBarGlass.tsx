import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { GlassSurface } from "@/src/components/GlassSurface";
import { IOS26 } from "@/src/constants/designTokens";

interface TabBarGlassProps {
  style?: StyleProp<ViewStyle>;
}

/** Floating tab pill surface with Liquid Glass when available. */
export function TabBarGlass({ style }: TabBarGlassProps) {
  return (
    <GlassSurface
      style={[StyleSheet.absoluteFill, styles.clip, style]}
      borderRadius={IOS26.TAB_BAR_DROP_RADIUS}
      interactive
    />
  );
}

const styles = StyleSheet.create({
  clip: {
    borderRadius: IOS26.TAB_BAR_DROP_RADIUS,
    overflow: "hidden",
  },
});
