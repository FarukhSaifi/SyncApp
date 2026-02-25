import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode: _mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@components": path.resolve(__dirname, "src/components"),
        "@constants": path.resolve(__dirname, "src/constants"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@pages": path.resolve(__dirname, "src/pages"),
        "@services": path.resolve(__dirname, "src/services"),
        "@types": path.resolve(__dirname, "src/types"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@assets": path.resolve(__dirname, "src/assets"),
        "@styles": path.resolve(__dirname, "src/styles"),
        "@config": path.resolve(__dirname, "src/config"),
        "@contexts": path.resolve(__dirname, "src/contexts"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: process.env.VITE_API_BACKEND_URL || "http://localhost:9000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
