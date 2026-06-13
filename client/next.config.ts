import type { NextConfig } from "next";
import path from "path";

import { buildSecurityHeaders, getApiOrigin } from "./config/security";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "react-icons/fi",
      "recharts",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-code-block-lowlight",
      "@tiptap/extension-image",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-text-align",
      "@tiptap/extension-underline",
      "react-markdown",
      "react-syntax-highlighter",
      "lowlight",
      "dayjs",
      "axios",
      "react-hot-toast",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(isProd),
      },
    ];
  },
  async rewrites() {
    const origin = getApiOrigin();
    return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
  },
};

export default nextConfig;
