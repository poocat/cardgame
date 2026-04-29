/**
 * Use to build an endpoint to serve copy to render in the front end.
 *
 * Copy is kept in the private submodule at `/copy` as markdown files.
 *
 * All copy must be named, and stored as localizations. English-language "rules"
 * copy would be stored at `/copy/rules/en.md`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { ROUTES } from "@common/api/routes";
import { burstLimiter } from "@server/api/middleware";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";
import { logger } from "@server/logger";
import { Router } from "express";

/******************************************************************************
 * ### copyRouter
 *
 * Endpoints to access various written copy e.g. game rules.
 ******************************************************************************/
export const copyRouter = {
  path: ROUTES.copy.path,
  create: (deps: { privatePath: string | null }) => {
    const router = Router();

    router.use(burstLimiter({ windowMs: 10 * 1000, max: 20 }));

    const copyDir = deps.privatePath
      ? path.join(deps.privatePath, "copy")
      : null;

    router.get(
      ROUTES.copy.methods.get.path,
      validated({
        schemas: ROUTES.copy.methods.get.schemas,
        handler: async (req, res) => {
          if (!copyDir) {
            return res
              .status(STATUS.notFound)
              .json({ message: "Copy not available" });
          }

          const { name } = req.params;
          const locale = req.query.locale ?? "en";
          const dir = path.join(copyDir, name);
          const filePath = path.join(dir, `${locale}.md`);
          const fallbackPath = path.join(dir, "en.md");

          for (const candidate of [filePath, fallbackPath]) {
            try {
              const content = await fs.readFile(candidate, "utf-8");
              logger.debug({ name, locale, file: candidate }, "serving copy");
              return res.type("text/markdown").send(content);
            } catch {}
          }

          return res
            .status(STATUS.notFound)
            .json({ message: "Copy not found" });
        },
      }),
    );

    return router;
  },
};
