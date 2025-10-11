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
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:9000",
  "http://127.0.0.1:9000",
];
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : defaultDevOrigins,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
