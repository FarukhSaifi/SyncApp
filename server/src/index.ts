import cors from "cors";
import dayjs from "dayjs";
import type { Application, Request, Response } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";

import { config } from "./config";
import { DEFAULT_VALUES, ERROR_MESSAGES, HEALTH, HTTP } from "./constants";
import connectDB, { getDbConnectionMeta, isDbConnected } from "./database/connection";
import { ensureDb } from "./middleware/ensureDb";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import apiRoutes from "./routes";
import { logger, requestLogger } from "./utils/logger";

const app: Application = express();
const PORT = config.port;

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

// Health check endpoint — awaits DB connect (important on Vercel cold starts)
app.get("/health", async (req: Request, res: Response) => {
  let connectionError: string | undefined;
  try {
    await connectDB();
  } catch (error) {
    connectionError = (error as Error).message;
    logger.error(HEALTH.LOG.DB_CONNECT_FAILED, error as Error);
  }

  const dbConnected = isDbConnected();
  const { host, name } = getDbConnectionMeta();
  const healthInfo = {
    status: HEALTH.STATUS.OK,
    timestamp: dayjs().toISOString(),
    uptime: Number(process.uptime().toFixed(2)),
    environment: config.nodeEnv,
    database: {
      status: dbConnected ? HEALTH.DB.CONNECTED : HEALTH.DB.DISCONNECTED,
      host: host || HEALTH.STATUS.UNKNOWN,
      name: name || HEALTH.STATUS.UNKNOWN,
      mongoUriConfigured: Boolean(config.mongoUri?.trim()),
      ...(connectionError && !dbConnected ? { error: connectionError } : {}),
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

  res.status(dbConnected ? 200 : 503).json(healthInfo);
});

// Static file uploads fallback route
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API routes — ensure MongoDB is connected before handling requests
app.use("/api", ensureDb, apiRoutes);

// 404 handler (must be after routes)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export app for Vercel (serverless). The server is only started in non-serverless envs.
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
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
