import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Central error handler to keep the process alive on failures.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error("Unhandled error", { error: String(err) });

  res.status(500).json({
    success: false,
    message: err.message,
    error: err.message,
    stack: err.stack,
  });
};
