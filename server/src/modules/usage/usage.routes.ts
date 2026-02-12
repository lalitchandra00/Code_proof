import { Router } from "express";
import {
  checkAndIncrementUsageHandler,
  getUsageHandler,
} from "./usage.controller";
import { authenticateRequest } from "../../middlewares/authenticate.middleware";

export const usageRouter = (params: { jwtSecret: string }) => {
  const router = Router();
  const { jwtSecret } = params;

  router.post("/api/usage/check-and-increment", checkAndIncrementUsageHandler);
  router.get("/api/usage", authenticateRequest(jwtSecret), getUsageHandler);

  return router;
};
