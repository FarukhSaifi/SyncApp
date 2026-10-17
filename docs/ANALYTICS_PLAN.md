# SyncApp Cross-Platform Analytics Plan

| Field | Value |
| --- | --- |
| **Status** | **Complete** (plan-only research — no SyncApp code changes required by this doc) |
| **Last updated** | 2026-10-17 |
| **Scope** | Views, clicks, and engagement for SyncApp-published posts across **LinkedIn**, **Google organic**, and the **public blog** |
| **Out of scope here** | Implementation PRs, Google Ads for organic goals, scraping LinkedIn UI |

**Blog host note:** Live env/docs use `farukh.me` via `CANONICAL_BASE_URL`. Treat **faroo.me** (or any other public blog) the same: SyncApp stays the editor/syndication app; GA4 + Search Console attach to the **canonical blog domain**, not to SyncApp.

---

## Current state (what SyncApp already has)

| Area | What exists | What it does **not** do |
| --- | --- | --- |
| **In-app Analytics** | `GET /api/analytics/stats` → [`analyticsService.ts`](../server/src/services/analyticsService.ts); UI [`Analytics.tsx`](../client/src/views/Analytics.tsx) + mobile tab | Counts **posts you authored** (totals, drafts, publish rate), **how many posts are marked published per platform**, and **30-day create/publish activity**. No pageviews, clicks, likes, or search impressions. |
| **Post model** | `platform_status.{medium,devto,wordpress,linkedin}` with `published`, `post_id`, `url`, `published_at` ([`Post.ts`](../server/src/models/Post.ts)) | IDs/URLs are enough to _later_ poll remote APIs; SyncApp does not poll engagement today. |
| **Canonical / blog** | `CANONICAL_BASE_URL` / `NEXT_PUBLIC_CANONICAL_BASE_URL` for LinkedIn “Read more” + post canonicals ([`VERCEL_ENV.md`](./VERCEL_ENV.md)) | SyncApp itself is **noindex** and does not host public post HTML for Google; organic traffic lives on the **external blog**, not on SyncApp URLs. |
| **Google Analytics / GTM / Search Console / Ads** | **None** in client or server env/docs | No GA property ID, no GSC OAuth, no Ads conversion tracking. |

**Bottom line:** “Analytics” in SyncApp today is an **authoring/publishing dashboard**, not a cross-platform engagement product.

---

## 1) Analytics available via existing integrations

### DEV.to

| Metric | Available? | How |
| --- | --- | --- |
| Article page views | Yes (API) | Authenticated Forem/DEV API can return article stats (e.g. page views) for articles you own when you have the article id — SyncApp already stores `platform_status.devto.post_id` / `url` after publish. |
| Reactions / comments | Partially | Same article endpoints often expose reaction counts / comments; exact fields depend on API version — verify against current Forem docs when implementing. |
| Click-through to canonical | No native | DEV shows the article on DEV; outbound clicks to `canonical_url` are not a first-class SyncApp metric unless measured on the **blog** (GA4) with UTM or referrer. |

**Fit for SyncApp:** High — credentials already stored; `post_id` already saved. Best Phase-1 “real engagement” source.

### LinkedIn

| Metric | Available? | How / caveats |
| --- | --- | --- |
| Member post impressions, clicks, reactions, comments, shares | Limited | LinkedIn’s rich **organic share statistics** APIs historically target **organization (Company Page)** posts and Marketing Developer Platform products with restricted access. SyncApp today posts as a **member** via UGC (`w_member_social`) and stores `platform_status.linkedin.post_id`. |
| Member-level organic analytics | Unreliable / restricted | Personal-profile organic analytics are often **UI-only** (Creator Mode / post analytics in LinkedIn app) and not fully exposed to third-party apps with the scopes SyncApp uses today. |
| Company Page analytics | Better API path | Would require Company Page posting + org admin + Marketing API / Community Management access — listed as out of scope in [`FEATURES.md`](./FEATURES.md). |

**Fit for SyncApp:** Medium-long term. Short term: store share URN reliably, link out to LinkedIn’s native analytics, and measure **blog landings from LinkedIn** via GA4 (`utm_source=linkedin` on Read more URLs). Full in-app LinkedIn engagement needs product/API access review (and likely Company Pages).

