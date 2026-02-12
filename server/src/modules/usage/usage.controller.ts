import { Request, Response, NextFunction } from "express";
import { checkAndIncrementUsage, getUsageForUser } from "./usage.service";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_REGEX.test(value);

export const checkAndIncrementUsageHandler = async (
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

    const result = await checkAndIncrementUsage(clientId);

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    const message = (err as Error).message || "Usage check failed";
    if (message.includes("not found")) {
      res.status(404).json({ success: false, message });
      return;
    }
    next(err);
  }
};

export const getUsageHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const snapshot = await getUsageForUser(userId);

    res.status(200).json({ success: true, ...snapshot });
  } catch (err) {
    const message = (err as Error).message || "Unable to fetch usage";
    if (message.includes("not found")) {
      res.status(404).json({ success: false, message });
      return;
    }
    next(err);
  }
};
