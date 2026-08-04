/**
 * Use to build endpoints that serve definitions and images for cards;
 * not state data in the context of a game.
 *
 * Definitions are kept in the private submodule at `/cards/definitions`.
 * Images are kept in the private submodule at `/cards/images`.
 *
 * The `/images` folder should be populated with `.png` files, with names based
 * on the name of the corresponding card, transformed to "kebab-case" e.g. `"My
 * Card"` to `"my-card"`.
 *
 * The file names must also be infixed with `.thumbnail` or `.fullsize` e.g.
 * `"My Card"` to `my-card.thumbnail.png` and `my-card.fullsize.png`.
 *
 * Thumbnails should have a square, 1:1 aspect ratio, and full size cards should
 * have a rectangular 5:7 aspect ratio.
 */
import fs from "node:fs";
import { ROUTES } from "@common/api/routes";
import { cardDefDigest } from "@server/api/digests/cards";
import { makeContentHash, matchesHeader } from "@server/api/etags";
import { burstLimiter } from "@server/api/middleware";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";
import { allRegisteredCards } from "@server/game/cards/registry";
import type { CardDef } from "@server/game/types";
import { logger } from "@server/logger";
import type { RequestHandler } from "express";
import { Router, static as staticFileHandler } from "express";
import slowDown from "express-slow-down";
import type z from "zod";

type CatalogBody = z.infer<
  typeof ROUTES.cards.methods.getMany.schemas.responseBody
>;

type Dependencies = {
  cardImagesPath: string | null;
  /** Override the source of card definitions. */
  getCards?: () => CardDef[];
  /** Override the default rate-limit middleware. */
  rateLimiters?: RequestHandler[];
};

/** How long a client may reuse the catalog without revalidating. */
const CATALOG_MAX_AGE_SECONDS = 300;

/******************************************************************************
 * ### cardsRouter
 *
 * Generates endpoints for accessing card definitions and card assets e.g.
 * images.
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

    // The registry is fixed for the lifetime of the process, so the catalog is
    // built and hashed once here rather than on every request. Messages are
    // resolved by the client, so the payload is the same for every caller.
    //
    // Note that this assumes a single response. Should this endpoint ever take
    // parameters that vary the payload, the etag has to vary with them too.
    const catalog: CatalogBody = {
      cards: (deps.getCards ?? allRegisteredCards)().map(cardDefDigest),
    };
    const etag = makeContentHash(JSON.stringify(catalog));
    logger.info({ count: catalog.cards.length }, "built card catalog");

    /**
     * ### GET cards
     *
     * Used to get the definition of every card currently implemented, for
     * views that show the cards themselves rather than a game.
     *
     * The response is identical for every caller, so it can be revalidated
     * with "If-None-Match" and cached by shared caches.
     */
    router.get(
      ROUTES.cards.methods.getMany.path,
      validated({
        schemas: ROUTES.cards.methods.getMany.schemas,
        handler: (req, res) => {
          if (matchesHeader(req.get("If-None-Match"), etag)) {
            return res.status(STATUS.notModified).end();
          }
          res.set("ETag", etag);
          res.set(
            "Cache-Control",
            `public, max-age=${CATALOG_MAX_AGE_SECONDS}`,
          );
          res.status(STATUS.ok).json(catalog);
        },
      }),
    );

    if (deps.cardImagesPath) {
      if (fs.existsSync(deps.cardImagesPath)) {
        router.use(
          ROUTES.cards.methods.images.path,
          staticFileHandler(deps.cardImagesPath, {
            maxAge: "7d",
            immutable: true,
          }),
        );
      }
    }

    return router;
  },
};
