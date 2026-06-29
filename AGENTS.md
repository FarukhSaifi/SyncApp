# SyncApp — Agent Guide

Instructions for Cursor Cloud Agents, Automations, and CI-triggered bug-fix runs.

## Repository layout

```text
SyncApp/
├── client/     # Next.js 16 (App Router), React 19, Tailwind v4
├── server/     # Express 5 API, Mongoose, Vercel serverless
├── mobile/     # Expo 54 companion app
├── docs/       # Architecture, flows, deployment
└── .github/    # CI, bug-agent automation
```

## Architecture (server)

```text
HTTP → middleware → /api → routes → controllers → services → models → MongoDB
```

Key services:

| Service | Path | Responsibility |
|---------|------|----------------|
| AI | `server/src/services/aiService.ts` | Generate, optimise, edit via Vertex AI |
| Publish | `server/src/services/publishService.ts` | DEV.to, Medium, WordPress syndication |
| Posts | `server/src/services/postsService.ts` | CRUD, cover images, scheduling |

## Architecture (client)

```text
app/ (routes) → src/views/ (screens) → src/components/ → apiClient.ts → /api
```

State: React Context + hooks (`AuthContext`, `usePosts`, `useEditorState`, `useEditorAI`). No Redux.

## Verify before opening a PR

Run from repo root:

```bash
npm run check
```

Or individually:

```bash
npm run check:client   # lint + typecheck (client)
npm run check:server   # typecheck + build (server)
cd client && npm run build
```

## Bug-fix rules

1. **Reproduce first** — run the failing command or trace the reported error.
2. **Minimal fix** — change only what fixes the root cause; no drive-by refactors.
3. **Follow existing patterns** — constants in `*/constants/`, types in `*/types/`.
4. **No new markdown docs** unless the task explicitly requires documentation.
5. **Preserve API shape** — `{ success: true, data }` / `{ success: false, error }`.
6. **Security** — never commit secrets; credentials stay in env vars.
7. **Tags for DEV.to** — lowercase, no hyphens/spaces, max 4 (`server/src/utils/devtoTags.ts`).

## Common failure areas

| Area | Check |
|------|-------|
| AI / Vertex | `GOOGLE_AI_MODEL`, `GOOGLE_CLOUD_LOCATION=global` for gemini-3.5-flash |
| Publish | Encrypted credentials, public cover URL for DEV.to |
| Client API | `client/next.config.ts` rewrites `/api/*` in dev |
| Serverless DB | `ensureDb` middleware on all `/api` routes |

## PR format

- **Title:** `fix: <short description>`
- **Body:** bug summary, root cause, fix, verification commands run
- **Draft OK** — human reviews before merge

## Automation entry points

| Trigger | Workflow | Action |
|---------|----------|--------|
| CI fails on `main` | `.github/workflows/cursor-bug-agent.yml` | Cloud Agent + draft PR |
| Weekly schedule | same | Proactive bug scan |
| Manual | Actions → “Cursor Bug Agent” → Run workflow | On-demand fix |
| Cursor UI | [cursor.com/automations](https://cursor.com/automations) | Configure triggers + PR tool |

Setup: see `docs/BUG_AGENT_AUTOMATION.md`.
