import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform, UIManager } from "react-native";

/** True when Expo Blur native view is linked (requires `npm run ios` after adding expo-blur). */
export function isNativeBlurAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    const hasView =
      typeof UIManager.hasViewManagerConfig === "function"
        ? UIManager.hasViewManagerConfig("ExpoBlurView")
        : UIManager.getViewManagerConfig?.("ExpoBlurView") != null;
    return hasView && requireOptionalNativeModule("ExpoBlur") != null;
  } catch {
    return false;
  }
}
