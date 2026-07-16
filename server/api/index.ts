// Vercel serverless function wrapper for Express app.
// If required env vars are missing, return JSON instead of FUNCTION_INVOCATION_FAILED.
import type { Application } from "express";
import express from "express";

let app: Application;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  app = require("../src/index").default as Application;
} catch (err) {
  const message = err instanceof Error ? err.message : "Server failed to start";
  const fallback = express();

  fallback.get("/health", (_req, res) => {
    res.status(503).json({
      status: "misconfigured",
      error: message,
      hint: "Set MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY, and ENCRYPTION_IV on the server Vercel project, then redeploy.",
    });
  });

  fallback.use((_req, res) => {
    res.status(503).json({
      success: false,
      error: message,
      hint: "Server configuration is incomplete. Check Vercel environment variables for the server project.",
    });
  });

  app = fallback;
}

export default app;
