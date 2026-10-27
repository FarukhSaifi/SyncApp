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

1. For **local development only**, use `.env.dev` (never required on Vercel Production).
2. To push local files to Vercel (non-sensitive): from `server/`, `npm run env:sync` — **Production + Preview** ← `.env.prod`, **Development** ← `.env.dev`.

| File               | Purpose                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `.env.development` | Local `npm run dev` (Next.js loads automatically)                                  |
| `.env.production`  | Local `npm run build` / `npm start`; or `vercel env pull`                          |
| Vercel Dashboard   | Source of truth for deployed Production + Preview (+ Development for `vercel dev`) |

---

## Server project (Root Directory: `server`)

Create a Vercel project with **Root Directory** = `server`.

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Min 32 characters |
| `ENCRYPTION_KEY` | Yes | 64-character hex string (32 bytes) for AES-256-GCM |
| `CORS_ORIGIN` | Yes | Frontend URL(s), comma-separated, e.g. `https://your-frontend.example.com` |
| `GCS_BUCKET_NAME` | Yes | GCS bucket for covers (local default: `syncapp-ai-covers` on project `syncapp-ai`) |
| `GOOGLE_CLOUD_PROJECT` | **Yes (Vertex AI)** | `syncapp-ai` |
| `GOOGLE_CLOUD_LOCATION` | Recommended | `us-central1` |
| `GOOGLE_CREDENTIALS_JSON` | Preferred (Vertex + GCS + GA4) | SA JSON when org policy allows keys; else WIF (see [AI_SETUP.md](./AI_SETUP.md)). Local uses ADC, not usable on Vercel. |
| `GCS_SIGNING_SERVICE_ACCOUNT` | Optional (local ADC) | SA email to impersonate for V4 signed uploads when using user ADC. Defaults to `syncapp-vertex-ai@syncapp-ai.iam.gserviceaccount.com`. Not needed when `GOOGLE_CREDENTIALS_JSON` is a service-account key. |
| `GOOGLE_AI_MODEL` | Recommended | `gemini-3.8-flash` (default) |
| `GEMINI_API_KEY` | Optional (Studio fallback) | Only if Vertex is not configured — do **not** top up AI Studio billing |
| `CANONICAL_BASE_URL` | Optional | **Public blog only** (LinkedIn Read more + post canonicals). LinkedIn UTMs are appended in code (not env). e.g. `https://yourblog.example.com/blog` |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | Optional (blog analytics) | Numeric GA4 **property** id (not `G-…`). Grant SA Viewer + enable Analytics Data API — see [GA4_SETUP.md](./GA4_SETUP.md) |
| `CRON_SECRET` | **Required in production** | Bearer secret for `/api/cron/*`. Empty secret never skips auth (fail-closed). |
| `RESEND_API_KEY` | For email | [Resend](https://resend.com) API key |
| `NOTIFICATION_FROM_EMAIL` | For email | Verified sender address (must be on a domain verified in Resend) |
| `NOTIFICATION_CC_EMAIL` | Optional | Extra recipient for scheduled-publish emails (override code default) |
| `SLACK_WEBHOOK_URL` | Optional | Slack webhook for publish alerts |
| `SITE_URL` | Optional | SyncApp client URL for OAuth returns and deep links |
| `LINKEDIN_CLIENT_ID` | For LinkedIn | LinkedIn Developer app Client ID |
| `LINKEDIN_CLIENT_SECRET` | For LinkedIn | LinkedIn Developer app Client Secret |
| `LINKEDIN_REDIRECT_URI` | For LinkedIn | e.g. `https://your-api.example.com/api/linkedin/oauth/callback` |

**No longer required on Vercel:**
- `ENCRYPTION_IV` — Authenticated AES-256-GCM generates a random 12-byte IV per record.

---

## Direct-to-GCS Presigned Upload CORS Setup

Because the client browser uploads files directly to Google Cloud Storage / Firebase Storage via HTTP `PUT`, the bucket must have CORS configured.

Create a `cors.json` file (`x-goog-content-length-range` is required so browser preflight allows the signed V4 PUT headers):
```json
[
  {
    "origin": ["https://your-frontend.example.com", "http://localhost:3000", "http://127.0.0.1:3000"],
    "method": ["PUT", "GET", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Content-Length", "x-goog-resumable", "x-goog-content-length-range", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  }
]
```
Apply it via Google Cloud CLI:
```bash
gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=cors.json
```

For SyncApp’s default bucket (`syncapp-ai-covers`), origins should include local dev and the client production host (e.g. `https://sync-app-client.vercel.app`).

---

## Quick copy template (Production)

Placeholder values only — fill from your Vercel / GCP / blog hosts. Never paste real secrets into git.

### Server → Vercel → Environment Variables → Production

```
MONGODB_URI=
JWT_SECRET=
ENCRYPTION_KEY=
CORS_ORIGIN=https://your-frontend.example.com
GCS_BUCKET_NAME=syncapp-ai-covers
GOOGLE_CLOUD_PROJECT=syncapp-ai
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CREDENTIALS_JSON=
# GCS_SIGNING_SERVICE_ACCOUNT=   # optional; local ADC impersonation only
GOOGLE_AI_MODEL=gemini-3.8-flash
# GEMINI_API_KEY=   # optional Studio fallback only
GOOGLE_ANALYTICS_PROPERTY_ID=
RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=SyncApp <noreply@yourdomain.example.com>
NOTIFICATION_CC_EMAIL=you@example.com
SLACK_WEBHOOK_URL=
SITE_URL=https://your-frontend.example.com
CANONICAL_BASE_URL=https://yourblog.example.com/blog
CRON_SECRET=your-cron-secret-here
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://your-api.example.com/api/linkedin/oauth/callback
```

### Client → Vercel → Environment Variables → Production

```
NEXT_PUBLIC_API_BACKEND_URL=https://your-api.example.com
NEXT_PUBLIC_SITE_URL=https://your-frontend.example.com
NEXT_PUBLIC_CANONICAL_BASE_URL=https://yourblog.example.com/blog
```

---

## Preview vs Production

In Vercel, when adding a variable you can enable:

- **Production** — live deploys
- **Preview** — PR previews (can use same values as Production for testing)
- **Development** — `vercel dev` only

For Preview deployments to work with your API, set `CORS_ORIGIN` to include preview URLs or use a wildcard pattern if acceptable for your security model.

---

## Production deploy gate (GitHub → Vercel)

Production domains for **sync-app-client** and **sync-app-server** are held until the GitHub Actions check **`Production gate`** passes on the deployed commit.

| Layer | What it does |
| --- | --- |
| GitHub Actions (`.github/workflows/ci.yml`) | Job **`Production gate`** succeeds only when ESLint, Typecheck, Client production build, and Server production build all succeed. EAS mobile build is **not** part of this gate. |
| Vercel Deployment Checks | Both projects wait on GitHub check name **`Production gate`**, target **production**, blocks **deployment-alias** (production domains are not assigned until the check passes). Timeout: 30 minutes. |
| GitHub ruleset (recommended) | Require status check **`Production gate`** on `main` so failing CI cannot merge. |

**Pass:** Vercel production build finishes, then aliases production domains automatically.  
**Fail / timeout:** Production deployment is not promoted; previous production stays live. Use **Force Promote** on the deployment page only for emergencies.

Settings links (team `farukh-saifis-projects`):

- Client Deployment Checks: https://vercel.com/farukh-saifis-projects/sync-app-client/settings/deployment-checks
- Server Deployment Checks: https://vercel.com/farukh-saifis-projects/sync-app-server/settings/deployment-checks
- Repo rulesets: https://github.com/FarukhSaifi/SyncApp/rules
- Branch protection / rules: https://github.com/FarukhSaifi/SyncApp/settings/rules

---

## Troubleshooting

- **MongoDB disconnected on `/health` (Vercel)** — Check:
  1. **Server project env vars** — `MONGODB_URI` must be set under **Production** (not only Preview).
  2. **Atlas Network Access** — Allow `0.0.0.0/0` (or Vercel egress IPs). Serverless functions use dynamic IPs.
  3. **Redeploy** after adding env vars — Vercel does not inject new vars into running deployments until redeploy.
  4. **Health response `database.error`** — After redeploy, `GET /health` includes the connection error message when DB fails (e.g. auth, timeout, IP block).
- **CORS errors** — `CORS_ORIGIN` on the **server** project must include your client URL exactly (scheme + host, no trailing slash).
- **AI errors / credits depleted / Vertex auth** — Prefer Vertex on `syncapp-ai`: set `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, and `GOOGLE_CREDENTIALS_JSON` (SA with Vertex AI User) on **sync-app-server**, enable `aiplatform.googleapis.com`, then **Redeploy**. Do **not** top up AI Studio billing. Confirm `/health` → `ai.configured: true`, `ai.provider: "vertex"`. See [AI_SETUP.md](./AI_SETUP.md).
- **Preview deploy `Missing MONGODB_URI`** — Preview uses the same vars as Production from `.env.prod` via `npm run env:sync`. Redeploy preview after sync.
- **`FUNCTION_INVOCATION_FAILED` / `ERR_REQUIRE_ESM` (uuid)** — Production must not use ESM-only `uuid@14` with `@vercel/node` CJS. SyncApp uses `crypto.randomUUID()` instead. Redeploy after pulling this fix.
- **Client hits wrong API** — rebuild client after changing `NEXT_PUBLIC_API_BACKEND_URL`.
- **Resend email not delivered** — See [Resend + Namecheap DNS](#resend-email--namecheap-basicdns) below.

---

## Resend email + Namecheap BasicDNS

Scheduled publish reports are sent via Resend to the **post author’s account email** and **`NOTIFICATION_CC_EMAIL`** (optional override). `NOTIFICATION_FROM_EMAIL` is the **sender** (`from`), not the recipient.

**Do not use a personal Gmail address as `NOTIFICATION_FROM_EMAIL`.** Resend rejects unverified domains (403).

### Quick test (no domain DNS)

Until your custom domain is verified in Resend:

```
NOTIFICATION_FROM_EMAIL=SyncApp <onboarding@resend.dev>
```

Sandbox limit: Resend only delivers to the email address on your Resend account.

### Production sender (custom domain)

1. [Resend → Domains](https://resend.com/domains) → **Add Domain** → `yourdomain.example.com`
2. Copy the DNS records Resend shows (usually **TXT** + **CNAME**). **MX is not required** for sending-only.
3. In your DNS host (e.g. Namecheap): **Domain List → your domain → Manage → Advanced DNS**
4. Confirm nameservers are **Namecheap BasicDNS** (`dns1.registrar-servers.com`, `dns2.registrar-servers.com`) if using Namecheap.
5. **Add New Record** for each Resend record:

| Resend type | Namecheap “Type”     | Host field (Namecheap)       | Notes                                              |
| ----------- | -------------------- | ---------------------------- | -------------------------------------------------- |
| TXT         | TXT Record           | `@` or subdomain from Resend | Paste full value from Resend                       |
| CNAME       | CNAME Record         | e.g. `resend._domainkey`     | Host is subdomain only — not the full apex domain |
| MX          | _(skip for sending)_ | —                            | Only needed for inbound mail                       |

1. Wait 5–30 minutes, then click **Verify** in Resend.
2. Set on **server** Vercel project (Production):

```
NOTIFICATION_FROM_EMAIL=SyncApp <noreply@yourdomain.example.com>
RESEND_API_KEY=
```

1. **Redeploy** the server project after changing env.

### Namecheap tips

- **Advanced DNS** is where TXT/CNAME live — not Email Forwarding or Redirect.
- Pick **MX Record** from the Type dropdown only if Resend explicitly requires inbound mail (SyncApp does not).
- If a CNAME Host already exists, edit it rather than duplicating.
- Existing records (e.g. Google site verification TXT on `@`) can stay — add Resend records alongside them.

See also: [server/README.md](../server/README.md#vercel-serverless), [ARCHITECTURE.md](./ARCHITECTURE.md).
