import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  port: process.env.PORT || 7070,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoDbName: process.env.MONGODB_NAME || "cardgame",
  mongoDbUri: process.env.MONGODB_URI || `mongodb://localhost:27017`,
  privatePath: process.env.PRIVATE_PATH
    ? path.resolve(process.env.PRIVATE_PATH)
    : null,
  logLevel: process.env.LOG_LEVEL || "info",
};
