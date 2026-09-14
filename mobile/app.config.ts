import type { ConfigContext, ExpoConfig } from "expo/config";

import { APP_IDENTITY, BRAND_COLORS, EAS_PROJECT_ID as DEFAULT_EAS_PROJECT_ID } from "./config/app.ts";
import { IOS_BUILD, iosBuildPropertiesPlugin } from "./config/ios.ts";


const BUNDLE_ID = process.env.IOS_BUNDLE_IDENTIFIER || "com.farukh.syncapp";
const ANDROID_PKG = process.env.ANDROID_PACKAGE || BUNDLE_ID;
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? DEFAULT_EAS_PROJECT_ID;
const IS_PRODUCTION_BUILD = process.env.EAS_BUILD_PROFILE === "production";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_IDENTITY.NAME,
  slug: APP_IDENTITY.SLUG,
  version: APP_IDENTITY.VERSION,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: APP_IDENTITY.SCHEME,
  userInterfaceStyle: "automatic",
  ...({
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: BRAND_COLORS.SPLASH_BACKGROUND,
    },
  } as Partial<ExpoConfig>),
  ...({ newArchEnabled: true } as Partial<ExpoConfig>),
  ios: {
    supportsTablet: IOS_BUILD.SUPPORTS_TABLET,
    bundleIdentifier: BUNDLE_ID,
    buildNumber: IOS_BUILD.BUILD_NUMBER,
    ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {}),
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
      ITSAppUsesNonExemptEncryption: false,
      UIRequiredDeviceCapabilities: ["arm64"],
      UIDeviceFamily: IOS_BUILD.SUPPORTS_TABLET ? [1, 2] : [1],
    },
  },
  android: {
    package: ANDROID_PKG,
    adaptiveIcon: {
      backgroundColor: BRAND_COLORS.SPLASH_BACKGROUND,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    ...(IS_PRODUCTION_BUILD ? [] : ["expo-dev-client"]),
    iosBuildPropertiesPlugin(),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://sync-app-server.vercel.app/api",
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
