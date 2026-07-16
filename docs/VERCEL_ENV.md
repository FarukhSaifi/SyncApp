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

1. For **local development only**, use `.env.dev` (never required on Vercel).

| File               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `.env.development` | Local `npm run dev` (Next.js loads automatically)              |
| `.env.production`  | Local `npm run build` / `npm start`; or `vercel env pull`      |
| Vercel Dashboard   | Source of truth for deployed Production (and optional Preview) |

---

## Server project (Root Directory: `server`)

Create a Vercel project with **Root Directory** = `server`.

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Min 32 characters |
| `ENCRYPTION_KEY` | Yes | 32-byte hex (`node scripts/generate-keys.js`) |
| `ENCRYPTION_IV` | Yes | 16-byte hex |
| `CORS_ORIGIN` | Yes | Frontend URL(s), comma-separated, e.g. `https://sync-app-client.vercel.app` |
| `GEMINI_API_KEY` | **Yes (AI)** | Key from [Google AI Studio](https://aistudio.google.com/apikey) — required for all AI routes |
| `GOOGLE_AI_MODEL` | Recommended | `gemini-3.5-flash` (default + primary fallback) |
| `GEMINI_IMAGE_MODEL` | Optional | e.g. `gemini-2.5-flash-image` when image quota is available |
| `GOOGLE_CLOUD_PROJECT` | Optional (GCS) | Only for cover image uploads to Cloud Storage |
| `GOOGLE_CREDENTIALS_JSON` | Optional (GCS) | Service account JSON on Vercel for Storage |
| `GCS_BUCKET_NAME` | Optional | Overrides default bucket |
| `CANONICAL_BASE_URL` | Optional | Public blog base URL for post canonicals |
| `CRON_SECRET` | Optional | If using cron routes |
| `RESEND_API_KEY` | For email | [Resend](https://resend.com) API key — scheduled publish author emails |
| `NOTIFICATION_FROM_EMAIL` | For email | Verified sender, e.g. `SyncApp <noreply@farukh.me>` (not a Gmail address) |
| `NOTIFICATION_CC_EMAIL` | Optional | Always CC’d on publish emails; default `farook1x95@gmail.com` (plus author) |
| `SLACK_WEBHOOK_URL` | Optional | Slack webhook for scheduled publish notifications |
| `SITE_URL` | Optional | Client app URL for links in notification emails |
| `RATE_LIMIT_WINDOW_MS` | Optional | Default `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | Default `100` |

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
GEMINI_API_KEY=          # REQUIRED — paste working Studio key, then Redeploy
GOOGLE_AI_MODEL=gemini-3.5-flash
# GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
# Optional GCS only:
# GOOGLE_CLOUD_PROJECT=
# GOOGLE_CREDENTIALS_JSON=
RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=SyncApp <noreply@farukh.me>
NOTIFICATION_CC_EMAIL=farook1x95@gmail.com
SLACK_WEBHOOK_URL=
SITE_URL=https://sync-app-client.vercel.app
CRON_SECRET=
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

- **MongoDB disconnected on `/health` (Vercel)** — Check:
  1. **Server project env vars** — `MONGODB_URI` must be set under **Production** (not only Preview).
  2. **Atlas Network Access** — Allow `0.0.0.0/0` (or Vercel egress IPs). Serverless functions use dynamic IPs.
  3. **Redeploy** after adding env vars — Vercel does not inject new vars into running deployments until redeploy.
  4. **Health response `database.error`** — After redeploy, `GET /health` includes the connection error message when DB fails (e.g. auth, timeout, IP block).
- **CORS errors** — `CORS_ORIGIN` on the **server** project must include your client URL exactly (scheme + host, no trailing slash).
- **AI errors** — Set `GEMINI_API_KEY` + `GOOGLE_AI_MODEL=gemini-3.5-flash` on **sync-app-server** ([AI Studio](https://aistudio.google.com/apikey)), then **Redeploy**. See [AI_SETUP.md](./AI_SETUP.md).
- **`FUNCTION_INVOCATION_FAILED` / `ERR_REQUIRE_ESM` (uuid)** — Production must not use ESM-only `uuid@14` with `@vercel/node` CJS. SyncApp uses `crypto.randomUUID()` instead. Redeploy after pulling this fix.
- **Client hits wrong API** — rebuild client after changing `NEXT_PUBLIC_API_BACKEND_URL`.
- **Resend email not delivered** — See [Resend + Namecheap DNS](#resend-email--namecheap-basicdns) below.

---

## Resend email + Namecheap BasicDNS

Scheduled publish reports are sent via Resend to the **post author’s account email** and **`NOTIFICATION_CC_EMAIL`** (default `farook1x95@gmail.com`). `NOTIFICATION_FROM_EMAIL` is the **sender** (`from`), not the recipient.

**Do not use a Gmail address as `NOTIFICATION_FROM_EMAIL`.** Resend rejects unverified domains (e.g. `farook1x95@gmail.com` → 403).

### Quick test (no domain DNS)

Until `farukh.me` is verified in Resend:

```
NOTIFICATION_FROM_EMAIL=SyncApp <onboarding@resend.dev>
```

Sandbox limit: Resend only delivers to the email address on your Resend account.

### Production sender (`farukh.me`)

1. [Resend → Domains](https://resend.com/domains) → **Add Domain** → `farukh.me`
2. Copy the DNS records Resend shows (usually **TXT** + **CNAME**). **MX is not required** for sending-only.
3. In Namecheap: **Domain List → farukh.me → Manage → Advanced DNS**
4. Confirm nameservers are **Namecheap BasicDNS** (`dns1.registrar-servers.com`, `dns2.registrar-servers.com`).
5. **Add New Record** for each Resend record:

| Resend type | Namecheap “Type”     | Host field (Namecheap)       | Notes                                     |
| ----------- | -------------------- | ---------------------------- | ----------------------------------------- |
| TXT         | TXT Record           | `@` or subdomain from Resend | Paste full value from Resend              |
| CNAME       | CNAME Record         | e.g. `resend._domainkey`     | Host is subdomain only — not `…farukh.me` |
| MX          | _(skip for sending)_ | —                            | Only needed for inbound mail              |

1. Wait 5–30 minutes, then click **Verify** in Resend.
2. Set on **server** Vercel project (Production):

```
NOTIFICATION_FROM_EMAIL=SyncApp <noreply@farukh.me>
RESEND_API_KEY=re_...
```

1. **Redeploy** `sync-app-server`.

### Namecheap tips

- **Advanced DNS** is where TXT/CNAME live — not Email Forwarding or Redirect.
- Pick **MX Record** from the Type dropdown only if Resend explicitly requires inbound mail (SyncApp does not).
- If a CNAME Host already exists, edit it rather than duplicating.
- Existing records (e.g. Google site verification TXT on `@`) can stay — add Resend records alongside them.

See also: [server/README.md](../server/README.md#vercel-serverless), [ARCHITECTURE.md](./ARCHITECTURE.md).
