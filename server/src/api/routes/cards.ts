import express, { Router } from "express";
import fs from "node:fs";
import path from "node:path";

export const cards = Router();

const imagesPath = path.resolve(__dirname, "../../game/cards/private/images");

if (fs.existsSync(imagesPath)) {
  cards.use(
    "/images",
    express.static(imagesPath, {
      maxAge: "7d",
      immutable: true,
    }),
  );
}
