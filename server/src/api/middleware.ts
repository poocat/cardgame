import { CONSTANTS } from "@common/game/constants";
import { logger } from "@server/logger";
import type { ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { STATUS } from "./status";

/******************************************************************************
 * ### burstLimiter
 *
 * Catches rapid-fire, automated abuse.
 ******************************************************************************/
export const burstLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 30,
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
export const sustainedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, url: req.url }, "sustained rate limit exceeded");
    res
      .status(STATUS.tooManyRequests)
      .json({ message: "Too many requests, please try again later" });
  },
});

/******************************************************************************
 * ### pollSlowdown
 *
 * Discourages aggressive polling.
 ******************************************************************************/
export const pollSlowdown = slowDown({
  windowMs: 30 * 1000,
  delayAfter: 60,
  delayMs: (hits) => Math.max(0, hits - 60) * 200,
  maxDelayMs: 1000,
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
