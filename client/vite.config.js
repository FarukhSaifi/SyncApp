import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
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
