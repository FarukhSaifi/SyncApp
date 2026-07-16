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
   - **Model:** `gemini-3.1-flash-lite` (default for SyncApp free tier)
   - **Temperature:** ~0.5–0.6 for articles (app uses `0.55`)
   - **Thinking:** Off / budget `0` on Flash (app disables thinking so JSON fills `maxOutputTokens`)
   - **Output:** JSON schema mode (app sets `responseMimeType: application/json` + schema)
4. Free-tier tips:
   - Prefer **Flash Lite** over Pro (Pro often returns `429` quota)
   - If a model returns `503` high demand, SyncApp auto-falls back to Flash Lite
   - Image models may be unavailable — SyncApp still returns a branded SVG cover

## Local setup

1. Create a key at [AI Studio → API keys](https://aistudio.google.com/apikey).
2. In `server/.env.dev`:

```bash
GEMINI_API_KEY=your_key_here
GOOGLE_AI_MODEL=gemini-3.1-flash-lite
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
| `GOOGLE_AI_MODEL` | Recommended | `gemini-3.1-flash-lite`          |

Then **Redeploy** (env changes do not apply to an already-running deployment).

Do **not** rely on `GOOGLE_CLOUD_PROJECT` / Vertex for AI. Those are optional GCS only.

See [VERCEL_ENV.md](./VERCEL_ENV.md).

## Capabilities

`GET /api/ai/capabilities` → `{ textAi, imageAi, provider: "studio", defaultModel }`.

## Architecture

`server/src/ai/` — Studio client (`studioGenerateContent`), generatePost / generateImage / generateEdit, JSON parse, retries + model fallbacks.