### Medium / WordPress

| Platform | Engagement via API |
| --- | --- |
| Medium | Limited public stats for third-party apps; often manual/export. Lower priority. |
| WordPress | Possible if self-hosted Jetpack/stats or WP.com stats APIs with site token; depends on how users connect WP. Defer until DEV.to + blog path are solid. |

### Google (organic) — not an existing SyncApp integration

There is **no** Google Analytics, Tag Manager, Search Console, or Ads wiring in the repo. Organic search performance for posts exists only if the **public blog** (e.g. farukh.me / faroo.me) implements GA4/GSC itself.

### SyncApp client

Intentionally **not** the place to measure “blog ranking” traffic: SyncApp is the editor/syndication app and is treated as **noindex** / non-canonical for Google; organic ranking and blog pageviews belong on the public site only.

---

## 2) Google Ads vs Search Console vs Analytics

| Product | Useful for this goal? | Role |
| --- | --- | --- |
| **Google Analytics 4 (GA4)** on the **public blog** | **Yes — primary** | Pageviews, sessions, engagement time, outbound/inbound events, traffic by source/medium (LinkedIn, DEV, Google organic), per-URL (slug) breakdown. Required for “clicks onto faroo.me / farukh.me from social.” |
| **Google Search Console (GSC)** for the **blog domain** | **Yes — primary for SEO** | Queries, impressions, clicks, CTR, average position per page/query. This is how you see **Google organic** performance for each post URL. Not available inside SyncApp without GSC API + verified property. |
| **Google Ads** | **No for organic tracking** | Ads measures paid campaigns and conversions. It does **not** replace GSC/GA4 for organic views/clicks. Only add Ads if you later run paid promotion of posts and need conversion attribution. |
| **Google Ads + GSC linking** | Optional later | Helpful for paid + organic keyword comparison; irrelevant until you advertise. |

**Recommendation:** Do **not** build Google Ads into SyncApp for this roadmap. Do plan **GA4 + Search Console on the blog domain**, then optionally sync selected metrics into SyncApp via APIs (or Looker Studio embeds) so authors see organic + social in one place.

**UTM convention (blog + LinkedIn Read more):**  
When SyncApp appends or builds Read more URLs, standardize:

`?utm_source=linkedin&utm_medium=social&utm_campaign=syncapp&utm_content={slug}`

(and similar for `devto`, `medium`, `wordpress`). That makes GA4 source attribution reliable even when platform APIs lack click metrics.

---

## 3) Unified dashboard — what to collect and how

### Target metrics (product definition)

| Layer | Metrics | Source of truth |
| --- | --- | --- |
| **Publishing ops** (already mostly there) | Posts created, published, drafts, per-platform publish counts, schedule success | MongoDB / SyncApp |
| **Platform engagement** | Views, reactions, comments, shares (where API allows) | DEV.to API → later LinkedIn (if permitted) / WP |
| **Owned site** | Pageviews, engaged sessions, scroll, CTA clicks | GA4 on blog |
| **Organic search** | Impressions, clicks, CTR, position by page & query | Search Console |
| **Cross-channel** | “Published on X → landed on blog” | GA4 source/medium + UTMs |

### Architecture options

| Approach | Pros | Cons | Recommendation |
| --- | --- | --- | --- |
| **A. SyncApp polls APIs + stores snapshots** | Single UI in SyncApp; per-post history | Cron/jobs, token refresh, rate limits, schema growth | **Phase 1–2** for DEV.to (+ later LinkedIn if feasible) |
| **B. GA4 Data API + GSC API into SyncApp** | True organic + site metrics next to posts | OAuth per user or service account; property must be the **blog** | **Phase 2–3** |
| **C. Embed Looker Studio / GA UI** | Fastest “unified” view with zero custom ETL | Leaves SyncApp; weaker per-post mapping | Optional bridge while building A/B |
| **D. Client-only pixels in SyncApp** | Easy | Wrong property (SyncApp ≠ blog); no Google ranking signal | **Avoid** |

**Suggested data model (future):**

- `PostAnalyticsSnapshot` (or nested `analytics` on Post): `{ platform, asOf, views, likes, comments, shares, clicks?, raw? }`
- `BlogAnalyticsSnapshot`: `{ slug/path, date, pageviews, sessions, organicClicks?, organicImpressions? }`
- Join key: **slug / canonical path** (already central to SyncApp) + platform `post_id`.

