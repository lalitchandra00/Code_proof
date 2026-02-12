import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { authenticateByClientId } from "../services/auth.service";
import { logger } from "../utils/logger";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_REGEX.test(value);

/**
 * POST /api/auth/login
 *
 * Accepts a clientId and issues a JWT access token.
 * The clientId must already exist in at least one Project or Report.
 *
 * Example curl:
 * curl -X POST http://localhost:4000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"clientId": "550e8400-e29b-41d4-a716-446655440000"}'
 */
export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      res.status(400).json({ success: false, message: "Request body required" });
      return;
    }

    const { clientId } = req.body as Record<string, unknown>;

    if (!isUuid(clientId)) {
      res.status(400).json({ success: false, message: "Invalid clientId" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "";
    if (!jwtSecret) {
      logger.error("Login failed: JWT_SECRET missing");
      res.status(500).json({ success: false, message: "JWT_SECRET is required" });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      logger.error("Login failed: database not connected", {
        state: mongoose.connection.readyState,
      });
      res
        .status(503)
        .json({ success: false, message: "Database not connected" });
      return;
    }
    const tokenExpirySeconds = 3600; 

    const result = await authenticateByClientId({
      clientId: clientId as string,
      jwtSecret,
      tokenExpirySeconds,
    });

    logger.info("User logged in", { userId: result.user.userId });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    const message = (err as Error).message;

    if (message.includes("Invalid clientId")) {
      logger.warn("Login rejected: invalid clientId format");
      res.status(400).json({ success: false, message: "Invalid clientId" });
      return;
    }

    if (message.includes("not found")) {
      logger.warn("Login rejected: clientId not found");
      res.status(404).json({
        success: false,
        message: "clientId not found or has no activity",
      });
      return;
    }

    logger.error("Login failed", { error: String(err), stack: (err as Error).stack });
    res.status(500).json({
      success: false,
      message: message || "Internal server error",
      error: message,
      stack: (err as Error).stack,
    });
  }
};
