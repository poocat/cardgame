import express, { Router } from "express";
import fs from "node:fs";
import path from "node:path";

export const cards = Router();

const thumbnailImagesPath = path.resolve(
  __dirname,
  "../../game/cards/private/images/thumbnail",
);
const fullsizeImagesPath = path.resolve(
  __dirname,
  "../../game/cards/private/images/fullsize",
);

if (fs.existsSync(thumbnailImagesPath)) {
  cards.use(
    "/images/thumbnail",
    express.static(thumbnailImagesPath, {
      maxAge: "7d",
      immutable: true,
    }),
  );
}
if (fs.existsSync(fullsizeImagesPath)) {
  cards.use(
    "/images/fullsize",
    express.static(fullsizeImagesPath, {
      maxAge: "7d",
      immutable: true,
    }),
  );
}
