import { config } from "@config";
import { DEFAULT_VALUES, OPENAPI_UI } from "@constants";
import express, { type Application } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./loadOpenApiDocument", () => ({
  loadOpenApiDocument: vi.fn(() => ({
    openapi: "3.0.3",
    info: { title: "SyncApp API test", version: "0.0.0" },
    paths: {},
  })),
}));

vi.mock("swagger-ui-express", () => ({
  default: {
    serve: [(_req: unknown, _res: unknown, next: () => void) => next()],
    setup: () => (_req: unknown, res: { send: (body: string) => void }) => {
      res.send("swagger-ui");
    },
  },
}));

import { isOpenApiDocsEnabled, mountOpenApiDocs } from "./mountDocs";

describe("mountOpenApiDocs", () => {
  const savedNodeEnv = config.nodeEnv;
  const savedVercelEnv = process.env["VERCEL_ENV"];

  beforeEach(() => {
    config.nodeEnv = DEFAULT_VALUES["NODE_ENV_DEVELOPMENT"];
    delete process.env["VERCEL_ENV"];
  });

  afterEach(() => {
    config.nodeEnv = savedNodeEnv;
    if (savedVercelEnv === undefined) {
      delete process.env["VERCEL_ENV"];
    } else {
      process.env["VERCEL_ENV"] = savedVercelEnv;
    }
    vi.restoreAllMocks();
  });

  it("reports docs disabled when NODE_ENV is production", () => {
    config.nodeEnv = DEFAULT_VALUES["NODE_ENV_PRODUCTION"];
    expect(isOpenApiDocsEnabled()).toBe(false);
  });

  it("reports docs disabled when VERCEL_ENV is production", () => {
    config.nodeEnv = DEFAULT_VALUES["NODE_ENV_DEVELOPMENT"];
    process.env["VERCEL_ENV"] = DEFAULT_VALUES["NODE_ENV_PRODUCTION"];
    expect(isOpenApiDocsEnabled()).toBe(false);
  });

  it("reports docs enabled in non-production local env", () => {
    expect(isOpenApiDocsEnabled()).toBe(true);
  });

  it("does not mount docs routes in production", async () => {
    config.nodeEnv = DEFAULT_VALUES["NODE_ENV_PRODUCTION"];
    const app: Application = express();
    mountOpenApiDocs(app);
    app.use((_req, res) => {
      res.status(404).json({ success: false, error: "not mounted" });
    });

    const spec = await request(app).get(OPENAPI_UI["SPEC_PATH"]);
    const docs = await request(app).get(OPENAPI_UI["DOCS_PATH"]);

    expect(spec.status).toBe(404);
    expect(docs.status).toBe(404);
  });

  it("mounts OpenAPI JSON outside production", async () => {
    const app: Application = express();
    mountOpenApiDocs(app);

    const spec = await request(app).get(OPENAPI_UI["SPEC_PATH"]);

    expect(spec.status).toBe(200);
    expect(spec.body).toMatchObject({ openapi: "3.0.3" });
  });
});
