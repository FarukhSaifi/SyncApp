import fs from "fs";
import path from "path";

/**
 * Env for Vitest — must run before `@config` is first imported.
 * VERCEL=1 skips `app.listen` in `src/index.ts`.
 */
const coverageTmpDirs = [path.resolve(__dirname, "coverage/.tmp"), path.resolve(__dirname, "coverage-worker-c/.tmp")];
for (const dir of coverageTmpDirs) {
  fs.mkdirSync(dir, { recursive: true });
}

process.env.VERCEL = "1";
process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT || "9000";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/syncapp-vitest-placeholder";
process.env.JWT_SECRET = process.env.JWT_SECRET || "vitest-jwt-secret-key-32chars-min!!";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "vitest-gemini-key";
process.env.RATE_LIMIT_WINDOW_MS = "60000";
process.env.RATE_LIMIT_MAX_REQUESTS = "10000";
process.env.CRON_SECRET = process.env.CRON_SECRET || "vitest-cron-secret";
