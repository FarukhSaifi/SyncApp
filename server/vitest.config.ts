import path from "path";

import { defineConfig } from "vitest/config";

const hookTimeoutMs = 120_000;

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: [path.resolve(__dirname, "vitest.setup.ts")],
    include: ["src/**/*.test.ts", "src/**/*.api.test.ts"],
    testTimeout: 60_000,
    hookTimeout: hookTimeoutMs,
    teardownTimeout: hookTimeoutMs,
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary"],
      reportsDirectory: "./coverage",
      clean: true,
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.api.test.ts",
        "src/__tests__/**",
        "src/types/**",
        "src/openapi/**",
        "src/database/setup.ts",
      ],
    },
  },

  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
      "@ai": path.resolve(__dirname, "src/ai"),
      "@config": path.resolve(__dirname, "src/config"),
      "@constants": path.resolve(__dirname, "src/constants"),
      "@controllers": path.resolve(__dirname, "src/controllers"),
      "@database": path.resolve(__dirname, "src/database"),
      "@middleware": path.resolve(__dirname, "src/middleware"),
      "@models": path.resolve(__dirname, "src/models"),
      "@routes": path.resolve(__dirname, "src/routes"),
      "@schemas": path.resolve(__dirname, "src/schemas"),
      "@services": path.resolve(__dirname, "src/services"),
      "@types": path.resolve(__dirname, "src/types"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@validations": path.resolve(__dirname, "src/validations"),
    },
  },
});
