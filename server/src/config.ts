import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

if (
  nodeEnv === "production" &&
  (!allowedOrigins || allowedOrigins.length === 0)
) {
  throw new Error("CORS_ORIGINS must be set in production");
}

export const CONFIG = {
  port: process.env.PORT || 7070,
  nodeEnv,
  mongoDbName: process.env.MONGODB_NAME || "cardgame",
  mongoDbUri: process.env.MONGODB_URI || `mongodb://localhost:27017`,
  privatePath: process.env.PRIVATE_PATH
    ? path.resolve(process.env.PRIVATE_PATH)
    : null,
  logLevel: process.env.LOG_LEVEL || "info",
  allowedOrigins: allowedOrigins ?? ["http://localhost:5173"],
};
