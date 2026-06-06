import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IOS26 } from "@/src/constants/designTokens";

/** Bottom padding so scroll content clears the floating drop tab bar (+ FAB overhang). */
export function useTabBarInset(extra = IOS26.TAB_BAR_CONTENT_EXTRA): number {
  const insets = useSafeAreaInsets();
  return (
    IOS26.TAB_BAR_FLOATING_HEIGHT + IOS26.TAB_BAR_NEW_POST_OVERHANG + IOS26.TAB_BAR_BOTTOM_GAP + insets.bottom + extra
  );
}
