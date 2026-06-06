import { Platform } from "react-native";

let liquidGlassCached: boolean | undefined;

/**
 * True when iOS Liquid Glass API is available (SDK 56+ with expo-glass-effect).
 * SDK 54 uses blur fallback only — always false here.
 */
export function isLiquidGlassAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  if (liquidGlassCached !== undefined) return liquidGlassCached;

  try {
    // expo-glass-effect is SDK 56+; optional at runtime on older SDKs
    const { isLiquidGlassAvailable: check } = require("expo-glass-effect") as {
      isLiquidGlassAvailable?: () => boolean;
    };
    liquidGlassCached = typeof check === "function" && check();
  } catch {
    liquidGlassCached = false;
  }

  return liquidGlassCached;
}
