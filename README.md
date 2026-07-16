# SyncApp - Multi-Platform Blog Syndication Platform

> Write once, publish everywhere. A modern full-stack application for creating blog posts and syndicating them across Medium, DEV.to, and WordPress.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/cloud/atlas)

**Production**

- Frontend: [sync-app-client.vercel.app](https://sync-app-client.vercel.app) (or your Vercel URL)
- Backend API: [sync-app-server.vercel.app](https://sync-app-server.vercel.app)
- Health: [sync-app-server.vercel.app/health](https://sync-app-server.vercel.app/health)

---

## Architecture

### Tech stack

**Frontend (`client/`)**

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, design tokens in `client/src/constants/`
- TipTap rich-text editor, React Markdown preview
- Recharts (analytics), react-hot-toast, react-icons

**Backend (`server/`)**

- Node.js 22+, Express 5, TypeScript
- MongoDB Atlas + Mongoose
- JWT auth, bcrypt password hashing
- Google AI Studio (`GEMINI_API_KEY`, default `gemini-3.5-flash`) for AI features
- Google Cloud Storage for image uploads
- Axios for external platform APIs

**Infrastructure**

- MongoDB Atlas
- Vercel (frontend + backend serverless)
- Vercel Cron — daily scheduled publishing (`0 0 * * *`, 12:00 AM UTC)
- Resend (scheduled publish email) + Slack webhooks (optional)

### Project structure

```text
SyncApp/
├── client/                         # Next.js frontend (standalone)
│   ├── app/                        # App Router pages & layouts
│   ├── src/
│   │   ├── components/             # UI, dashboard, editor
│   │   ├── views/                  # Route-level screens
│   │   ├── hooks/                  # useEditorState, usePosts, etc.
│   │   ├── constants/              # Routes, messages, design tokens
│   │   └── utils/                  # apiClient, seoScorecard, logger
│   ├── .env.development.example
│   └── .env.production.example
│
├── server/                         # Express API (standalone)
│   ├── src/
│   │   ├── routes/                 # auth, posts, publish, ai, analytics…
│   │   ├── services/               # publishService, aiService, postsService
│   │   ├── database/               # connection (serverless-safe)
│   │   └── middleware/             # ensureDb, errorHandler
│   ├── api/index.ts                # Vercel serverless entry
│   ├── .env.dev.example
│   └── .env.prod.example
│
├── docs/                           # Architecture, Vercel env, migration notes
├── mobile/                         # Expo React Native app (optional)
├── SyncApp_Postman_Collection.json # Import into Postman (also synced to cloud)
├── SyncApp_Postman_Environment.*.json
├── scripts/generate-keys.js
└── package.json                    # Root helper scripts (install:all, dev)
```

---

## Quick start

### Prerequisites

- Node.js v22+
- MongoDB Atlas (or local MongoDB)
- Optional: Medium, DEV.to, WordPress API credentials for publishing
- Optional: `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey) for AI features

### Install

```bash
git clone https://github.com/FarukhSaifi/SyncApp.git
cd SyncApp
npm run install:all
```

### Backend

```bash
cd server
cp .env.dev.example .env.dev
cp .env.prod.example .env.prod
node ../scripts/generate-keys.js   # copy ENCRYPTION_KEY + IV into .env.dev
# Edit .env.dev — MONGODB_URI, JWT_SECRET, etc.
npm run db:setup
npm run dev
```

Runs at **<http://localhost:9000>** · Health: **<http://localhost:9000/health>**

### Frontend

```bash
cd client
cp .env.development.example .env.development
cp .env.production.example .env.production
# .env.development → NEXT_PUBLIC_API_BACKEND_URL=http://localhost:9000
npm run dev
```

Runs at **<http://localhost:3000>**

### Both at once (from root)

```bash
npm run dev
```

---

## Core workflows

### 1. Create & edit posts

- Write in the TipTap editor with Markdown preview
- Set tags, meta description, canonical URL, cover image, schedule
- **Save** preserves published status; **Save Draft** explicitly reverts to draft
- Autosave runs every 60s for existing posts

### 2. Publish to platforms

| Platform      | First publish   | Re-publish                            |
| ------------- | --------------- | ------------------------------------- |
| **Medium**    | Creates article | Skips (no update API)                 |
| **DEV.to**    | Creates article | Updates existing (`PUT` by `post_id`) |
| **WordPress** | Creates post    | Updates existing post                 |

DEV.to publishing validates canonical URLs (full `http(s)://` only) and normalizes tags (max 4, lowercase).

In **Settings**, connect each platform with API credentials. To disconnect, clear the fields and click **Disconnect** (removes stored credentials). The editor publish menu only lists platforms you have connected.

### 3. Scheduled publishing

- Set a future **Schedule** time in the editor (draft stays in **Scheduled** until due)
- Vercel Cron runs daily at **12:00 AM UTC** (05:30 IST) → `GET /api/cron/publish-scheduled`
- Publishes due drafts to **all connected platforms** (max **10 posts** per run, oldest first)
- Overdue drafts (past schedule time) are picked up on the next cron run
- On success: post → **Published**, `scheduled_for` cleared
- Optional **Slack** + **email** (Resend) notifications to the author — see [docs/VERCEL_ENV.md](./docs/VERCEL_ENV.md)
- Manual **Publish** from the editor clears the schedule and publishes immediately

Protect the cron route with `Authorization: Bearer <CRON_SECRET>` when set.

### 4. AI toolkit

Uses **Google AI Studio** only (`GEMINI_API_KEY`). No Vertex project required. See [docs/AI_SETUP.md](./docs/AI_SETUP.md).

- **Generate Post** — full draft from a keyword (title, meta, tags, markdown body)
- **Generate Image** — featured image from topic (Gemini image / Imagen when available, else SVG cover)
- **Edit Content** — proofread, shorten, expand selected text

**Local** (`server/.env.dev`):

```bash
GEMINI_API_KEY=your_key_from_aistudio
GOOGLE_AI_MODEL=gemini-3.5-flash
```

Then restart the server. Confirm logs show `AI: Google AI Studio key detected`.

**Production** — on Vercel project **sync-app-server** → Settings → Environment Variables, set the same vars for Production (+ Preview), then **Redeploy**. Local `.env.*` files are not used on Vercel.

**Example** (auth required):

```bash
curl -X POST https://sync-app-server.vercel.app/api/ai/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"serverless Node tips","model":"gemini-3.5-flash"}'
```

Default model: `gemini-3.5-flash` (fallbacks: `gemini-3.1-flash-lite`, `gemini-flash-lite-latest`).

### 5. Analytics

Dashboard → Analytics: total posts, publish rate, per-platform counts, 30-day activity line chart, platform pie chart.

---

## API overview

| Group | Endpoints |
| --- | --- |
| **Auth** | `POST /api/auth/register`, `login`, `GET/PUT /api/auth/me`, `PUT change-password` |
| **Posts** | CRUD + `GET /slug/:slug`, `PUT /:id/cover` |
| **Publish** | `POST /publish/{medium,devto,wordpress,all}`, `GET /medium/status/:postId`, `DELETE /:platform/:postId` |
| **Credentials** | `GET/PUT/DELETE /api/credentials/:platform` (DELETE disconnects a platform) |
| **AI** | `POST /api/ai/generate`, `generate-image`, `edit` |
| **Analytics** | `GET /api/analytics/stats` |
| **Upload** | `POST /api/upload` (multipart image → GCS) |
| **MDX** | `GET /api/mdx/:id` |
| **Cron** | `GET /api/cron/publish-scheduled` (Bearer `CRON_SECRET`) |
| **Health** | `GET /health` — returns 200 when DB connected, **503** when disconnected |

Full request/response examples: import **`SyncApp_Postman_Collection.json`** into Postman.

---

## Postman

1. Import **`SyncApp_Postman_Collection.json`**
2. Import **`SyncApp_Postman_Environment.production.json`** or **`.local.json`**
3. Select the environment in Postman
4. Run **Auth → Login** — the test script saves `data.token` to `{{token}}` and `data.user.id` to `{{userId}}`
5. All other requests use collection Bearer auth via `{{token}}`

Collection is also synced to the **Node Backend** workspace in Postman cloud.

---

## Scripts

| Location  | Command               | Description                                  |
| --------- | --------------------- | -------------------------------------------- |
| Root      | `npm run install:all` | Install client + server + mobile deps        |
| Root      | `npm run dev`         | Run client + server concurrently             |
| Root      | `npm run env:pull`    | Pull Vercel production env vars locally      |
| Root      | `npm run check`       | Lint + typecheck (client) and build (server) |
| Root      | `npm run audit:all`   | `npm audit` (high severity) on both apps     |
| Root      | `npm run dev:mobile`  | Start Expo mobile app                        |
| `server/` | `npm run dev`         | API with nodemon (port 9000)                 |
| `server/` | `npm run db:setup`    | Seed database                                |
| `client/` | `npm run dev`         | Next.js dev server (port 3000)               |
| `client/` | `npm run build`       | Production build                             |

---

## Configuration

Environment files are split by app and environment. Copy from `*.example` templates.

| File                      | Used when                       |
| ------------------------- | ------------------------------- |
| `server/.env.dev`         | `npm run dev` (`APP_ENV=dev`)   |
| `server/.env.prod`        | `npm start` / Vercel production |
| `client/.env.development` | `next dev`                      |
| `client/.env.production`  | `next build`                    |

**Vercel checklist:** [docs/VERCEL_ENV.md](./docs/VERCEL_ENV.md)

Key server variables:

```bash
MONGODB_URI=...
JWT_SECRET=...
ENCRYPTION_KEY=...          # scripts/generate-keys.js
ENCRYPTION_IV=...
CORS_ORIGIN=https://your-frontend.vercel.app
CANONICAL_BASE_URL=https://yourblog.com/blog   # DEV.to canonical fallback
GEMINI_API_KEY=...           # Google AI Studio — required for AI routes
GOOGLE_AI_MODEL=gemini-3.5-flash
GOOGLE_CREDENTIALS_JSON=...  # Optional: GCS cover uploads only
CRON_SECRET=...              # Vercel Cron auth (Bearer token)
RESEND_API_KEY=...           # Scheduled publish emails (optional)
NOTIFICATION_FROM_EMAIL=...  # Verified Resend sender
SLACK_WEBHOOK_URL=...        # Scheduled publish Slack alerts (optional)
SITE_URL=...                 # Client URL for links in notification emails
```

Key client variables:

```bash
NEXT_PUBLIC_API_BACKEND_URL=https://sync-app-server.vercel.app
NEXT_PUBLIC_CANONICAL_BASE_URL=https://yourblog.com/blog
```

---

## Deployment

Both apps deploy independently to Vercel:

| App        | Root directory | Framework       | Build                  |
| ---------- | -------------- | --------------- | ---------------------- |
| **Client** | `client/`      | Next.js         | `npm run build`        |
| **Server** | `server/`      | Other (Express) | `npm run vercel-build` |

- Set all env vars in each Vercel project dashboard
- Point client `NEXT_PUBLIC_API_BACKEND_URL` at the server URL
- Add server `CORS_ORIGIN` for the client URL
- Cron is defined in `server/vercel.json`: daily `0 0 * * *` → `/api/cron/publish-scheduled` (set `CRON_SECRET` on the server project)
- Optional: use **Ignored Build Step** per project to deploy only when `client/` or `server/` changes

See [docs/VERCEL_ENV.md](./docs/VERCEL_ENV.md) and [server/README.md](./server/README.md).

---

## Security

- bcrypt password hashing
- JWT with expiration
- AES-256-CBC encrypted platform API keys
- Helmet security headers + CORS allowlist
- Rate limiting on `/api` (configurable)
- Serverless-safe MongoDB connection with pre-route `ensureDb` middleware

---

## Health check

```bash
curl https://sync-app-server.vercel.app/health
```

```json
{
  "status": "OK",
  "database": {
    "status": "connected",
    "host": "cluster.mongodb.net",
    "name": "syncapp",
    "mongoUriConfigured": true
  },
  "services": {
    "mongodb": "healthy",
    "server": "healthy"
  }
}
```

Returns **503** when MongoDB is unreachable (includes `database.error`).

---

## Documentation

| Doc                                                    | Description                        |
| ------------------------------------------------------ | ---------------------------------- |
| [client/README.md](./client/README.md)                 | Frontend setup                     |
| [server/README.md](./server/README.md)                 | Backend setup                      |
| [docs/VERCEL_ENV.md](./docs/VERCEL_ENV.md)             | Vercel env vars & troubleshooting  |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)         | System architecture                |
| [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)   | MongoDB collections & ER diagram   |
| [docs/SYSTEM_FLOWS.md](./docs/SYSTEM_FLOWS.md)         | Auth, publish, cron, notifications |
| [docs/FEATURES.md](./docs/FEATURES.md)                 | Functional requirements matrix     |
| [docs/PROJECT_SYNOPSIS.md](./docs/PROJECT_SYNOPSIS.md) | Project overview                   |
| [docs/AI_SETUP.md](./docs/AI_SETUP.md)                 | Google AI Studio setup             |
| [CHANGELOG.md](./CHANGELOG.md)                         | Version history                    |

---

## Roadmap

- [ ] Hashnode / Ghost integration
- [ ] Unpublish UI (API already exists)
- [ ] Team collaboration & content calendar
- [ ] Email newsletter integration
- [ ] Social media auto-share
- [ ] Advanced SEO tooling
- [ ] Multi-language support

---

## Feature implementation status

| Feature | Status | Notes |
| --- | :-: | --- |
| **Multi-platform publishing** (Medium, DEV.to, WordPress) | ✅ | One-click per platform or publish-all |
| **Smart re-publish** (update, not duplicate) | ✅ | DEV.to & WordPress update existing remote posts; Medium skips if already published |
| **Rich text / Markdown editor** (TipTap) | ✅ | Live preview, toolbar, keyboard shortcuts |
| **JWT authentication & protected routes** | ✅ | Register, login, profile, change password |
| **Role-based access** (user / admin) | ✅ | Admin user management screen |
| **Encrypted platform credentials** | ✅ | AES-256-CBC; connect/disconnect Medium, DEV.to, WordPress in Settings |
| **Smart publish menu** | ✅ | Editor shows only connected platforms; publish-all uses active credentials |
| **Cover image upload** | ✅ | Base64 or file upload → Google Cloud Storage |
| **Canonical URLs & SEO metadata** | ✅ | Meta description, slug, canonical URL; DEV.to validates URL + max 4 tags |
| **SEO scorecard** (editor sidebar) | ✅ | Real-time scoring from title, meta, tags, content |
| **AI writing assistant** | ✅ | Full post generation, inline edit, featured image (Google AI Studio) |
| **Analytics dashboard** | ✅ | Summary stats, platform breakdown, 30-day activity charts |
| **Post scheduling** | ✅ | Schedule in editor; daily cron at 12:00 AM UTC; overdue drafts publish on next run |
| **Scheduled publish notifications** | ✅ | Slack webhook + Resend email (success, partial, failed, skipped) |
| **Draft autosave** | ✅ | Existing posts auto-save every 60s when dirty |
| **Preserve published status on save** | ✅ | Regular save keeps status; only **Save Draft** reverts to draft |
| **MDX export** | ✅ | Download post as MDX with frontmatter |
| **Dark mode** | ✅ | Persistent theme preference |
| **Dashboard platform chips** | ✅ | Read-only links to published articles (no unpublish in UI) |
| **Vercel serverless deployment** | ✅ | Client (Next.js) + Server (Express) on Vercel |
| **MongoDB serverless connection** | ✅ | Cached connect, cold-start health check, 503 when DB down |
| **Postman collection & environments** | ✅ | Auto-saves JWT after Login to `{{token}}` for all requests |
| **Unpublish API** | 🚧 | `DELETE /api/publish/:platform/:postId` exists; not exposed in dashboard UI |
| **Hashnode / Ghost integration** | ❌ | Planned |
| **Collaborative editing** | ❌ | Planned |
| **Team workspaces / content calendar** | ❌ | Planned |
| **Email newsletter / social auto-share** | ❌ | Planned |
| **Native mobile app** | ❌ | Planned |

**Legend:** ✅ Implemented · 🚧 Partial / API-only · ❌ Not started

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit with clear messages
4. Open a Pull Request

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Author

**Farukh Saifi** · [GitHub @FarukhSaifi](https://github.com/FarukhSaifi)

**SyncApp** — Write once, publish everywhere.
