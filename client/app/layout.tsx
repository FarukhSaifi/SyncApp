import type { Metadata } from "next";

import { Toaster } from "@components/common/Toaster";

import { getSiteOrigin } from "../config/security";

import "./globals.css";
import { Providers } from "./providers";

const isProd = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "SyncApp - Blog Syndication Platform",
    template: "%s | SyncApp",
  },
  description: "Blog syndication made simple",
  ...(isProd && {
    robots: { index: false, follow: false },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        {/* Inline theme script: key must match STORAGE_KEYS.THEME; value 'dark' matches THEME_VALUES.DARK */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches))
                    document.documentElement.classList.add('dark');
                  else
                    document.documentElement.classList.remove('dark');
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
