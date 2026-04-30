import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@common": path.resolve(__dirname, "../common"),
      "@client": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:7070",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});
