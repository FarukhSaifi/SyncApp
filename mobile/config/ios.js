const { LATEST_IOS_DEPLOYMENT_TARGET } = require("./iosDefaults.js");

/**
 * iOS native build settings — driven by env (see mobile/.env.example).
 * Consumed by app.config.ts via require().
 */
const IOS_BUILD = Object.freeze({
  BUILD_NUMBER: process.env.IOS_BUILD_NUMBER ?? "1",
  SUPPORTS_TABLET: process.env.IOS_SUPPORTS_TABLET !== "false",
  DEPLOYMENT_TARGET: process.env.IOS_DEPLOYMENT_TARGET ?? LATEST_IOS_DEPLOYMENT_TARGET,
});

/** expo-build-properties plugin for deployment target and related iOS flags. */
function iosBuildPropertiesPlugin() {
  return [
    "expo-build-properties",
    {
      ios: {
        deploymentTarget: IOS_BUILD.DEPLOYMENT_TARGET,
      },
    },
  ];
}

module.exports = {
  LATEST_IOS_DEPLOYMENT_TARGET,
  IOS_BUILD,
  iosBuildPropertiesPlugin,
};
