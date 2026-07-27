import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // The API runs as its own process in dev; in production server/index.js
    // serves dist/ from the same origin, so the client's relative /api base
    // works unchanged in both.
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
