# AI setup — Google AI Studio only

All AI features use one key from [Google AI Studio](https://aistudio.google.com/apikey):

| Feature                    | Requirement                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| Generate post, inline edit | `GEMINI_API_KEY`                                                            |
| Featured image             | Same key (Gemini image / Imagen when allowed; SVG cover fallback otherwise) |
| Cover upload to GCS        | Optional — separate GCP Storage credentials                                 |

No Vertex billing is required for Generate Post or Generate Image.

## Google AI Studio — recommended settings

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key**.
2. Prefer a key that works with `generativelanguage.googleapis.com` (test with Generate Post after setting env).
3. In AI Studio (playground) when tuning prompts:
   - **Model:** `gemini-3.5-flash` (default + primary fallback)
   - **Temperature:** ~0.5–0.6 for articles (app uses `0.55`)
   - **Thinking:** Off / budget `0` on Flash (app disables thinking so JSON fills `maxOutputTokens`)
   - **Output:** JSON schema mode (app sets `responseMimeType: application/json` + schema)
4. Free-tier tips:
   - Default is **Gemini 3.5 Flash**; on `503`/`429` SyncApp retries then falls back to Flash Lite
   - Pro often returns `429` and falls back to **3.5 Flash**
   - Image models may be unavailable — SyncApp still returns a branded SVG cover

## Local setup

1. Create a key at [AI Studio → API keys](https://aistudio.google.com/apikey).
2. In `server/.env.dev`:

```bash
GEMINI_API_KEY=your_key_here
GOOGLE_AI_MODEL=gemini-3.5-flash
# Optional:
# AI_USE_GOOGLE_SEARCH_RETRIEVAL=false
# GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

3. Restart the server after any `.env.dev` change.
4. Confirm log: `AI: Google AI Studio key detected (…)` .

## Production (Vercel — `sync-app-server`)

Set these on the **server** project (Root Directory = `server`), Production + Preview:

| Variable          | Required    | Value                            |
| ----------------- | ----------- | -------------------------------- |
| `GEMINI_API_KEY`  | **Yes**     | Same working Studio key as local |
| `GOOGLE_AI_MODEL` | Recommended | `gemini-3.5-flash`               |

Then **Redeploy** (env changes do not apply to an already-running deployment).

**Dashboard:** [vercel.com](https://vercel.com) → **sync-app-server** → Settings → Environment Variables.

**CLI** (from `server/`, after `npx vercel login`):

```bash
# Production + Preview <- .env.prod ; Development <- .env.dev (all non-sensitive)
npm run env:sync
```

Or manually:

```bash
grep '^GEMINI_API_KEY=' .env.prod | cut -d= -f2- | tr -d '"' | \
  npx vercel env add GEMINI_API_KEY production preview --force --yes --no-sensitive
echo gemini-3.5-flash | npx vercel env add GOOGLE_AI_MODEL production preview --force --yes --no-sensitive
```

Confirm: `GET https://sync-app-server.vercel.app/health` → `ai.configured: true`.

### Real-time topics, Google keywords, and DEV.to tags

| Endpoint | Purpose |
| --- | --- |
| `GET /api/ai/trending-topics` | 6 blog topics + 8 Google SEO keywords via AI Studio Search grounding (`?refresh=1` bypasses cache) |
| `GET /api/ai/devto-tags` | Top popular DEV.to tags from `https://dev.to/api/tags` (`?refresh=1` bypasses cache) |

On failure (quota, missing key, or DEV.to unavailable), these endpoints return an error — the Generate Post modal shows the error and does **not** display curated fallback lists.

Google Ads **Keyword Planner** is not integrated (requires a Google Ads account). Search grounding is the Studio-native equivalent for “what people are researching now.”

### LinkedIn summary + Read more

When Generate Post includes the **LinkedIn** target:

- `content` / `content_markdown` — full article for the editor (and DEV.to when selected)
- `linkedin_post` — short LinkedIn-native teaser; server appends `Read more: {url}`
- `read_more_url` — `{CANONICAL_BASE_URL}/{slug}` when `CANONICAL_BASE_URL` or `SITE_URL` is set
- `linkedin_missing_canonical` — `true` when the blog base URL is unset (no invented domain)

Also set `NEXT_PUBLIC_CANONICAL_BASE_URL` on the client so the sidebar can rewrite Read more after save when the post has a real `canonical_url`.

Do **not** rely on `GOOGLE_CLOUD_PROJECT` / Vertex for AI. Those are optional GCS only.

See [VERCEL_ENV.md](./VERCEL_ENV.md).

## Capabilities

`GET /api/ai/capabilities` → `{ textAi, imageAi, provider: "studio", defaultModel }`.

## Architecture

`server/src/ai/` — Studio client (`studioGenerateContent`), generatePost / generateImage / generateEdit, JSON parse, retries + model fallbacks.
