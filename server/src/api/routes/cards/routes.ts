/**
 * Use to build an endpoint to serve the images for the games' cards.
 *
 * Images are kept in the private submodule at `/cards/images`.
 *
 * The `/images` folder must contain `.svg` files, with names based on the name
 * of the corresponding card, transformed to "kebab-case" e.g. `"My Card"` to
 * `"my-card"`.
 *
 * The file names must also be infixed with `.thumbnail` or `.fullsize` e.g.
 * `"My Card"` to `my-card.thumbnail.svg` and `my-card.fullsize.svg`.
 *
 * Thumbnails should have a square, 1:1 aspect ratio, and full size cards should
 * have a rectangular 5:7 aspect ratio.
 */
import fs from "node:fs";
import path from "node:path";
import { ROUTES } from "@common/api/routes";
import { burstLimiter } from "@server/api/middleware";
import { logger } from "@server/logger";
import type { RequestHandler } from "express";
import { Router, static as staticFileHandler } from "express";
import slowDown from "express-slow-down";

type Dependencies = {
  privatePath: string | null;
  /** Override the default rate-limit middleware. */
  rateLimiters?: RequestHandler[];
};

/******************************************************************************
 * ### cardsRouter
 *
 * Generates endpoints for accessing card-related assets e.g. images.
 ******************************************************************************/
export const cardsRouter = {
  path: ROUTES.cards.path,
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

    if (deps.privatePath) {
      const dir = path.join(deps.privatePath, "cards", "images");
      if (fs.existsSync(dir)) {
        router.use(
          `/images`,
          staticFileHandler(dir, {
            maxAge: "7d",
            immutable: true,
          }),
        );
        logger.info({ dir }, "serving card images");
      }
    }

    return router;
  },
};
