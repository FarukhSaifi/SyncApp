const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const { config } = require("./config");
const connectDB = require("./database/connection");
const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");
const credentialsRoutes = require("./routes/credentials");
const publishRoutes = require("./routes/publish");
const mdxRoutes = require("./routes/mdx");
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
        console.error("Failed to connect to database:", error);
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
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS middleware (configure allowed origins via CORS_ORIGIN, comma-separated)
const defaultDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173", // Vite default port
  "http://127.0.0.1:5173",
  "https://sync-app-client.vercel.app",
];

// Parse CORS_ORIGIN (can be comma-separated for multiple origins)
const corsOriginEnv = config.corsOrigin || "";
const allowedOrigins = corsOriginEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(defaultDevOrigins);

const corsOptions = {
  origin:
    config.nodeEnv === "development"
      ? true // Allow all origins in development
      : allowedOrigins.length
      ? allowedOrigins
      : defaultDevOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

  // Log health check details
  console.log("🏥 Health check requested:", {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    timestamp: healthInfo.timestamp,
    status: healthInfo.status,
    dbStatus: healthInfo.database.status,
    memory: healthInfo.memory?.used,
  });

  res.json(healthInfo);
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/credentials", credentialsRoutes);
app.use("/api/publish", publishRoutes);
app.use("/api/mdx", mdxRoutes);

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
