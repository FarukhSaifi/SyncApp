import { existsSync } from "fs";
import path from "path";

import dotenv from "dotenv";

/**
 * Load `.env.dev` or `.env.prod` based on APP_ENV (or NODE_ENV).
 * Set APP_ENV=dev|prod in npm scripts; falls back to .env if the file is missing.
 */
export function loadAppEnv(): "dev" | "prod" {
  const appEnv: "dev" | "prod" =
    process.env.APP_ENV === "prod" || process.env.APP_ENV === "dev"
      ? process.env.APP_ENV
      : process.env.NODE_ENV === "production"
        ? "prod"
        : "dev";

  // On Vercel, env vars come from the dashboard — never load local .env files (override could wipe them).
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return appEnv;
  }

  const envPath = path.resolve(process.cwd(), `.env.${appEnv}`);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[env] Loaded ${envPath}`);
    }
  } else {
    const fallback = path.resolve(process.cwd(), ".env");
    if (existsSync(fallback)) {
      dotenv.config({ path: fallback });
    }
  }

  return appEnv;
}
