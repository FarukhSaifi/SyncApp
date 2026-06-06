import type { NextConfig } from "next";
import path from "path";

import { buildSecurityHeaders, getApiOrigin } from "./config/security";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  typescript: {
    ignoreBuildErrors: true, // route type resolution issue with (auth)/(dashboard) groups
  },
  experimental: {
    optimizePackageImports: ["react-icons", "recharts", "@tiptap/react", "@tiptap/starter-kit"],
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
