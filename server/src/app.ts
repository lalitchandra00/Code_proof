import express from "express";
import cors from "cors";
import { reportRouter } from "./routes/report.routes";
import { projectRouter } from "./routes/project.routes";
import { authRouter } from "./routes/auth.routes";
import { requestSafety } from "./middlewares/requestSafety";
import { EnvConfig } from "./config/env";
import { FeatureFlags } from "./config/featureFlags";
import { errorHandler } from "./middlewares/errorHandler";

/**
 * Express app configuration.
 * Exposes:
 * - Public: POST /api/reports, GET /api/reports/:reportId
 * - Auth: POST /api/auth/login
 * - Dashboard (auth-required): GET /api/projects*
 */
export const createApp = (params: { env: EnvConfig; featureFlags: FeatureFlags }) => {
  const { env, featureFlags } = params;
  const app = express();

  // Enable CORS for frontend
  app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000","*"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  app.use(requestSafety(env.requestTimeoutMs));
  app.use(express.json({ limit: env.requestBodyLimit }));

  app.use(authRouter);
  app.use(reportRouter({ env, featureFlags }));
  app.use(projectRouter({ jwtSecret: env.jwtSecret }));

  app.use(errorHandler);

  return app;
};
