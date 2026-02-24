import { CONFIG } from "@server/config";
import { logger } from "@server/logger";
import express, { Router } from "express";
import fs from "node:fs";
import path from "node:path";

export const cards = Router();

if (CONFIG.privateCardsPath) {
  for (const variant of ["thumbnail", "fullsize"] as const) {
    const dir = path.join(CONFIG.privateCardsPath, "images", variant);
    if (fs.existsSync(dir)) {
      cards.use(
        `/images/${variant}`,
        express.static(dir, {
          maxAge: "7d",
          immutable: true,
        }),
      );
      logger.info({ variant, dir }, "serving card images");
    }
  }
}
