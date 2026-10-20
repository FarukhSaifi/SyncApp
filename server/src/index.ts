import path from "path";

import { getAiCapabilities } from "@ai/client";
import { config } from "@config";
import { AI_PROVIDERS, DEFAULT_VALUES, ERROR_MESSAGES, HEALTH, HTTP, HTTP_STATUS } from "@constants";
import connectDB, { getDbConnectionMeta, isDbConnected } from "@database/connection";
import { ensureDb } from "@middleware/ensureDb";
import { errorHandler, notFoundHandler } from "@middleware/errorHandler";
import apiRoutes from "@routes";
import { logger, requestLogger } from "@utils/logger";
import compression from "compression";
import cors from "cors";
import dayjs from "dayjs";
import type { Application, Request, Response } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app: Application = express();
const PORT = config.port;

// Security & Performance middleware
app.use(helmet());
app.use(compression());

// Rate limiting (from config)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: ERROR_MESSAGES["TOO_MANY_REQUESTS"],
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS middleware — production uses CORS_ORIGIN only; never merge localhost/preview defaults.
const corsOriginEnv = config.corsOrigin || "";
const envOrigins = corsOriginEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const isDevelopment = config.nodeEnv === DEFAULT_VALUES["NODE_ENV_DEVELOPMENT"];
const allowedOrigins = isDevelopment
  ? [...new Set([...envOrigins, ...DEFAULT_VALUES["DEFAULT_DEV_ORIGINS"]])]
  : envOrigins;

const corsOptions = {
  origin: isDevelopment ? true : allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
  methods: [...HTTP["METHODS"]] as string[],
  allowedHeaders: [...HTTP["CORS_HEADERS"]["ALLOWED"]] as string[],
  exposedHeaders: [...HTTP["CORS_HEADERS"]["EXPOSED"]] as string[],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: DEFAULT_VALUES["DEFAULT_BODY_LIMIT"] }));
app.use(
  express.urlencoded({
    extended: true,
    limit: DEFAULT_VALUES["DEFAULT_BODY_LIMIT"],
  }),
);

// Request logging middleware
app.use(requestLogger);

// Root + browser probes — avoid ERROR spam on Vercel dashboard / crawlers
app.get("/", (_req: Request, res: Response) => {
  res.status(HTTP_STATUS["OK"]).json({
    success: true,
    service: "sync-app-server",
    health: "/health",
    api: "/api",
  });
});

app.get(["/favicon.ico", "/favicon.png"], (_req: Request, res: Response) => {
  res.status(HTTP_STATUS["NO_CONTENT"]).end();
});

// Health check endpoint — awaits DB connect (important on Vercel cold starts)
app.get("/health", async (req: Request, res: Response) => {
  let connectionError: string | undefined;
  try {
    await connectDB();
  } catch (error) {
    connectionError = (error as Error).message;
    logger.error(HEALTH["LOG"]["DB_CONNECT_FAILED"], error as Error);
  }

  const dbConnected = isDbConnected();
  const { host, name } = getDbConnectionMeta();
  const aiCaps = getAiCapabilities();
  const aiConfigured = aiCaps.provider !== AI_PROVIDERS["NONE"];
  const healthInfo = {
    status: HEALTH["STATUS"]["OK"],
    timestamp: dayjs().toISOString(),
    uptime: Number(process.uptime().toFixed(2)),
    environment: config.nodeEnv,
    database: {
      status: dbConnected ? HEALTH["DB"]["CONNECTED"] : HEALTH["DB"]["DISCONNECTED"],
      host: host || HEALTH["STATUS"]["UNKNOWN"],
      name: name || HEALTH["STATUS"]["UNKNOWN"],
      mongoUriConfigured: Boolean(config.mongoUri?.trim()),
      ...(connectionError && !dbConnected ? { error: connectionError } : {}),
    },
    ai: {
      configured: aiConfigured,
      provider: aiCaps.provider,
      model: config.googleAiModel,
      ...(aiCaps.project ? { project: aiCaps.project } : {}),
      ...(aiCaps.location ? { location: aiCaps.location } : {}),
    },
    services: {
      mongodb: dbConnected ? HEALTH["SERVICE"]["HEALTHY"] : HEALTH["SERVICE"]["UNHEALTHY"],
      server: HEALTH["SERVICE"]["HEALTHY"],
      ai: aiConfigured ? HEALTH["SERVICE"]["HEALTHY"] : HEALTH["SERVICE"]["UNHEALTHY"],
    },
  };

  logger.debug("Health check requested", {
    ip: req.ip || (req.socket as { remoteAddress?: string })?.remoteAddress,
    timestamp: healthInfo.timestamp,
    status: healthInfo.status,
    dbStatus: healthInfo.database.status,
  });

  res.status(dbConnected ? HTTP_STATUS["OK"] : HTTP_STATUS["SERVICE_UNAVAILABLE"]).json(healthInfo);
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
    logger.info(HEALTH["LOG"]["SERVER_STARTED"], {
      port: PORT,
      environment: config.nodeEnv,
      corsOrigin: config.corsOrigin,
      healthCheck: HEALTH["HEALTH_URL_LOCAL"](PORT),
    });
    const caps = getAiCapabilities();
    if (caps.provider === AI_PROVIDERS["NONE"]) {
      logger.warn(ERROR_MESSAGES["AI_STARTUP_NO_PROVIDER"]);
    } else if (caps.provider === AI_PROVIDERS["VERTEX"]) {
      logger.info(
        `${ERROR_MESSAGES["AI_STARTUP_VERTEX_PREFIX"]}${caps.project || ""}${ERROR_MESSAGES["AI_STARTUP_VERTEX_MID"]}${caps.location || ""}${ERROR_MESSAGES["AI_STARTUP_VERTEX_SUFFIX"]}`,
      );
    } else {
      const key = config.geminiApiKey;
      const hint =
        key.length > DEFAULT_VALUES.API_KEY_LOG_MASK_MIN_LEN
          ? `${key.slice(0, DEFAULT_VALUES.API_KEY_LOG_MASK_PREFIX_LEN)}…${key.slice(-DEFAULT_VALUES.API_KEY_LOG_MASK_SUFFIX_LEN)}`
          : ERROR_MESSAGES["AI_STARTUP_KEY_SET_HINT"];
      logger.info(`${ERROR_MESSAGES["AI_STARTUP_STUDIO_PREFIX"]}${hint}${ERROR_MESSAGES["AI_STARTUP_STUDIO_SUFFIX"]}`);
    }
  });
}

export default app;
