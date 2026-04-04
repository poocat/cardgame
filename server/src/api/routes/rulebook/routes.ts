import fs from "node:fs/promises";
import path from "node:path";
import { ROUTES } from "@common/api/routes";
import { burstLimiter } from "@server/api/middleware";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";
import { CONFIG } from "@server/config";
import { logger } from "@server/logger";
import { Router } from "express";

export const rulebook = Router();
rulebook.use(burstLimiter({ windowMs: 10 * 1000, max: 20 }));

const rulesDir = CONFIG.privatePath
  ? path.join(CONFIG.privatePath, "copy", "rules")
  : null;

rulebook.get(
  ROUTES.rulebook.methods.get.path,
  validated({
    schemas: ROUTES.rulebook.methods.get.schemas,
    handler: async (req, res) => {
      if (!rulesDir) {
        return res
          .status(STATUS.notFound)
          .json({ message: "Rules not available" });
      }

      const locale = req.query.locale ?? "en";
      const filePath = path.join(rulesDir, `${locale}.md`);
      const fallbackPath = path.join(rulesDir, "en.md");

      for (const candidate of [filePath, fallbackPath]) {
        try {
          const content = await fs.readFile(candidate, "utf-8");
          logger.debug({ locale, file: candidate }, "serving rulebook");
          return res.type("text/markdown").send(content);
        } catch {}
      }

      return res.status(STATUS.notFound).json({ message: "Rules not found" });
    },
  }),
);
