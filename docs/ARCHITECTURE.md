# SyncApp – Architecture & Coding Standards

## Overview

- **Client**: React (Vite), route-based code splitting, centralized constants and API client.
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

## Conventions

- **Naming**: PascalCase for components; camelCase for functions/variables; UPPER_SNAKE for constants.
- **Files**: One main export per file; co-locate related helpers (e.g. contentUtils for markdown/HTML).
- **Dependencies**: Prefer existing constants and utils; avoid duplicate logic across pages.
