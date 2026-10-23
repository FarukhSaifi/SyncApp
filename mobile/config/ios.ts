import { LATEST_IOS_DEPLOYMENT_TARGET } from "./iosDefaults.ts";

/**
 * iOS native build settings — driven by env (see mobile/.env.example).
 * Consumed by app.config.ts.
 */
export const IOS_BUILD = Object.freeze({
  BUILD_NUMBER: process.env.IOS_BUILD_NUMBER ?? "1",
  SUPPORTS_TABLET: process.env.IOS_SUPPORTS_TABLET !== "false",
  DEPLOYMENT_TARGET: process.env.IOS_DEPLOYMENT_TARGET ?? LATEST_IOS_DEPLOYMENT_TARGET,
});

/** expo-build-properties plugin for deployment target and related iOS/Android flags. */
export function iosBuildPropertiesPlugin(): [string, Record<string, unknown>] {
  return [
    "expo-build-properties",
    {
      ios: {
        deploymentTarget: IOS_BUILD.DEPLOYMENT_TARGET,
      },
      android: {
        compileSdkVersion: 36,
        targetSdkVersion: 36,
        minSdkVersion: 24,
      },
    },
  ];
}

export { LATEST_IOS_DEPLOYMENT_TARGET };
