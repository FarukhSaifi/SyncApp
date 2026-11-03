import fs from "fs";
import path from "path";

import { OPENAPI_UI } from "@constants";
import YAML from "yaml";

/**
 * Resolve openapi.yaml for both `tsx` (src) and compiled `dist` layouts on Vercel/local.
 */
function resolveSpecPath(): string {
  const candidates = [
    path.join(__dirname, OPENAPI_UI["SPEC_FILENAME"]),
    path.join(process.cwd(), "src", "openapi", OPENAPI_UI["SPEC_FILENAME"]),
    path.join(process.cwd(), "dist", "src", "openapi", OPENAPI_UI["SPEC_FILENAME"]),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(OPENAPI_UI["SPEC_NOT_FOUND"]);
}

/** Parsed OpenAPI 3 document (YAML). Keep in sync with Express routes + Zod schemas. */
export function loadOpenApiDocument(): Record<string, unknown> {
  const raw = fs.readFileSync(resolveSpecPath(), "utf8");
  return YAML.parse(raw) as Record<string, unknown>;
}
