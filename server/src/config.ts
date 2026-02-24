import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

export const CONFIG = {
  port: process.env.PORT || 7000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoDbName: process.env.MONGODB_NAME || "cardgame",
  mongoDbUri: process.env.MONGODB_URI || `mongodb://localhost:27017`,
  privateCardsPath: process.env.PRIVATE_CARDS_PATH
    ? path.resolve(process.env.PRIVATE_CARDS_PATH)
    : null,
};
