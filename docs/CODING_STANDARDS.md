# SyncApp Coding Standards

Practical baseline for this monorepo. For agent workflow, validation commands, and high-risk areas, see [AGENTS.md](../AGENTS.md). For ownership and layered architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Repository layout

| Package | Role |
|---------|------|
| `client/` | Next.js App Router (Vercel root: `client`) |
| `server/` | Express + TypeScript API (Vercel root: `server`) |
| `mobile/` | Expo Router (iOS / Android / web) |
| `docs/` | Architecture, env, flows, features |

Do not add new top-level apps without an explicit product decision. Prefer extending the package that already owns the concern.

### Server (`server/src/`)

`routes/` → `middleware/` → `controllers/` → `services/` → `models/`, with Zod schemas in `schemas/`, shared constants in `constants/`, config in `config/`, AI helpers in `ai/`.

### Client (`client/`)

- `app/` — App Router pages and layouts
- `src/views/` — route-level screens
- `src/components/` — reusable UI (`common/`, `dashboard/`, `users/`, …)
- `src/constants/`, `contexts/`, `hooks/`, `utils/`, `types/`

### Mobile (`mobile/`)

Follow [mobile/AGENTS.md](../mobile/AGENTS.md). Keep editor persistence/publishing behind `useEditorState`.

## Naming

- **Files / folders**: `camelCase` for utilities/hooks (`usePosts.ts`, `apiClient.ts`); `PascalCase` for React components and Mongoose models (`Button.tsx`, `User.ts`); route modules match resource names (`posts.ts`, `auth.ts`).
- **Symbols**: `PascalCase` types/components; `camelCase` functions/variables; `SCREAMING_SNAKE` for true constants and message maps.
- **API paths**: resource nouns under `/api` (e.g. `/api/posts`, `/api/ai/...`). Prefer existing route constants in `server/src/constants/routes.ts` / client `ROUTES`.
- **Env keys**: `SCREAMING_SNAKE` (e.g. `GEMINI_API_KEY`, `MONGODB_URI`). Document every new key in the matching `*.example` file and [VERCEL_ENV.md](./VERCEL_ENV.md) when it ships to Vercel.

## TypeScript

- Keep strict typing; do not weaken `tsconfig` for convenience.
- Prefer shared types in each package’s `types/` over ad-hoc inline shapes at API boundaries.
- Use `@`-prefixed path aliases (see maps below). Prefer aliases over deep relatives; keep same-folder `./` relatives.

**Client** (`client/tsconfig.json`, Next resolves automatically):

| Alias | Path |
|-------|------|
| `@src/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@constants`, `@constants/*` | `src/constants` |
| `@hooks/*` | `src/hooks/*` |
| `@views/*` | `src/views/*` |
| `@types` | `src/types` (barrel only — no `@types/*`) |
| `@utils/*` | `src/utils/*` |
| `@contexts/*` | `src/contexts/*` |
| `@assets/*` | `src/assets/*` |

**Mobile** (`mobile/tsconfig.json`; Metro reads `paths` via Expo):

| Alias | Path |
|-------|------|
| `@/*` | project root (e.g. `app/`) |
| `@src/*` | `src/*` |
| `@components/*`, `@hooks/*`, `@contexts/*`, `@services/*`, `@screens/*`, `@utils/*` | matching `src/<name>/*` |
| `@constants`, `@constants/*` | `src/constants` |
| `@types` | `src/types` barrel |

**Server** (`server/tsconfig.json`; `tsc && tsc-alias` for `dist/`, `tsx` + Vercel/`@vercel/node` resolve paths at runtime):

| Alias | Path |
|-------|------|
| `@src/*` | `src/*` |
| `@ai/*`, `@controllers/*`, `@database/*`, `@middleware/*`, `@models/*`, `@services/*`, `@utils/*`, `@validations/*` | matching `src/<name>/*` |
| `@ai`, `@config`, `@constants`, `@routes`, `@schemas`, `@types` | barrels under `src/` |
| `@constants/*`, `@config/*`, `@routes/*`, `@schemas/*` | subpaths |
| Types submodules | `@src/types/...` (avoid `@types/*` clashing with DefinitelyTyped) |

