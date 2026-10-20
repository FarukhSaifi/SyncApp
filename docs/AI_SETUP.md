# AI setup — Vertex AI (primary) + Google AI Studio (fallback)

SyncApp AI uses [`@google/genai`](https://www.npmjs.com/package/@google/genai).

| Priority | Backend | Auth | Used for |
| --- | --- | --- | --- |
| **1 (preferred)** | **Vertex AI** on GCP project `syncapp-ai` | ADC (`authorized_user`) or SA JSON | Text, trending topics, Gemini image generation |
| 2 (fallback) | Google AI Studio | `GEMINI_API_KEY` | Same features only if Vertex is not configured |
| Separate | **GCS / Firebase Storage** | SA JSON or ADC with Storage roles | Cover image uploads (not model inference) |

**Do not top up Google AI Studio billing** when Studio returns `402` (prepayment credits depleted). Use Vertex AI instead.

Imagen model IDs are **not** used. On Vertex, Imagen endpoints are deprecated as of **2026-06-30**; SyncApp uses Gemini image models only (`gemini-3.1-flash-image`, then fallbacks).

## Current local auth (working)

Org policy `constraints/iam.disableServiceAccountKeyCreation` blocks downloading JSON keys for service accounts on `syncapp-ai`. Local development therefore uses **Application Default Credentials (ADC)**:

| Item | Value |
| --- | --- |
| Project | `syncapp-ai` |
| Service account (IAM roles) | `syncapp-vertex-ai@syncapp-ai.iam.gserviceaccount.com` (`roles/aiplatform.user`, `roles/storage.objectAdmin`) |
| Local ADC file | `~/.config/gcloud/application_default_credentials.json` (`type: authorized_user`, gitignored) |
| Env | `GOOGLE_CLOUD_PROJECT=syncapp-ai`, `GOOGLE_CLOUD_LOCATION=us-central1`, `GOOGLE_APPLICATION_CREDENTIALS` pointing at the ADC file (or omit and rely on the default ADC path) |

The server prefers Vertex when `GOOGLE_CLOUD_PROJECT` is set and credentials are available (SA JSON **or** ADC). `getAiClient()` passes explicit SA fields only for service-account JSON; otherwise it uses the ADC chain (`new GoogleGenAI({ vertexai: true, project, location })`).

### Refresh local ADC

```bash
# If gcloud is installed:
gcloud auth application-default login --project=syncapp-ai

# Ensure your Google user has roles/aiplatform.user on syncapp-ai
# (or can use the syncapp-vertex-ai SA via Token Creator / WIF — see below)
```

Point `server/.env.dev` at the ADC file if needed:

```bash
GOOGLE_CLOUD_PROJECT=syncapp-ai
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/Users/YOU/.config/gcloud/application_default_credentials.json
GOOGLE_AI_MODEL=gemini-3.8-flash
```

Confirm: `GET /health` → `ai.provider: "vertex"`, `ai.configured: true`.

## Vertex AI API

Enable **Vertex AI API** (`aiplatform.googleapis.com`) on **syncapp-ai** (billing required on the GCP project):

[Enable Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com&project=syncapp-ai)

## Service-account JSON keys (blocked today)

SA `syncapp-vertex-ai@syncapp-ai.iam.gserviceaccount.com` exists with Vertex + Storage roles, but **key creation fails** with:

`FAILED_PRECONDITION` / `constraints/iam.disableServiceAccountKeyCreation`

To allow keys (optional, org-admin):

1. GCP Console → **Organization policies** → `Disable service account key creation`
2. Override for project `syncapp-ai` (or the org) to **Not enforced**
3. Create a key for `syncapp-vertex-ai@…` and set `GOOGLE_CREDENTIALS_JSON` (Vercel) or `GOOGLE_APPLICATION_CREDENTIALS` (local file)

Until then, use ADC locally and see production options below.

## Production (Vercel — `sync-app-server`)

| Variable | Required | Notes |
| --- | --- | --- |
| `GOOGLE_CLOUD_PROJECT` | **Yes** | `syncapp-ai` |
| `GOOGLE_CLOUD_LOCATION` | Recommended | `us-central1` (or `global` for some Gemini 3.x publisher models) |
| `GOOGLE_CREDENTIALS_JSON` | Preferred when policy allows | SA JSON string (also used for GCS + GA4 Data API) |
| `GCS_BUCKET_NAME` | Recommended | Cover uploads (default bucket name in code: `syncapp-ai-covers`) |
| `GCS_SIGNING_SERVICE_ACCOUNT` | Optional | Override SA email for V4 signed URL impersonation when using user ADC locally |
| `GOOGLE_AI_MODEL` | Recommended | `gemini-3.8-flash` |
| `GEMINI_API_KEY` | Optional | Studio fallback only — do not top up Studio |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | Optional | Numeric GA4 property id — see [GA4_SETUP.md](./GA4_SETUP.md) |

User ADC does **not** work on Vercel. Until SA keys or WIF are available, production AI needs either a policy exception for SA keys or Workload Identity Federation (next section).

**Dashboard:** [vercel.com](https://vercel.com) → **sync-app-server** → Settings → Environment Variables → Redeploy.

## Workload Identity Federation (optional next step)

WIF lets Vercel (or other OIDC issuers) impersonate `syncapp-vertex-ai@syncapp-ai.iam.gserviceaccount.com` **without** a JSON key.

High-level steps (when ready):

1. Enable `iamcredentials.googleapis.com` and `sts.googleapis.com` on `syncapp-ai`.
2. Create a workload identity pool (e.g. `syncapp-pool`) and an OIDC provider (e.g. Vercel OIDC issuer).
3. Bind `principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/syncapp-pool/*` to the SA with `roles/iam.workloadIdentityUser`.
4. Deploy an **external_account** credential config (not a private key; may be gitignored as `server/google-wif-credentials.json`) and set `GOOGLE_APPLICATION_CREDENTIALS` to that file, **or** inject the config via env for serverless.

Local ADC remains the supported path until WIF is fully wired for Vercel.

## Models

| Use | Primary | Fallbacks |
| --- | --- | --- |
| Blog / edit / LinkedIn / trending | `gemini-3.8-flash` | `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-3.1-flash-lite`, … |
| Featured image | `gemini-3.1-flash-image` | `gemini-2.5-flash-image`, other Gemini `*-image` ids (no Imagen) |

Flash thinking budget is `0` so `maxOutputTokens` go to visible JSON/text. Curated picker: `AI_CONTENT_MODELS` in `server/src/constants/ai.ts`.

## Studio fallback (optional)

Only when Vertex project + credentials are **not** set:

```bash
GEMINI_API_KEY=your_key_here
GOOGLE_AI_MODEL=gemini-3.8-flash
```

If Studio returns credits depleted (`402`), configure Vertex — **do not** top up AI Studio.

## Capabilities & health

- `GET /api/ai/capabilities` → `{ textAi, imageAi, provider: "vertex"|"studio"|"none", defaultModel, project?, location? }`
- `GET /health` → `ai.configured`, `ai.provider`, `ai.model`, optional `ai.project` / `ai.location`

## Architecture

`server/src/ai/` — unified client (`generateAiContent` / `getAiClient`), generatePost / generateImage / generateEdit / generateLinkedInSummary / generateKeywordResearch / trending topics. Credentials helper: `server/src/utils/googleCredentials.ts`. Constants: `server/src/constants/ai.ts`.

### Keyword research (seed → scored long-tail)

`POST /api/ai/keyword-research` with `{ seed }` uses Google Search grounding (plus autocomplete seeds) to return ~10 long-tail keywords ranked by estimated opportunity (high commercial intent × low competition). Each item includes `commercialIntent`, `competition`, `opportunityScore`, `intentLabel`, `monetizationAngle`, and `rationale`. **These scores are AI estimates from Search grounding — not measured search volume or keyword difficulty from SEO tools.** Selecting a keyword in the Generate Post modal passes optional `researchContext` into `POST /api/ai/generate` so the draft targets that monetization angle.

### Blog generation prompts

Static prompt text lives in `AI_PROMPTS` (`server/src/constants/ai.ts`). Full-post generation uses `FULL_POST_SYSTEM_BASE` + `buildFullPostSystemPrompt()` (platform blocks + optional monetization research block). The base body requires:

- **Human / anti AI-detection:** varied sentence and paragraph rhythm, personal-touch phrasing, natural transitions, concrete examples, lists only when useful, banned AI clichés
- **Anti-spam:** no keyword stuffing, natural density, no hidden/deceptive text, no doorway-page patterns, honest meta
- **SEO E-E-A-T + conciseness:** searchable structure without fluff

See also [VERCEL_ENV.md](./VERCEL_ENV.md).
