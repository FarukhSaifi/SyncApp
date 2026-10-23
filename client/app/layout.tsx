import type { Metadata } from "next";

import { APP_ICONS } from "@constants/assets";
import { APP_CONFIG } from "@constants/config";
import { STORAGE_KEYS, THEME_VALUES } from "@constants/theme";

import { Toaster } from "@components/common/Toaster";

import { Providers } from "./providers";

import { getSiteOrigin } from "../config/security";

import "./globals.css";

const isProd = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: `${APP_CONFIG.APP_NAME} - Blog Syndication Platform`,
    template: `%s | ${APP_CONFIG.APP_NAME}`,
  },
  description: APP_CONFIG.APP_DESCRIPTION,
  icons: {
    icon: [
      { url: APP_ICONS["FAVICON_ICO"], type: "image/x-icon", sizes: "any" },
      { url: APP_ICONS["FAVICON_PNG"], type: "image/png", sizes: APP_ICONS["FAVICON_SIZE"] },
      { url: APP_ICONS["ICON_PNG"], type: "image/png", sizes: APP_ICONS["ICON_SIZE"] },
    ],
    apple: [{ url: APP_ICONS["APPLE_TOUCH"], type: "image/png", sizes: APP_ICONS["APPLE_TOUCH_SIZE"] }],
    // Legacy Safari probes this path even when `apple` is set.
    other: [{ rel: "apple-touch-icon-precomposed", url: APP_ICONS["APPLE_TOUCH_PRECOMPOSED"] }],
  },
  ...(isProd && {
    robots: { index: false, follow: false },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeKey = STORAGE_KEYS.THEME;
  const darkValue = THEME_VALUES.DARK;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- theme flash prevention (rendering-hydration-no-flicker)
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('${themeKey}');
                  if (theme === '${darkValue}' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches))
                    document.documentElement.classList.add('${darkValue}');
                  else
                    document.documentElement.classList.remove('${darkValue}');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
