import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true, // route type resolution issue with (auth)/(dashboard) groups
  },
  // Proxy /api to backend
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const apiUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || (isProd ? 'https://sync-app-server.vercel.app' : 'http://localhost:5000');
    
    try {
      const base = new URL(apiUrl);
      const origin = base.origin;
      return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
    } catch {
      return [{ source: "/api/:path*", destination: "http://localhost:5000/api/:path*" }];
    }
  },
  transpilePackages: ["quill", "react-quilljs"],
};

export default nextConfig;
