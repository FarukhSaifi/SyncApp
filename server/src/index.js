const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const { config } = require("./config");
const { DEFAULT_VALUES, ERROR_MESSAGES, HTTP } = require("./constants");
const connectDB = require("./database/connection");
const apiRoutes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { requestLogger, logger } = require("./utils/logger");

const app = express();
const PORT = config.port;

// Connect to MongoDB
// In serverless (Vercel), connection is handled per request to avoid cold start issues
// In traditional server, connect once at startup
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

if (!isVercel) {
  // Connect immediately for traditional server deployment
  connectDB();
} else {
  // For Vercel serverless, connect on first request (with caching)
  let dbConnected = false;
  app.use(async (req, res, next) => {
    if (!dbConnected && mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
        dbConnected = true;
      } catch (error) {
        logger.error("Failed to connect to database", error);
        // Continue anyway - some routes might not need DB
      }
    }
    next();
  });
}

// Security middleware
app.use(helmet());

// Note: Compression disabled (package not installed and not required)

// Rate limiting (from config)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: ERROR_MESSAGES.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS middleware (configure allowed origins via CORS_ORIGIN, comma-separated)
// Parse CORS_ORIGIN (can be comma-separated for multiple origins)
const corsOriginEnv = config.corsOrigin || "";
const allowedOrigins = corsOriginEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(DEFAULT_VALUES.DEFAULT_DEV_ORIGINS);

const corsOptions = {
  origin:
    config.nodeEnv === "development"
      ? true // Allow all origins in development
      : allowedOrigins.length
      ? allowedOrigins
      : DEFAULT_VALUES.DEFAULT_DEV_ORIGINS,
  credentials: true,
  methods: HTTP.METHODS,
  allowedHeaders: HTTP.CORS_HEADERS.ALLOWED,
  exposedHeaders: HTTP.CORS_HEADERS.EXPOSED,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: DEFAULT_VALUES.DEFAULT_BODY_LIMIT }));
app.use(
  express.urlencoded({
    extended: true,
    limit: DEFAULT_VALUES.DEFAULT_BODY_LIMIT,
  })
);

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
  const healthInfo = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)), // seconds (float, 2 decimals)
    environment: config.nodeEnv,
    database: {
      status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      host: mongoose.connection.host || "unknown",
      name: mongoose.connection.name || "unknown",
    },
    services: {
      mongodb: mongoose.connection.readyState === 1 ? "healthy" : "unhealthy",
      server: "healthy",
    },
  };

  logger.debug("Health check requested", {
    ip: req.ip || req.connection?.remoteAddress,
    timestamp: healthInfo.timestamp,
    status: healthInfo.status,
    dbStatus: healthInfo.database.status,
  });

  res.json(healthInfo);
});

// API routes (all under /api)
app.use("/api", apiRoutes);

// 404 handler (must be after routes)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export app for Vercel serverless functions, or start server for local/other platforms
// Vercel sets VERCEL environment variable, or we check if running as serverless
if (isVercel) {
  // Export for Vercel serverless function
  module.exports = app;
} else {
  // Start server for local development or other platforms (Railway, Render, etc.)
  app.listen(PORT, () => {
    logger.info(`Server started successfully`, {
      port: PORT,
      environment: config.nodeEnv,
      corsOrigin: config.corsOrigin,
      healthCheck: `http://localhost:${PORT}/health`,
    });
  });
}
