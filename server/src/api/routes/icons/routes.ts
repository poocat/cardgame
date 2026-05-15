/**
 * Use to build an endpoint that serves the icon bundle: a map of keyword to
 * inlined SVG content, used by the client to render icons inline with text.
 *
 * Source SVGs live in the private submodule at `/icons/<keyword>.svg`. The
 * bundle should be loaded once at router construction.
 */
import fs from "node:fs";
import path from "node:path";
import { ROUTES } from "@common/api/routes";
import { burstLimiter } from "@server/api/middleware";
import { STATUS } from "@server/api/status";
import { logger } from "@server/logger";
import type { RequestHandler } from "express";
import { Router } from "express";
import slowDown from "express-slow-down";
import DOMPurify from "isomorphic-dompurify";
import z from "zod";

type Dependencies = {
  iconMapPath: string | null;
  iconFolderPath: string | null;
  /** Override the default rate-limit middleware. */
  rateLimiters?: RequestHandler[];
};

const iconBundleSchema = z.record(z.string(), z.string());
type IconBundle = z.infer<typeof iconBundleSchema>;

function loadBundle(
  mapPath: string | null,
  iconFolderPath: string | null,
): IconBundle {
  if (!mapPath || !iconFolderPath) return {};
  if (!fs.existsSync(mapPath)) return {};
  if (!fs.existsSync(iconFolderPath)) return {};

  // Load the map.
  const content = fs.readFileSync(mapPath, "utf-8");
  let mapping: Record<string, string> = {};
  try {
    mapping = iconBundleSchema.parse(JSON.parse(content));
  } catch (error) {
    logger.warn({ from: mapPath, error }, "could not parse map");
  }

  // For each entry in the map, attempt to load the content as text.
  const bundle: Record<string, string> = {};
  const icons: Record<string, string> = {};
  for (const [key, filename] of Object.entries(mapping)) {
    if (!icons[filename]) {
      // Different keys can map to the same file name. Keep a cache.
      const iconPath = path.join(iconFolderPath, filename);
      if (fs.existsSync(iconPath)) {
        const raw = fs.readFileSync(iconPath, "utf8");
        const sanitized = DOMPurify.sanitize(raw, {
          USE_PROFILES: { svg: true },
        });
        icons[filename] = sanitized;
      } else {
        logger.warn(
          { key, path: iconPath },
          "no icon at the path for the given key",
        );
        continue;
      }
    }
    bundle[key] = icons[filename];
  }
  logger.info(
    { count: Object.keys(icons).length, from: iconFolderPath },
    "loaded icon bundle",
  );
  return bundle;
}

/******************************************************************************
 * ### iconsRouter
 *
 * Serves the inlined-SVG icon manifest at `GET /`.
 ******************************************************************************/
export const iconsRouter = {
  path: ROUTES.icons.path,
  create: (deps: Dependencies) => {
    const router = Router();

    const limiters = deps.rateLimiters ?? [
      burstLimiter({ windowMs: 5 * 1000, max: 100 }),
      slowDown({
        windowMs: 30 * 1000,
        delayAfter: 60,
        delayMs: (hits) => Math.max(0, hits - 60) * 200,
        maxDelayMs: 1000,
      }),
    ];
    for (const m of limiters) router.use(m);

    const bundle = loadBundle(deps.iconMapPath, deps.iconFolderPath);

    router.get(ROUTES.icons.methods.get.path, (_req, res) => {
      res.status(STATUS.ok).json({ icons: bundle });
    });

    return router;
  },
};
