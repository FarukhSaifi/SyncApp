import { config } from "@config";
import { DEFAULT_VALUES, OPENAPI_UI } from "@constants";
import { logger } from "@utils/logger";
import type { Application, NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import { loadOpenApiDocument } from "./loadOpenApiDocument";

/**
 * Helmet CSP blocks Swagger UI inline assets; strip CSP only on docs routes.
 */
function relaxDocsSecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("Content-Security-Policy");
  next();
}

/** Docs are local/dev only — never expose Swagger UI or the OpenAPI JSON in production. */
export function isOpenApiDocsEnabled(): boolean {
  if (config.nodeEnv === DEFAULT_VALUES["NODE_ENV_PRODUCTION"]) {
    return false;
  }
  if (process.env["VERCEL_ENV"] === DEFAULT_VALUES["NODE_ENV_PRODUCTION"]) {
    return false;
  }
  return true;
}

/**
 * Mount OpenAPI JSON + Swagger UI under /api without MongoDB (`ensureDb`).
 * Call before `app.use("/api", ensureDb, apiRoutes)`.
 * No-op in production (`NODE_ENV` or `VERCEL_ENV`).
 */
export function mountOpenApiDocs(app: Application): void {
  if (!isOpenApiDocsEnabled()) {
    logger.info(OPENAPI_UI["DISABLED_IN_PRODUCTION_LOG"], {
      nodeEnv: config.nodeEnv,
      vercelEnv: process.env["VERCEL_ENV"] || "",
    });
    return;
  }

  const document = loadOpenApiDocument();

  app.get(OPENAPI_UI["SPEC_PATH"], (_req: Request, res: Response) => {
    res.json(document);
  });

  app.use(
    OPENAPI_UI["DOCS_PATH"],
    relaxDocsSecurityHeaders,
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: OPENAPI_UI["TITLE"],
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
}
