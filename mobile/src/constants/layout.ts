import { Platform } from "react-native";
import type { ReactElement } from "react";

import { TYPOGRAPHY } from "./designTokens";
import type { ThemeColors } from "./palette";

const iosHeaderBlur =
  Platform.OS === "ios"
    ? ({
        headerBlurEffect: "systemChromeMaterial" as const,
        headerLargeTitleShadowVisible: false,
      } as const)
    : ({} as const);

/**
 * Compact app header — matches client mobile shell (card bar, logo left, no large titles).
 * Page titles live in-content via ScreenIntro, like web responsive Settings/Dashboard.
 */
export function screenHeaderOptions(colors: ThemeColors) {
  return {
    headerStyle: {
      backgroundColor: colors.card,
    },
    headerTintColor: colors.primary,
    headerTitleStyle: { ...TYPOGRAPHY.HEADLINE, color: colors.foreground, fontSize: 17 },
    headerShadowVisible: false,
    headerLargeTitle: false,
    headerTitle: "",
    headerTitleAlign: "center" as const,
    ...iosHeaderBlur,
  };
}

/** @alias screenHeaderOptions */
export const stackHeaderOptions = screenHeaderOptions;

/** @alias screenHeaderOptions */
export const tabScreenOptions = screenHeaderOptions;

/**
 * Native stack profile header — iOS 26 hides shared bar-button pill via headerRightItems.
 * @see https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground
 */
export function editorProfileHeaderOptions(profileHeader: ReactElement) {
  if (Platform.OS === "ios") {
    return {
      unstable_headerRightItems: () => [
        {
          type: "custom" as const,
          element: profileHeader,
          hidesSharedBackground: true,
        },
      ],
    };
  }

  return {
    headerRight: () => profileHeader,
  };
}
