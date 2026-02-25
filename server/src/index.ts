import cors from "cors";
import type { Application, NextFunction, Request, Response } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "path";

import { config } from "./config";
import { DATABASE, DEFAULT_VALUES, ERROR_MESSAGES, HEALTH, HTTP } from "./constants";
import connectDB from "./database/connection";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import apiRoutes from "./routes";
import { logger, requestLogger } from "./utils/logger";

const app: Application = express();
const PORT = config.port;

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

if (!isVercel) {
  connectDB();
} else {
  let dbConnected = false;
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!dbConnected && mongoose.connection.readyState !== DATABASE.MONGOOSE_STATE.CONNECTED) {
      try {
        await connectDB();
        dbConnected = true;
      } catch (error) {
        logger.error(HEALTH.LOG.DB_CONNECT_FAILED, error as Error);
      }
    }
    next();
  });
}

// Security middleware
app.use(helmet());

// Rate limiting (from config)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: ERROR_MESSAGES.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS middleware
const corsOriginEnv = config.corsOrigin || "";
const allowedOrigins = corsOriginEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(DEFAULT_VALUES.DEFAULT_DEV_ORIGINS);

const corsOptions = {
  origin:
    config.nodeEnv === "development"
      ? true
      : allowedOrigins.length
        ? allowedOrigins
        : [...DEFAULT_VALUES.DEFAULT_DEV_ORIGINS],
  credentials: true,
  methods: [...HTTP.METHODS] as string[],
  allowedHeaders: [...HTTP.CORS_HEADERS.ALLOWED] as string[],
  exposedHeaders: [...HTTP.CORS_HEADERS.EXPOSED] as string[],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: DEFAULT_VALUES.DEFAULT_BODY_LIMIT }));
app.use(
  express.urlencoded({
    extended: true,
    limit: DEFAULT_VALUES.DEFAULT_BODY_LIMIT,
  }),
);

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED;
  const healthInfo = {
    status: HEALTH.STATUS.OK,
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)),
    environment: config.nodeEnv,
    database: {
      status: dbConnected ? HEALTH.DB.CONNECTED : HEALTH.DB.DISCONNECTED,
      host: mongoose.connection.host || HEALTH.STATUS.UNKNOWN,
      name: mongoose.connection.name || HEALTH.STATUS.UNKNOWN,
    },
    services: {
      mongodb: dbConnected ? HEALTH.SERVICE.HEALTHY : HEALTH.SERVICE.UNHEALTHY,
      server: HEALTH.SERVICE.HEALTHY,
    },
  };

  logger.debug("Health check requested", {
    ip: req.ip || (req.socket as { remoteAddress?: string })?.remoteAddress,
    timestamp: healthInfo.timestamp,
    status: healthInfo.status,
    dbStatus: healthInfo.database.status,
  });

  res.json(healthInfo);
});

// API routes (all under /api - route paths defined in constants/routes.ts)
app.use("/api", apiRoutes);

// Serve uploaded cover images (e.g. /api/uploads/covers/xxx.png)
app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

// 404 handler (must be after routes)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export app for Vercel serverless functions, or start server for local/other platforms
if (isVercel) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    logger.info(HEALTH.LOG.SERVER_STARTED, {
      port: PORT,
      environment: config.nodeEnv,
      corsOrigin: config.corsOrigin,
      healthCheck: HEALTH.HEALTH_URL_LOCAL(PORT),
    });
  });
}

export default app;
