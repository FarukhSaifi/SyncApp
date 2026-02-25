# TypeScript Migration, Cleanup & Architecture Roadmap

This document outlines the phased plan to **clean up**, **refactor**, **optimize**, and **migrate** SyncApp (client + server) to TypeScript, following [code-cleanup-architect](.cursor/agents/code-cleanup-architect.md), [CONSTANTS_COMPLETE.md](../CONSTANTS_COMPLETE.md), and [OPTIMIZATION.md](../OPTIMIZATION.md).

---

## Principles

1. **Clean first** – Remove dead code, unused imports, and orphan files before refactors.
2. **Incremental migration** – Use `allowJs: true`; convert module-by-module; keep `npm run typecheck` and `npm run build` green.
3. **Constants & types** – No new magic strings; shared types for API contracts and domain models.
4. **Single responsibility** – One clear purpose per module; services vs controllers vs routes.

---

## Phase 1: Foundation (Current)

**Goals:** Roadmap in place; types as first-class `.ts` modules; one slice of server and client converted; cleanup sample.

- [x] Create this roadmap.
- [x] **Server:** `tsconfig.json` – set `noEmit: true` for type-check-only; keep running `node src/index.js`.
- [ ] **Server:** Convert 2–3 modules to `.ts` (e.g. `constants/httpStatus.ts`, `constants/http.ts`, `utils/auth.ts` or one service) – deferred to Phase 2.
- [x] **Client:** Convert `src/utils/apiClient.js` → `apiClient.ts` using `src/types/index.d.ts`; add `RequestOptions` and typed API methods.
- [ ] **Client:** Optionally convert one small component to `.tsx` (e.g. `LoadingScreen.tsx`) – deferred.
- [x] **Cleanup:** Fix missing `devError` import in Editor.jsx; add `declare module` for `qs` and `file-saver` in `vite-env.d.ts`.

**Exit criteria:** `npm run typecheck` passes on both client and server; no new lint errors; one API path and one client flow fully typed.

---

## Phase 2: Server – Constants & Config

- [ ] Convert all `server/src/constants/*.js` → `.ts` (use `as const` / `Object.freeze` where appropriate).
- [ ] Convert `server/src/config/index.js` → `config/index.ts`.
- [ ] Ensure no circular dependencies; central export from `constants/index.ts`.

---

## Phase 3: Server – Middleware, Utils, Database

- [ ] Convert `middleware/*.js`, `utils/*.js`, `database/*.js` to `.ts`.
- [ ] Type `asyncHandler`, `errorHandler`, and Joi schemas (use `Joi.ObjectSchema<T>`).
- [ ] Type cache keys and auth helpers.

---

## Phase 4: Server – Models, Services, Controllers, Routes

- [ ] Convert Mongoose models to `.ts` (use `interface` from `types`; schema types).
- [ ] Convert services to `.ts` (input/output types from `types`).
- [ ] Convert controllers and routes to `.ts` (typed `Request`/`Response` where useful).
- [ ] Keep `main` as `src/index.js` until full migration, or switch to `dist/index.js` and build step.

---

## Phase 5: Client – Utils, Hooks, Constants

- [ ] Convert `utils/*.js` to `.ts` (logger, contentUtils, seoScorecard).
- [ ] Convert `hooks/*.js` to `.ts` (usePosts, useToast, useDebounce).
- [ ] Convert `constants/*.js` to `.ts` (or keep `.js` with JSDoc types; prefer `.ts` for single source of truth).

---

## Phase 6: Client – Components & Pages

- [ ] Convert `config/routes.jsx` → `routes.tsx`.
- [ ] Convert contexts to `.tsx` / `.ts`.
- [ ] Convert UI components (`components/ui/*`, `components/common/*`) to `.tsx`.
- [ ] Convert feature components and pages to `.tsx`.
- [ ] Convert `App.jsx` and `main.jsx` to `.tsx`.

---

## Phase 7: Cleanup & Optimization Pass

- [ ] **Cleanup:** Remove any remaining dead code, unused imports, and obsolete files (per code-cleanup-architect).
- [ ] **Optimization:** Review OPTIMIZATION.md; ensure caching, validation, and error handling are consistent.
- [ ] **Constants:** Audit for any new magic strings; move to constants (CONSTANTS_COMPLETE.md).
- [ ] Enable `checkJs: true` on both tsconfigs for stricter checking of any remaining `.js`/`.jsx`.

---

## Phase 8: Build & Runtime (Optional)

- [ ] **Server:** If desired, switch to `ts-node` or `tsc --outDir dist` and `main: "dist/index.js"` for production.
- [ ] **Client:** Already builds with Vite; ensure all entry points are `.tsx`/`.ts`.
- [ ] CI: Run `npm run typecheck` and `npm run build` (both packages) on every PR.

---

## File Naming

| Current | Target | Notes |
| --- | --- | --- |
| `*.js` | `*.ts` | Logic, config, constants |
| `*.jsx` | `*.tsx` | React components |
| `*.d.ts` | Keep or merge into `types/index.ts` | Global augmentations (Express) stay in `.d.ts` or a single `global.d.ts`. |

---

## Type Conventions

- **API responses:** Use `ApiResponse<T>` (client) and align server response shapes.
- **Models:** `IPost`, `IUser`, `ICredential` (server); `Post`, `User`, `Credential` (client).
- **Request:** Use `Express.Request` with `userId` (server); extend in `types` if needed.
- **No `any`:** Use `unknown` and type guards where type is not known.

---

## References

- [.cursor/agents/code-cleanup-architect.md](../.cursor/agents/code-cleanup-architect.md) – Cleanup and constants.
- [CONSTANTS_COMPLETE.md](../CONSTANTS_COMPLETE.md) – Constants layout.
- [OPTIMIZATION.md](../OPTIMIZATION.md) – Performance and patterns.
- [ARCHITECTURE.md](./ARCHITECTURE.md) – Structure and TypeScript migration path.
