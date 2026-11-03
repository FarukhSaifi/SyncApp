# Google Analytics 4 setup for SyncApp

SyncApp does **not** host your public blog. GA4 and Search Console must be attached to the site behind `CANONICAL_BASE_URL` (e.g. `https://yourblog.example.com/blog`). SyncApp then reads reports via the **GA4 Data API** using a service account.

## What you must do (blog + Google)

### 1. Create a GA4 property for the blog

1. Open [Google Analytics](https://analytics.google.com/) → **Admin** → create a **GA4 property** for your blog domain.
2. Add a **Web** data stream for your public blog origin (e.g. `https://yourblog.example.com`).
3. Copy the **Measurement ID** (`G-XXXXXXXX`).  
   Install it on the **blog** only (gtag.js / GTM / your site’s analytics plugin). **Do not** put this on SyncApp.

### 2. Note the numeric Property ID

In GA4 **Admin → Property settings**, copy the numeric **Property ID** (digits only, e.g. `123456789`).  
This is what SyncApp needs as `GOOGLE_ANALYTICS_PROPERTY_ID` — **not** the `G-` measurement ID.

### 3. Link Search Console (organic queries)

1. Verify the blog domain in [Google Search Console](https://search.google.com/search-console).
2. In GA4 **Admin → Product links → Search Console links**, link the same property.
3. Ensure the sitemap includes post URLs under `CANONICAL_BASE_URL`.

(SyncApp’s first GA4 integration surfaces sessions / pageviews / traffic sources. GSC query import can follow in a later phase.)

### 4. Grant the SyncApp service account access

Use the same Google Cloud service account SyncApp already uses for Vertex/GCS (or a dedicated analytics SA):

1. In GA4 **Admin → Property access management**, add the SA email (e.g. `syncapp-vertex-ai@syncapp-ai.iam.gserviceaccount.com`) with role **Viewer**.
2. Ensure the Google Analytics Data API is enabled on the GCP project:  
   [Enable Analytics Data API](https://console.cloud.google.com/flows/enableapi?apiid=analyticsdata.googleapis.com).

### 5. Set SyncApp server env (no secrets in code)

| Variable | Where | Notes |
| --- | --- | --- |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | `server/.env.dev`, `.env.prod`, Vercel | Numeric property id only (e.g. `123456789`) |
| `GOOGLE_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` | Already used for Vertex/GCS | Must be able to call Analytics Data API |
| `CANONICAL_BASE_URL` / `NEXT_PUBLIC_CANONICAL_BASE_URL` | Server + client | Public blog base. LinkedIn Read more UTMs (`utm_source=linkedin`, etc.) are appended in app code — **no UTM env vars**. |

Restart the server after changing env. Until these are set, `GET /api/analytics/website` returns `configured: false` and the dashboard shows setup guidance.

## Verify

1. Publish a post and open the blog URL with UTMs (LinkedIn Read more already adds `utm_source=linkedin&utm_medium=social&utm_campaign=syncapp`).
2. In GA4 **Realtime**, confirm hits.
3. In SyncApp **Analytics**, open the page (or wait ~24h for standard reports) and click refresh — traffic sources should populate when the property has data.

## Related

- [`ANALYTICS_PLAN.md`](./ANALYTICS_PLAN.md) — phased roadmap
- [`VERCEL_ENV.md`](./VERCEL_ENV.md) — deployment env vars
- [`AI_SETUP.md`](./AI_SETUP.md) — service account / ADC for Google APIs
