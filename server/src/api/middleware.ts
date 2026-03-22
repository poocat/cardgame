import { CONSTANTS } from "@common/game/constants";
import { logger } from "@server/logger";
import type { ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { STATUS } from "./status";

/******************************************************************************
 * ### burstLimiter
 *
 * Catches rapid-fire, automated abuse.
 ******************************************************************************/
export const burstLimiter = ({
  windowMs = 10 * 1000,
  max = 30,
}: {
  windowMs: number;
  max: number;
}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn({ ip: req.ip, url: req.url }, "burst rate limit exceeded");
      res
        .status(STATUS.tooManyRequests)
        .json({ message: "Too many requests, slow down" });
    },
  });

/******************************************************************************
 * ### sustainedLimiter
 *
 * Catches slower but persistent abuse.
 ******************************************************************************/
export const sustainedLimiter = ({
  windowMs = 60 * 1000,
  // Roughly two requests per player per second.
  max = 60 * 2 * CONSTANTS.maxNumPlayers,
}: {
  windowMs: number;
  max: number;
}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(
        { ip: req.ip, url: req.url },
        "sustained rate limit exceeded",
      );
      res
        .status(STATUS.tooManyRequests)
        .json({ message: "Too many requests, please try again later" });
    },
  });

/******************************************************************************
 * ### errorHandler
 *
 * Logs unhandled errors in request handlers.
 *
 * Note: must be registered after all routes.
 ******************************************************************************/
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
    },
    "unhandled error",
  );
  res
    .status(STATUS.internalServerError)
    .json({ message: "Internal server error" });
};
