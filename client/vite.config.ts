import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import { disallowedPrefixes, indexablePaths } from "./src/routes/meta.data";

const defaultPublicDir = path.resolve(__dirname, "./public");
const privatePublicDir = path.resolve(__dirname, "../private/client/public");

/******************************************************************************
 * ### crawlerFiles
 *
 * Emits `robots.txt` and `sitemap.xml`, derived from the route metadata so
 * they cannot drift from the routes the app actually serves.
 *
 * Emitted as build assets rather than checked into `public/`, which also
 * sidesteps the fact that `publicDir` swaps between the public and private
 * folders instead of merging them — a file placed in only one of them would
 * silently vanish from the other's builds.
 *
 * Without `siteUrl` there is no origin to write absolute URLs against, so the
 * sitemap is skipped and `robots.txt` omits its `Sitemap:` line. That is the
 * intended outcome for preview builds: nothing points crawlers at them.
 ******************************************************************************/
function crawlerFiles(siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/+$/, "");

  return {
    name: "cardgame:crawler-files",
    apply: "build",
    generateBundle() {
      const robots = [
        "User-agent: *",
        ...disallowedPrefixes().map((prefix) => `Disallow: ${prefix}`),
        ...(origin ? ["", `Sitemap: ${origin}/sitemap.xml`] : []),
        "",
      ].join("\n");

      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });

      if (!origin) return;

      const urls = indexablePaths()
        .map((p) => `  <url><loc>${origin}${p}</loc></url>`)
        .join("\n");

      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          urls,
          "</urlset>",
          "",
        ].join("\n"),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");

  return {
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
    plugins: [react(), crawlerFiles(env.VITE_SITE_URL ?? "")],
  };
});
