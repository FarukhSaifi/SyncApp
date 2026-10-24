import { Image, type ImageStyle, type StyleProp } from "react-native";

import { LABELS } from "@constants";
import { APP_LOGO } from "@constants/designTokens";

import type { AppLogoProps } from "@types";

const logoSource = require("../../assets/images/logo.png");

/**
 * SyncApp brand mark — same asset as the web client header / auth screens.
 */
export function AppLogo({ variant = "header", style }: AppLogoProps) {
  const size = variant === "auth" ? APP_LOGO["AUTH_SIZE"] : APP_LOGO["HEADER_SIZE"];
  const radius = variant === "auth" ? APP_LOGO["RADIUS_AUTH"] : APP_LOGO["RADIUS_HEADER"];

  return (
    <Image
      source={logoSource}
      accessibilityLabel={LABELS["APP_LOGO_ALT"]}
      resizeMode="cover"
      style={[{ width: size, height: size, borderRadius: radius }, style]}
    />
  );
}
