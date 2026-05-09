import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const defaultPublicDir = path.resolve(__dirname, "./public");
const privatePublicDir = path.resolve(__dirname, "../private/client/public");

// https://vite.dev/config/
export default defineConfig({
  // Use alternative "public" folder in the private submodule if it exists.
  publicDir: fs.existsSync(privatePublicDir)
    ? privatePublicDir
    : defaultPublicDir,
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
