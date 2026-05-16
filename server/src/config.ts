import path from "node:path";
import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(7070),
    MONGODB_NAME: z.string().default("cardgame"),
    MONGODB_URI: z.string().default("mongodb://localhost:27017"),
    /** Path to the private submodule */
    PRIVATE_PATH: z.string().optional(),
    /** Threshold to emit logs */
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    /** Comma-separated list of URIs */
    CORS_ORIGINS: z
      .string()
      .transform((s) =>
        s
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      )
      .optional(),
    /** The number of trusted proxy hops */
    TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().optional(),
    /** Opt in for meta caching */
    ENABLE_META_CACHE: z.stringbool().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    if (!env.CORS_ORIGINS?.length) {
      ctx.addIssue({
        code: "custom",
        message: "CORS_ORIGINS must be set in production",
        path: ["CORS_ORIGINS"],
      });
    }
    if (env.TRUST_PROXY_HOPS === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "TRUST_PROXY_HOPS must be set in production",
        path: ["TRUST_PROXY_HOPS"],
      });
    }
  });

const env = envSchema.parse(process.env);

export const CONFIG = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  mongoDbName: env.MONGODB_NAME,
  mongoDbUri: env.MONGODB_URI,
  privatePath: env.PRIVATE_PATH ? path.resolve(env.PRIVATE_PATH) : null,
  logLevel: env.LOG_LEVEL,
  allowedOrigins: env.CORS_ORIGINS,
  trustProxyHops: env.TRUST_PROXY_HOPS ?? null,
  enableMetaCache: env.ENABLE_META_CACHE ?? false,
};
