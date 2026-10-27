# SyncApp Features

Functional and non-functional requirements as implemented.

## Functional Requirements

| ID | Requirement | Status |
| --- | --- | --- |
| FR1 | User registration, login, JWT auth | Done |
| FR2 | Rich-text/Markdown post authoring | Done |
| FR3 | Draft save, edit, delete | Done |
| FR4 | Multi-platform publish (Medium, DEV.to, WordPress, LinkedIn) | Done |
| FR5 | Publish to all connected platforms | Done |
| FR6 | Connect/disconnect platform credentials | Done |
| FR7 | Manual publish to one or all connected platforms | Done |
| FR8 | Scheduled publishing with cron | Done |
| FR9 | AI generate post, edit, image (Google AI Studio) | Done |
| FR10 | Cover image upload (Direct-to-GCS Presigned V4 PUT URLs) | Done |
| FR11 | Analytics dashboard (publishing counts; engagement roadmap in [`ANALYTICS_PLAN.md`](./ANALYTICS_PLAN.md)) | Done |
| FR12 | Admin user management | Done |
| FR13 | MDX export | Done |
| FR14 | Scheduled-publish notifications (email + Slack) | Done |
| FR15 | AI model picker (curated Gemini list) | Done |
| FR16 | Platform-target AI optimization (DEV.to, LinkedIn, Google SEO) | Done |
| FR17 | Seeded keyword research (Search grounding) → monetization-ready AI draft | Done |
| FR18 | Persisted SEO scorecard (full-body rubric on save; dashboard reads `seo_score`) | Done |
| FR19 | AI SEO improve from scorecard (targeted snippets only; review before apply) | Done |

## Non-Functional Requirements

| ID   | Requirement                | Implementation                                             |
| ---- | -------------------------- | ---------------------------------------------------------- |
| NFR1 | Secure credential storage  | Authenticated AES-256-GCM encryption (`iv:tag:ciphertext`) |
| NFR2 | Role-based access          | `user` / `admin` JWT claims                                |
| NFR3 | Serverless deployment      | Vercel (client + server monorepo)                          |
| NFR4 | Responsive UI              | Tailwind CSS v4, `next/image` auto-optimization            |
| NFR5 | Rate limiting              | Express rate limiter on API                                |
| NFR6 | Error & Request Validation | Central `errorHandler` + Zod `validateBody` middleware     |

## Recent Enhancements

- **Direct-to-GCS Presigned URLs** — Replaced server-side `multer` with signed V4 `PUT` URLs generated via `@google-cloud/storage`, allowing client browsers to upload directly to GCS/Firebase Storage without hitting Vercel's 4.5MB payload ceiling.
- **Authenticated AES-256-GCM Cryptography** — Replaced static-IV AES-256-CBC with `aes-256-gcm` returning packed `${ivHex}:${authTagHex}:${ciphertextHex}` with 12-byte random IVs per record and authentication tag verification.
- **Strict Zod Request & Config Validation** — Input payloads and server environment configuration strictly validated via Zod schemas.
- **Monorepo & Build Orchestration** — Turborepo + npm workspaces (`client`, `server`, `mobile`) for unified script execution and caching.
- **Performance Quick Wins** — Next.js `next/image` integration in `<LazyImage />` with dynamic layout mode selection, alongside Express Gzip `compression`.
- **AI model picker** — Choose Gemini model in Generate Post modal from static allowlist in [`client/src/constants/ai.ts`](../client/src/constants/ai.ts).
- **Platform optimization** — Target DEV.to and/or LinkedIn. Full article goes to the editor; LinkedIn also returns a short summary + Read more URL (`CANONICAL_BASE_URL`), persisted on the post for publish.
- **Keyword research pipeline** — In Generate Post, enter a seed topic → `POST /api/ai/keyword-research` returns scored long-tail opportunities (commercial intent × low competition estimates via Google Search grounding) → pick one → generate a monetization-oriented SEO draft. Scores are AI estimates, not measured volume/KD.
- **Persisted SEO scorecard** — Full-body rubric (metadata / structure / trust) runs on create/update with keyword + platform context; `seo_score` is stored on the post so the dashboard badge/sort match the editor without fetching `content_markdown`. Soft pre-publish warnings only — not a Google ranking predictor.
- **AI SEO improve (targeted)** — Editor “Improve with AI” maps failing/warning scorecard checks to field/snippet targets (`POST /api/ai/improve-seo`), returns proposed fixes for review, and applies only selected snippets (never a silent full-post rewrite). Cover/schema items stay manual.
- **LinkedIn publish** — OAuth connect in Settings + UGC Posts API publishes the summary (not the full article). Wired into Smart Publish, Publish All, and scheduled cron.
- **Production Expo Mobile Content Studio** — Expo SDK 57 cross-platform app targeting iOS 26 (`IOS_DEPLOYMENT_TARGET=26.0`) and Android 16 (API 36). Features a Word/Gutenberg-style mobile editor with dual-mode write canvas, live visual block preview, categorized block insertion drawer, sticky formatting bar, reversible AI Copilot diff review, and authenticated-only multi-platform publishing.

## Out of Scope (Future)

- LinkedIn Company Page posting (member-only today)
- Hashnode/Ghost integration
- Real-time collaborative editing
- Team workspaces
