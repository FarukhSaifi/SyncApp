/**
 * Vercel serverless entry — never throw at module load (avoids FUNCTION_INVOCATION_FAILED).
 */
import type { Application, Request, Response } from "express";
import express from "express";

function createBootstrapErrorApp(error: unknown): Application {
  const app = express();
  const message =
    error instanceof Error ? error.message : "Server failed to start. Check Vercel environment variables and redeploy.";

  app.use((_req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      error: message,
      hint: "Open the sync-app-server project → Settings → Environment Variables. Ensure MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY, ENCRYPTION_IV, CORS_ORIGIN, and GEMINI_API_KEY are set for Production and Preview, then Redeploy. Or from server/: npm run env:sync",
    });
  });

  return app;
}

let app: Application;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  app = require("../src/index").default as Application;
} catch (error) {
  app = createBootstrapErrorApp(error);
}

export default app;
