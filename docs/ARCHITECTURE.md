# SyncApp – Architecture & Coding Standards

## Overview

- **Client**: Next.js 16 (App Router), route-based code splitting, centralized constants and API client.
- **Server**: Express, MongoDB, layered structure (routes → controllers → services → models).

## Client Structure

```
client/src/
├── config/          # Route definitions (ProtectedRoutes, PublicRoutes)
├── constants/       # Single source for labels, config, storage keys, editor config
├── components/      # Reusable UI; common/ for LoadingScreen etc.
├── contexts/        # Auth, Theme
├── hooks/           # usePosts, useToast
├── pages/           # Route-level components
└── utils/           # apiClient, contentUtils, logger (dev-only logs)
```

### Standards

- **Constants**: Use `constants/` for all magic strings and config (e.g. `STORAGE_KEYS.AUTH_TOKEN`, `INITIAL_EDITOR_FORM`, `QUILL_MODULES`). No hardcoded "token" or repeated config in components.
- **Logging**: Use `utils/logger.js` (`devLog`, `devWarn`, `devError`) for debug logs so production builds stay quiet.
- **Routes**: Route definitions live in `config/routes.jsx`; App composes `ProtectedRoutes` and `PublicRoutes` and passes props (e.g. posts callbacks, editor callbacks).
- **Loading**: Shared `LoadingScreen` for auth check and Suspense fallbacks.
- **Import sequence** (use this order in every file; groups separated by a blank line):
  1. **React** – `react`, `react-dom` (when needed)
  2. **React-related libraries** – `react-router-dom`, `react-icons`, `react-markdown`, `react-quilljs`, etc.
  3. **Common components** – `components/common/*` (e.g. `LoadingScreen`)
  4. **Context** – `contexts/*` (e.g. `AuthContext`, `ThemeContext`)
  5. **Pages** – `pages/*` (only when importing page components)
  6. **App / layout / routes** – `Layout`, `ErrorBoundary`, `ProtectedRoute`, `config/routes`, UI components
  7. **Hooks** – `hooks/*` (e.g. `usePosts`, `useToast`)
  8. **Utils** – `utils/*` (e.g. `apiClient`, `logger`)
  9. **Constants** – `constants` or `constants/*`
  10. **Types** – `types` or type-only imports
- **Refactor (dependency) order** when touching the codebase:
  1. **Constants** (whole app) – no internal app deps
  2. **Utils** (apiClient, logger, contentUtils, etc.) – may use constants and types
  3. **Hooks** – use utils and constants
  4. **Context** – use hooks, utils, constants
  5. **Common components** – use constants
  6. **Pages** – use components, context, hooks, constants
  7. **App / layout / routes** – use pages, context, common components
  8. **Entry** (main.tsx) – React, React-DOM, App, global CSS

## Server Structure

```
server/src/
├── config/          # Env and app config
├── constants/       # HTTP, validation, messages, AI, etc.
├── controllers/     # Request/response; delegate to services
├── database/        # Connection, setup
├── middleware/      # Error handler, validator, auth
├── models/          # Mongoose schemas
├── routes/          # index.js mounts all API routes under /api
├── services/        # Business logic
└── utils/           # Auth, cache, encryption, logger
```

### Standards

- **Routes**: All API routes are registered in `routes/index.js`; `app.use("/api", apiRoutes)` in `index.js`.
- **Responses**: Controllers use a consistent shape: `{ success: true, data?, message? }` or `{ success: false, error }`.
- **Errors**: Use `asyncHandler` and central `errorHandler` middleware; throw `AppError` with status where appropriate.

## TypeScript

Both client and server have TypeScript support for gradual migration and type safety.

### Client (Vite + React)

- **Config**: `client/tsconfig.json` (strict mode, allowJs for existing .js/.jsx).
- **Types**: `client/src/types/index.d.ts` – `Post`, `User`, `UserRef`, `ApiResponse`, `PaginatedResponse`, `Credential`.
- **Env**: `client/src/vite-env.d.ts` – `ImportMetaEnv` for `VITE_*` variables.
- **Scripts**: `npm run typecheck` – runs `tsc --noEmit`. New files can be `.ts`/`.tsx`; existing JS is type-checked when `checkJs` is enabled later.

### Server (Node + Express)

- **Config**: `server/tsconfig.json` (allowJs, noEmit for type-check only; runtime remains Node on .js).
- **Types**: `server/src/types/index.d.ts` – `IPost`, `IUser`, `ICredential`, `JwtPayload`, `Express.Request.userId`.
- **Scripts**: `npm run typecheck` – type-checks without emitting. Add `.ts` files when migrating; keep `main` pointing at `src/index.js` until full migration.

### Migration path

1. Use shared types in new code (e.g. `/** @type {import('../types').Post} */` in JS, or convert one module to .ts/.tsx).
2. Enable `checkJs: true` in tsconfig when ready to type-check existing JS.
3. Rename modules to .ts/.tsx incrementally; ensure `allowJs: true` so mixed codebases work.

**Current status:** See [TS_MIGRATION_AND_CLEANUP_ROADMAP.md](./TS_MIGRATION_AND_CLEANUP_ROADMAP.md). Phase 1 in progress: client `apiClient` migrated to `apiClient.ts` with typed methods; server `tsconfig` set to `noEmit: true`.

## Cleanup & refactor (code-cleanup-architect)

- **Clean first**: Remove dead code, unused imports, and orphan files before refactors. Run `npm run typecheck` and `npm run build` after cleanup.
- **Design patterns**: Separation of concerns (UI → services → data), single responsibility, DRY, consistent error handling and naming. See `.cursor/agents/code-cleanup-architect.md`.
- **Constants**: All static values live in `constants/` (see CONSTANTS_COMPLETE.md). No magic strings or numbers in business logic.
- **Optimizations**: Caching, validation, error handling, and logging are documented in OPTIMIZATION.md.

## Conventions

- **Naming**: PascalCase for components; camelCase for functions/variables; UPPER_SNAKE for constants.
- **Files**: One main export per file; co-locate related helpers (e.g. contentUtils for markdown/HTML).
- **Dependencies**: Prefer existing constants and utils; avoid duplicate logic across pages.
