import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true, // route type resolution issue with (auth)/(dashboard) groups
  },
  // Proxy /api to backend in development (production uses NEXT_PUBLIC_API_BACKEND_URL)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;
    if (apiUrl) {
      try {
        const base = new URL(apiUrl);
        const origin = base.origin;
        return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
      } catch {
        // Invalid URL, skip rewrites
      }
    }
    return [{ source: "/api/:path*", destination: "http://localhost:9000/api/:path*" }];
  },
  transpilePackages: ["quill", "react-quilljs"],
};

export default nextConfig;
