const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./database/connection");
const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");
const credentialsRoutes = require("./routes/credentials");
const publishRoutes = require("./routes/publish");
const mdxRoutes = require("./routes/mdx");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { requestLogger, logger } = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 9000;

// Connect to MongoDB (with error handling for serverless)
connectDB().catch((error) => {
  console.error("Failed to connect to MongoDB:", error);
  // Don't exit the process in serverless environment
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// Security middleware
app.use(helmet());

// Note: Compression disabled (package not installed and not required)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS middleware (configure allowed origins via CORS_ORIGIN, comma-separated)
const defaultDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:9000",
  "http://127.0.0.1:9000",
  "https://sync-app-client.vercel.app", // Vercel deployment
  "https://sync-app-client-git-main-farukhsaifi.vercel.app", // Vercel preview deployments
];
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
console.log("🚀 ~ allowedOrigins:", allowedOrigins);

const corsOptions = {
  origin:
    process.env.NODE_ENV === "development"
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
app.get("/health", async (req, res) => {
  const dbReadyState = mongoose.connection.readyState;
  const dbStatus = dbReadyState === 1 ? "connected" : "disconnected";
  const dbHealthy = dbReadyState === 1 ? "healthy" : "unhealthy";

  // Try to ping the database if connected
  let dbPing = false;
  if (dbReadyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      dbPing = true;
    } catch (error) {
      console.error("Database ping failed:", error);
    }
  }

  const healthInfo = {
    status: dbHealthy === "healthy" ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)), // seconds (float, 2 decimals)
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      host: mongoose.connection.host || "unknown",
      name: mongoose.connection.name || "unknown",
      readyState: dbReadyState,
      ping: dbPing,
    },
    services: {
      mongodb: dbHealthy,
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
    dbReadyState: healthInfo.database.readyState,
    dbPing: healthInfo.database.ping,
  });

  // Return appropriate status code
  const statusCode = healthInfo.status === "OK" ? 200 : 503;
  res.status(statusCode).json(healthInfo);
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

app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    healthCheck: `http://localhost:${PORT}/health`,
  });
});
