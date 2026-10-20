/**
 * Google autocomplete suggestions — shared by trending topics and keyword research.
 */
import https from "node:https";

import { AI_CONFIG } from "@constants";

/**
 * Fetch live search queries from Google's autocomplete suggestion service.
 * Returns [] on network/parse failures (never throws).
 */
export function fetchGoogleSearchSuggestions(query: string): Promise<string[]> {
  return new Promise((resolve) => {
    const url = `${AI_CONFIG.GOOGLE_SUGGEST_BASE_URL}?client=${AI_CONFIG.GOOGLE_SUGGEST_CLIENT}&q=${encodeURIComponent(query)}`;
    const req = https.get(
      url,
      {
        headers: { "User-Agent": AI_CONFIG.GOOGLE_SUGGEST_USER_AGENT },
        timeout: AI_CONFIG.GOOGLE_SUGGEST_TIMEOUT_MS,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed[1]) ? parsed[1] : []);
          } catch {
            resolve([]);
          }
        });
      },
    );
    req.on("error", () => resolve([]));
    req.on("timeout", () => {
      req.destroy();
      resolve([]);
    });
  });
}