Do not add `@types/*` path mappings — they collide with DefinitelyTyped packages (`@types/node`, etc.).

## Server: validation and errors

- Validate request bodies/params/queries with **Zod** (`schemas/` + validation middleware). Reject invalid input before controllers/services run.
- Response shape (public contract):

  ```ts
  { success: true, data?: T }
  { success: false, error: string }
  ```

- Use the shared error handler / HTTP status constants; do not invent one-off response envelopes.
- Log with the project logger; never log secrets, tokens, or decrypted credentials.

## API route style

- Thin **routes**: wire middleware (auth, DB, Zod) and delegate to controllers.
- **Controllers**: map HTTP ↔ service calls; keep business logic in **services**.
- Platform publishing and credentials stay server-side; clients use `apiClient` (or mobile equivalent), not direct platform SDKs.
- Preserve partial-failure / retry behavior for multi-platform publish. Require explicit user confirmation for externally visible publish/schedule actions.

## Client / UI

- Style with **Tailwind** semantic tokens from `client/app/globals.css` (`bg-primary`, `text-muted-foreground`, `border-border`, …). No hardcoded color hex in components.
- Variants and repeated sizes: `client/src/constants/designTokens.ts` (`BUTTON_*`, `INPUT_*`, `RADIUS`, …).
- User-facing copy: `client/src/constants/messages.ts` (or the package’s messages module). No inline UI strings for product copy.
- Reuse `@components/common`, dashboard, and users components before adding primitives.
- Prefer views in `src/views/` consumed by `app/` routes; keep route files thin.

## Environment and secrets

- Commit only `*.example` env templates (e.g. `server/.env.dev.example`). **Never commit real `.env` files**, keys, service-account JSON, or encrypted credential payloads.
- Read config through the server’s Zod-validated config (`server/src/config/`); do not scatter `process.env` reads in business logic when a config field already exists.
- Firebase / GCS, JWT, Gemini, platform OAuth, and encryption keys are secrets: not in source, not in client bundles, not in logs or docs screenshots.
- Client may expose only intentional public prefixes (e.g. `NEXT_PUBLIC_*`); treat everything else as server-only.

## AI integrations

- Keep **AI model IDs and curated model lists** in [`server/src/constants/ai.ts`](../server/src/constants/ai.ts) (e.g. `AI_CONTENT_MODELS`). Do not hardcode model ID strings in controllers, clients, or prompts elsewhere.
- Prompt text, limits, and safety-related AI constants belong with that module (or adjacent `server/src/ai/` helpers), not duplicated in the client.
- Setup and keys: [AI_SETUP.md](./AI_SETUP.md). Prefer Vertex AI (`GOOGLE_CLOUD_PROJECT` + SA credentials); Studio `GEMINI_API_KEY` is fallback only.

## Related docs

- [AGENTS.md](../AGENTS.md) — agent guide, checks, high-risk areas
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system shape and package ownership
- [VERCEL_ENV.md](./VERCEL_ENV.md) — deployment env vars
- [SYSTEM_FLOWS.md](./SYSTEM_FLOWS.md) — auth, publish, cron, notifications
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — MongoDB collections

---

## User additions

1. Static values must be moved into a constants file; when using any constant in code, always wrap it in double quotes.
2. Import file sequence, grouped with blank lines: first React imports, then Redux imports if any, then MUI imports, then common component imports, then other imports — organized hierarchically by level/depth.
3. Types: never use `any`; always define and use proper types for everything.
4. Act as a senior software developer in the MERN stack and AI engineer: follow standard coding practices, standardize code, prioritize reusability and robust error handling, follow the existing architecture as reference, and improve current code to match best practices.
5. Test cases must pass with 100% coverage.
6. Never use single-line statements — always use curly braces for if/else, loops, etc.
7. Always type useState hooks (e.g. useState<Type>(...)).
8. For useSelector, the any TypeScript type is allowed (exception to the no-any rule).
