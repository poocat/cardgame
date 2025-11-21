import { pino, Logger } from "pino";
import { CONFIG } from "@server/config";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  transport:
    CONFIG.nodeEnv === "development"
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
    env: CONFIG.nodeEnv || "development",
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
