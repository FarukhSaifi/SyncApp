import Constants from "expo-constants";

import { APP_CONFIG } from "@constants/config";

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
const raw = extra?.apiBaseUrl?.trim() || APP_CONFIG.DEFAULT_API_BASE;

export const API_BASE = raw.endsWith("/api") ? raw : `${raw.replace(/\/$/, "")}/api`;

export const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const);

export const HTTP_CONTENT_TYPES = Object.freeze({
  JSON: "application/json",
  OCTET_STREAM: "application/octet-stream",
} as const);

export const API_PATHS = Object.freeze({
  LINKEDIN_OAUTH_STATUS: "/linkedin/oauth/status",
} as const);
