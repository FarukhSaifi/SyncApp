import { BlurView } from "expo-blur";
import type { ComponentType } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/src/contexts/ThemeContext";
import { isNativeBlurAvailable } from "@/src/utils/nativeBlur";
import { isLiquidGlassAvailable } from "@/src/utils/nativeGlass";

interface GlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  borderRadius: number;
  /** iOS 26 Liquid Glass touch feedback when true (SDK 56+ only) */
  interactive?: boolean;
}

function LiquidGlassLayer({ isDark, interactive }: { isDark: boolean; interactive: boolean }) {
  try {
    const { GlassView } = require("expo-glass-effect") as {
      GlassView: ComponentType<{
        style: object;
        glassEffectStyle: string;
        colorScheme: string;
        isInteractive?: boolean;
      }>;
    };
    return (
      <GlassView
        style={StyleSheet.absoluteFill}
        glassEffectStyle="regular"
        colorScheme={isDark ? "dark" : "light"}
        isInteractive={interactive}
      />
    );
  } catch {
    return null;
  }
}

/**
 * Liquid Glass (SDK 56+) → BlurView → opaque fallback.
 */
export function GlassSurface({ style, borderRadius, interactive = false }: GlassSurfaceProps) {
  const { isDark } = useTheme();
  const liquidGlass = isLiquidGlassAvailable();
  const nativeBlur = isNativeBlurAvailable();

  const clipStyle = [StyleSheet.absoluteFill, { borderRadius, overflow: "hidden" as const }, style];

  if (liquidGlass) {
    return (
      <View style={clipStyle} pointerEvents="none" collapsable={false}>
        <LiquidGlassLayer isDark={isDark} interactive={interactive} />
      </View>
    );
  }

  if (nativeBlur) {
    return (
      <View style={clipStyle} pointerEvents="none">
        <BlurView
          intensity={isDark ? 72 : 88}
          tint={isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? "rgba(28,28,30,0.45)" : "rgba(255,255,255,0.55)",
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        clipStyle,
        {
          backgroundColor: isDark ? "rgba(28,28,30,0.92)" : "rgba(255,255,255,0.94)",
        },
      ]}
      pointerEvents="none"
    />
  );
}