**Jobs:** Vercel Cron (already used for scheduled publish) to refresh snapshots daily (or on-demand “Refresh stats” on post/Analytics page).

---

## 4) Phased implementation plan

### Phase 0 — Foundations (1–2 days, mostly config)

1. Confirm blog host (faroo.me / farukh.me) and that `CANONICAL_BASE_URL` matches live post URLs.
2. Install **GA4** on the blog (not SyncApp); define events: `page_view`, optional `cta_click`.
3. Verify domain in **Search Console**; ensure sitemap includes post URLs.
4. Document UTM rules for SyncApp Read more / publish URLs (implement in a later small PR).
5. Audit stored `platform_status.*.post_id` / `url` completeness for existing posts.

**UI:** None in SyncApp yet — health checklist in docs/settings copy.

### Phase 1 — Real engagement for DEV.to + richer SyncApp Analytics (1–2 weeks)

**Collect per platform:**

| Platform | Fields to pull | Storage |
| --- | --- | --- |
| DEV.to | `page_views_count` (or equivalent), public reactions, comments count | Snapshot by `post_id` / SyncApp `Post._id` |
| SyncApp | Keep existing summary charts | As today |

**Build:**

- Server: `GET /api/analytics/engagement` or extend `/stats` with optional `?include=devto`.
- Job or on-demand refresh using stored DEV credentials.
- UI: Analytics page cards — **Total DEV views**, top posts by views; per-post row on Dashboard/Editor optional “Views”.

**UI sketch:**

```
[ Summary: posts / published / drafts ]   ← existing
[ DEV.to views (7d / all) ] [ Top articles table: title | views | reactions | link ]
[ Activity chart ]                        ← existing
```

### Phase 2 — Owned-site + Google organic into the dashboard (2–4 weeks)

**Collect:**

| Source | Per post / path | Notes |
| --- | --- | --- |
| GA4 Data API | pageviews, users, avg engagement for `/blog/{slug}` (or site path pattern) | OAuth or service account on **blog** GA4 property |
| GSC Search Analytics API | clicks, impressions, CTR, position for same URLs | Site verification required |

**Build:**

- Settings: “Connect Google (blog analytics)” — store refresh token encrypted like other credentials.
- Map GA/GSC rows → SyncApp posts via `canonical_url` / slug.
- Analytics UI tabs: **Publishing** | **Engagement (platforms)** | **Website & SEO**.

**UI sketch:**

```
Website & SEO
  [ Organic clicks | Impressions | Avg position ]
  [ Table: post | organic clicks | pageviews | LinkedIn referrals (GA) ]
  [ Optional: top queries for selected post ]
```

**Google Ads:** still out of scope unless marketing asks for paid campaigns.

### Phase 3 — LinkedIn depth + unification polish (ongoing)

1. Product decision: stay on member posts (link-out to LinkedIn analytics) **or** invest in Company Page + Marketing API.
2. If API access approved: poll organization share stats; store alongside DEV snapshots.
3. Unified “Post performance” detail page: one SyncApp post → columns for DEV / LinkedIn / Blog / Google organic.
4. Alerts: e.g. “Published 48h ago, 0 blog landings” (GA4) or “DEV views spiked”.

### Phase 4 — Optional

- Medium/WordPress stats if APIs prove worth it.
- Looker Studio embed for power users.
- Export CSV of snapshots.
- Mobile Analytics tab parity with new metrics.

---

## Priority matrix

| Priority | Work | Why |
| --- | --- | --- |
| P0 | GA4 + GSC on **blog**; UTMs on Read more | Unlocks Google + site clicks without SyncApp code |
| P1 | DEV.to stats sync into SyncApp | Credentials + `post_id` already exist; clear API path |
| P2 | GA4/GSC API → SyncApp dashboard | Meets “faroo.me + Google” in-product |
| P3 | LinkedIn API engagement | Highest uncertainty / access friction |
| Skip (for organic goals) | Google Ads integration | Wrong tool for organic views/clicks |

---

## Risks and constraints

