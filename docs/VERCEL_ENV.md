# Vercel environment variables

You do **not** need to maintain the same values in two places manually.

**Recommended workflow**

1. Add variables **once** in the [Vercel Dashboard](https://vercel.com/dashboard) (see tables below).
2. Pull them into local `.env.prod` when you need to run a production build locally:

```bash
# From repo root (requires Vercel CLI: npm i -g vercel)
npm run env:pull
```

Or per project:

```bash
cd server && vercel env pull .env.prod --environment=production
cd client && vercel env pull .env.production --environment=production
```

3. For **local development only**, use `.env.dev` (never required on Vercel).

| File               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `.env.development` | Local `npm run dev` (Next.js loads automatically)              |
| `.env.production`  | Local `npm run build` / `npm start`; or `vercel env pull`      |
| Vercel Dashboard   | Source of truth for deployed Production (and optional Preview) |

---

## Server project (Root Directory: `server`)

Create a Vercel project with **Root Directory** = `server`.

| Variable                  | Required | Notes                                                                       |
| ------------------------- | -------- | --------------------------------------------------------------------------- |
| `MONGODB_URI`             | Yes      | MongoDB Atlas connection string                                             |
| `JWT_SECRET`              | Yes      | Min 32 characters                                                           |
| `ENCRYPTION_KEY`          | Yes      | 32-byte hex (`node scripts/generate-keys.js`)                               |
| `ENCRYPTION_IV`           | Yes      | 16-byte hex                                                                 |
| `CORS_ORIGIN`             | Yes      | Frontend URL(s), comma-separated, e.g. `https://sync-app-client.vercel.app` |
| `GOOGLE_CLOUD_PROJECT`    | For AI   | GCP project ID                                                              |
| `GOOGLE_CLOUD_LOCATION`   | For AI   | e.g. `us-central1`                                                          |
| `GOOGLE_CREDENTIALS_JSON` | For AI   | **Use this on Vercel** — paste full service account JSON (one line)         |
| `GOOGLE_AI_MODEL`         | Optional | e.g. `gemini-3.1-flash-lite`                                                |
| `GCS_BUCKET_NAME`         | Optional | Overrides default bucket                                                    |
| `CANONICAL_BASE_URL`      | Optional | Public blog base URL for post canonicals                                    |
| `CRON_SECRET`             | Optional | If using cron routes                                                        |
| `RATE_LIMIT_WINDOW_MS`    | Optional | Default `900000`                                                            |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | Default `100`                                                               |

**Do not set on Vercel (use alternatives)**

| Variable                         | Why                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `GOOGLE_APPLICATION_CREDENTIALS` | File paths do not exist on serverless — use `GOOGLE_CREDENTIALS_JSON` instead |
| `PORT`                           | Vercel assigns the port                                                       |
| `NODE_ENV`                       | Vercel sets `production` for Production deployments                           |

**Set automatically by Vercel (do not add)**

- `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, etc.

---

## Client project (Root Directory: `client`)

Create a separate Vercel project with **Root Directory** = `client`.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BACKEND_URL` | Yes | Server URL, e.g. `https://sync-app-server.vercel.app` (no trailing `/api`) |
| `NEXT_PUBLIC_CANONICAL_BASE_URL` | Optional | e.g. `https://yourblog.com/blog` |

Next.js inlines `NEXT_PUBLIC_*` at **build time** — redeploy the client after changing these.

---

## Quick copy template (Production)

### Server → Vercel → Environment Variables → Production

```
MONGODB_URI=
JWT_SECRET=
ENCRYPTION_KEY=
ENCRYPTION_IV=
CORS_ORIGIN=https://sync-app-client.vercel.app
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CREDENTIALS_JSON=
GOOGLE_AI_MODEL=gemini-3.1-flash-lite
```

### Client → Vercel → Environment Variables → Production

```
NEXT_PUBLIC_API_BACKEND_URL=https://sync-app-server.vercel.app
NEXT_PUBLIC_CANONICAL_BASE_URL=
```

---

## Preview vs Production

In Vercel, when adding a variable you can enable:

- **Production** — live deploys
- **Preview** — PR previews (can use same values as Production for testing)
- **Development** — `vercel dev` only

For Preview deployments to work with your API, set `CORS_ORIGIN` to include preview URLs or use a wildcard pattern if acceptable for your security model.

---

## Troubleshooting

- **CORS errors** — `CORS_ORIGIN` on the **server** project must include your client URL exactly (scheme + host, no trailing slash).
- **AI 503** — `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CREDENTIALS_JSON` on **server** project; enable Vertex AI API in GCP.
- **Client hits wrong API** — rebuild client after changing `NEXT_PUBLIC_API_BACKEND_URL`.

See also: [server/README.md](../server/README.md#vercel-serverless), [DEPLOYMENT.md](../DEPLOYMENT.md).
