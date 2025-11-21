import { pino, Logger } from "pino";
import { CONFIG } from "@server/config";

const isDevEnv = CONFIG.nodeEnv === "development";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  transport: isDevEnv
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: isDevEnv || "development",
  },
});

/******************************************************************************
 * ### createChildLogger
 *
 * Creates a child logger with additional context that will be included in all
 * subsequent logs.
 ******************************************************************************/
export function makeChildLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}
