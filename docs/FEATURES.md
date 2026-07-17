# SyncApp Features

Functional and non-functional requirements as implemented.

## Functional Requirements

| ID   | Requirement                                        | Status |
| ---- | -------------------------------------------------- | ------ |
| FR1  | User registration, login, JWT auth                 | Done   |
| FR2  | Rich-text/Markdown post authoring                  | Done   |
| FR3  | Draft save, edit, delete                           | Done   |
| FR4  | Multi-platform publish (Medium, DEV.to, WordPress) | Done   |
| FR5  | Publish to all connected platforms                 | Done   |
| FR6  | Connect/disconnect platform credentials            | Done   |
| FR7  | Manual publish to one or all connected platforms   | Done   |
| FR8  | Scheduled publishing with cron                     | Done   |
| FR9  | AI generate post, edit, image (Google AI Studio)   | Done   |
| FR10 | Cover image upload to cloud storage                | Done   |
| FR11 | Analytics dashboard                                | Done   |
| FR12 | Admin user management                              | Done   |
| FR13 | MDX export                                         | Done   |
| FR14 | Scheduled-publish notifications (email + Slack)    | Done   |
| FR15 | AI model picker (curated Gemini list)              | Done   |
| FR16 | Platform-target AI optimization (DEV.to, LinkedIn) | Done   |

## Non-Functional Requirements

| ID   | Requirement               | Implementation                    |
| ---- | ------------------------- | --------------------------------- |
| NFR1 | Secure credential storage | AES-256-CBC encryption            |
| NFR2 | Role-based access         | `user` / `admin` JWT claims       |
| NFR3 | Serverless deployment     | Vercel (client + server)          |
| NFR4 | Responsive UI             | Tailwind, mobile-friendly layout  |
| NFR5 | Rate limiting             | Express rate limiter on API       |
| NFR6 | Error handling            | Central `errorHandler` middleware |

## Recent Enhancements

- **AI model picker** — Choose Gemini model in Generate Post modal from static allowlist in [`client/src/constants/ai.ts`](../client/src/constants/ai.ts).
- **Platform optimization** — Target DEV.to and/or LinkedIn. Full article goes to the editor; LinkedIn also returns a short summary + Read more URL (`CANONICAL_BASE_URL`). LinkedIn OAuth publish is Phase 2.
- **Studio-primary AI** — Text + images via `GEMINI_API_KEY` only ([AI Studio](https://aistudio.google.com/apikey)). See [`docs/AI_SETUP.md`](./AI_SETUP.md).
- **Disconnect** — Remove credentials without replacement API key ([`Settings.tsx`](../client/src/views/Settings.tsx)).
- **Smart publish menu** — Only connected platforms in editor dropdown.
- **Schedule clear on manual publish** — Avoids validation errors from past `scheduled_for`.
- **Cron batch cap** — 10 posts per run, oldest first.

## Out of Scope (Future)

- **LinkedIn publish** — OAuth + UGC Posts API (Phase 2; optimization ships in Phase 1)
- Hashnode/Ghost integration
- Real-time collaborative editing
- Team workspaces
- Production native mobile app (experimental Expo app in repo)
