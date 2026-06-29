import appleIcon from "@assets/icons/apple-icon.png";
import favicon from "@assets/icons/favicon.png";
import icon from "@assets/icons/icon.png";
import type { Metadata } from "next";

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
      { url: favicon.src, type: "image/png" },
      { url: icon.src, type: "image/png" },
    ],
    apple: [{ url: appleIcon.src, type: "image/png" }],
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
