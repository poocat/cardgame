/**
 * Configures an endpoint to serve the images that accompany cards.
 *
 * Images are kept in the private submodule at `private/cards/images`,
 * which is configured as a git submodule.
 *
 * The `cards` directory must have an `images` directory,
 * containing `.svg` files. The files must be named based on the name of the
 * card, transformed to "kebab-case" e.g. `"My Card"` to `"my-card"`.
 *
 * The file names must also be infixed with `.thumbnail` or `.fullsize` e.g.
 * `"My Card"` to `my-card.thumbnail.svg` and `my-card.fullsize.svg`.
 *
 * Thumbnails should have a square, 1:1 aspect ratio, and full size cards should
 * have a rectangular 5:7 aspect ratio.
 */

import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "@server/config";
import { logger } from "@server/logger";
import { Router, static as staticFileHandler } from "express";

export const cards = Router();

if (CONFIG.privatePath) {
  const dir = path.join(CONFIG.privatePath, "cards", "images");
  if (fs.existsSync(dir)) {
    cards.use(
      `/images`,
      staticFileHandler(dir, {
        maxAge: "7d",
        immutable: true,
      }),
    );
    logger.info({ dir }, "serving card images");
  }
}