- **SyncApp ≠ indexed blog** — organic metrics always belong to the public site domain.
- **LinkedIn API access** may block in-app engagement forever for member posts; plan a graceful “Open in LinkedIn” fallback.
- **Privacy / ToS** — store only aggregated metrics; don’t scrape LinkedIn UI.
- **Rate limits** — prefer daily snapshots over per-page-load polling.
- **Multi-tenant** — each SyncApp user may need their own DEV token (done) and later their own GA/GSC property if SyncApp is multi-author SaaS; for a single blog owner, one shared GA/GSC connection is enough.

---

## Success criteria

1. Author can see **DEV.to views** for SyncApp-published articles without leaving the app.
2. Author can see **blog pageviews** and **Google organic clicks** for the same slugs (via GA4/GSC, in-app or linked).
3. LinkedIn contribution is measurable at least as **referral traffic to the blog** (UTM + GA4), with native LinkedIn engagement when/if API allows.
4. Existing publishing analytics remain available and accurate.

---

## Open decisions (product — not blocking this plan)

These are choices for when implementation starts; the plan already recommends a default for each:

| Decision | Default in this plan | Alternative |
| --- | --- | --- |
| LinkedIn strategy | UTM + GA4 referrals + “Open in LinkedIn” for native stats | Company Page + Marketing API for in-app impressions |
| GA/GSC into SyncApp | Phase 2 API sync mapped by slug/canonical | Looker Studio embed only (Phase C bridge) |
| Multi-author GA | One shared blog property for single-owner blog | Per-user OAuth if SyncApp becomes multi-tenant SaaS |
| Blog domain | Whatever `CANONICAL_BASE_URL` points at (`farukh.me` today; `faroo.me` if switched) | — |

---

## Planned env / settings (names only — implement later)

Document here so implementation does not invent keys ad hoc. **Do not add these until a build PR lands**; mirror into `*.example` + [`VERCEL_ENV.md`](./VERCEL_ENV.md) at that time.

| Key / setting                                    | Phase | Purpose                             |
| ------------------------------------------------ | ----- | ----------------------------------- |
| Blog GA4 measurement ID (blog site, not SyncApp) | 0     | Client tag on public blog           |
| `GA4_PROPERTY_ID` (server)                       | 2     | GA4 Data API property for sync      |
| Google OAuth client for GA4/GSC (or SA JSON)     | 2     | Encrypted like other credentials    |
| GSC site URL (`sc-domain:…` or `https://…`)      | 2     | Search Analytics API                |
| UTM helpers in LinkedIn Read more builder        | 0–1   | Code change in SyncApp URL builders |

---

## Next actions after this plan

1. **Ops (no SyncApp PR):** Confirm blog domain ↔ `CANONICAL_BASE_URL`; install GA4 + verify GSC on that domain.
2. **Small SyncApp PR (Phase 0–1 prep):** Standardize UTM query params on LinkedIn Read more / publish outbound URLs.
3. **Phase 1 PR:** DEV.to engagement poll + Analytics UI cards (highest ROI given existing credentials + `post_id`).
4. **Phase 2 PR:** GA4 Data API + GSC → SyncApp “Website & SEO” tab.
5. **Phase 3:** Revisit LinkedIn API access; until then keep referral + deep-link fallback.

Nothing further is required to close the **research/plan** job.

---

## References (in-repo)

- [`server/src/services/analyticsService.ts`](../server/src/services/analyticsService.ts)
- [`client/src/views/Analytics.tsx`](../client/src/views/Analytics.tsx)
- [`docs/FEATURES.md`](./FEATURES.md) (FR11 Analytics dashboard — publishing counts today)
- [`docs/VERCEL_ENV.md`](./VERCEL_ENV.md) (`CANONICAL_BASE_URL`)
- [`docs/SYSTEM_FLOWS.md`](./SYSTEM_FLOWS.md) (LinkedIn Read more / canonical)
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) (ownership boundaries)

## External references (verify at implement time)

- [Forem / DEV.to API](https://developers.forem.com/api) — article stats for owned posts
- [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1) — blog page metrics
- [Search Console API](https://developers.google.com/webmaster-tools) — organic queries / CTR / position
- [LinkedIn Marketing / Community Management APIs](https://learn.microsoft.com/en-us/linkedin/) — org share stats (access-gated; not used by SyncApp member UGC today)
