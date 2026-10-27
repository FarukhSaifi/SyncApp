import logo from "@assets/icons/logo.png";
import { INFO_MESSAGES } from "@constants";
import type { AppLogoProps } from "@types";
import Image from "next/image";

import { APP_LOGO_VARIANTS, APP_SHELL } from "@constants/designTokens";

const AppLogo = ({ variant = APP_LOGO_VARIANTS.HEADER, className, priority = false }: AppLogoProps) => {
  const isAuth = variant === APP_LOGO_VARIANTS.AUTH;
  const size = isAuth ? APP_SHELL["LOGO_AUTH_SIZE_PX"] : APP_SHELL["LOGO_SIZE_PX"];
  const defaultClass = isAuth ? APP_SHELL["LOGO_AUTH_IMAGE_CLASS"] : APP_SHELL["LOGO_IMAGE_CLASS"];

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
