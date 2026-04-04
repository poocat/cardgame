import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "@server/config";
import { logger } from "@server/logger";
import { Router } from "express";

export const rulebook = Router();

const rulesDir = CONFIG.privatePath
  ? path.join(CONFIG.privatePath, "copy", "rules")
  : null;

if (rulesDir && fs.existsSync(rulesDir)) {
  logger.info({ dir: rulesDir }, "serving rules");
}

rulebook.get("/", (req, res) => {
  if (!rulesDir || !fs.existsSync(rulesDir)) {
    return res.status(404).json({ error: "Rules not available" });
  }

  const locale = typeof req.query.locale === "string" ? req.query.locale : "en";
  const filePath = path.join(rulesDir, `${locale}.md`);
  const fallbackPath = path.join(rulesDir, "en.md");
  const resolvedPath = fs.existsSync(filePath) ? filePath : fallbackPath;

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: "Rules not found" });
  }

  const content = fs.readFileSync(resolvedPath, "utf-8");
  res.type("text/markdown").send(content);
});
