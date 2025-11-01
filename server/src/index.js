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

// Connect to MongoDB
connectDB();

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
app.get("/health", (req, res) => {
  const healthInfo = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)), // seconds (float, 2 decimals)
    environment: process.env.NODE_ENV || "development",
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

app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    healthCheck: `http://localhost:${PORT}/health`,
  });
});
