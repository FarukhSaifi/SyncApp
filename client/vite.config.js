import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: process.env.NODE_ENV === "production" ? process.env.API_URL : "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
});
