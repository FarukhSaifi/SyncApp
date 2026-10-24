import logo from "@assets/icons/logo.png";
import { INFO_MESSAGES } from "@constants";
import type { AppLogoProps } from "@types";
import Image from "next/image";

import { APP_HEADER } from "@constants/designTokens";

const AppLogo = ({ variant = "header", className, priority = false }: AppLogoProps) => {
  const isAuth = variant === "auth";
  const size = isAuth ? APP_HEADER["LOGO_AUTH_SIZE_PX"] : APP_HEADER["LOGO_SIZE_PX"];
  const defaultClass = isAuth ? APP_HEADER["LOGO_AUTH_IMAGE_CLASS"] : APP_HEADER["LOGO_IMAGE_CLASS"];

  return (
    <Image
      src={logo}
      alt={INFO_MESSAGES["APP_LOGO_ALT"]}
      width={size}
      height={size}
      className={className ?? defaultClass}
      priority={priority}
    />
  );
};

export default AppLogo;
