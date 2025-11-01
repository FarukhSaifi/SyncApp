import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API requests to backend in development
    // In production, set VITE_API_BACKEND_URL to your backend URL
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:9000",
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
});
