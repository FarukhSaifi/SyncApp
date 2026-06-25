# SyncApp Features

Functional and non-functional requirements as implemented. See college report Chapter 2 for full analysis.

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
| FR9  | AI outline, draft, edit, image generation          | Done   |
| FR10 | Cover image upload to cloud storage                | Done   |
| FR11 | Analytics dashboard                                | Done   |
| FR12 | Admin user management                              | Done   |
| FR13 | MDX export                                         | Done   |
| FR14 | Scheduled-publish notifications (email + Slack)    | Done   |

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

- **Disconnect** — Remove credentials without replacement API key ([`Settings.tsx`](../client/src/views/Settings.tsx)).
- **Smart publish menu** — Only connected platforms in editor dropdown.
- **Schedule clear on manual publish** — Avoids validation errors from past `scheduled_for`.
- **Cron batch cap** — 10 posts per run, oldest first.

## Out of Scope (Future)

- Hashnode/Ghost integration
- Real-time collaborative editing
- Team workspaces
- Production native mobile app (experimental Expo app in repo)
