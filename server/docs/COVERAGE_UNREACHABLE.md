# Server coverage — intentionally unreachable / excluded

Vitest (`vitest.config.ts`) instruments `src/**/*.ts` except:

| Path | Reason |
| --- | --- |
| `src/openapi/**` | Static OpenAPI YAML + Swagger UI mount helpers; exercised manually / via build copy, not unit-tested. |
| `src/database/setup.ts` | CLI entry (`npm run db:setup`) and `require.main === module` bootstrap (see `v8 ignore` in file). Default export is covered by `setup.test.ts`. |
| `src/**/*.test.ts`, `src/**/*.api.test.ts`, `src/__tests__/**`, `src/types/**` | Test and type-only files. |

## In-source `v8 ignore` blocks

| File | Lines | Reason |
| --- | --- | --- |
| `src/index.ts` | `app.listen(...)` when `VERCEL` / `VERCEL_ENV` are unset | Local dev server bootstrap only. Vitest sets `VERCEL=1` in `vitest.setup.ts`, so the listen path never runs in CI. |
| `src/database/setup.ts` | `if (require.main === module) setupDatabase()` | Direct CLI execution only; tests import `setupDatabase` default export. |

No other production paths are marked unreachable; remaining gaps should be closed with unit/API tests or additional `v8 ignore` only when truly environment-specific.
