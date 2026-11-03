# SyncApp Test Plan — Client & Server

**Scope:** Web client + API server only. **No Expo/mobile layer.**

**Process:** Pyramid + TDD playbook in [`TEST_CASES.md`](./TEST_CASES.md) — Red–Green–Refactor, FIRST, mock **external boundaries only**.

**Out of scope for this pass:** TipTap full editor E2E depth (beyond sample Playwright), live Gemini/GCS/Slack/LinkedIn, Maestro/Jest mobile.

---

## Pyramid mapping

```text
                    ┌─────────────────┐
                    │  Thin E2E (few) │  Playwright — login smoke + editor sample (API mocked)
                    ├─────────────────┤
              ┌─────┴─────────────────┴─────┐
              │  HTTP / integration (fewer) │  Supertest + mongodb-memory-server
              ├─────────────────────────────┤
    ┌─────────┴─────────────────────────────┴─────────┐
    │  Unit / component (many, fast)                  │
    │  Server: Vitest services/utils/schemas          │
    │  Client: Vitest + Testing Library utils/UI      │
    └─────────────────────────────────────────────────┘
```

| Layer | Package | Runner | Role |
| --- | --- | --- | --- |
| Unit | `server` | Vitest | Pure services, encryption, Zod schemas, SEO scorecard |
| Unit / component | `client` | Vitest + RTL | Utils, TipTap toolbar, Mermaid, Recharts, apiClient mocked |
| Integration | `server` | Vitest + Supertest + memory Mongo | Auth, posts, credentials, cron, improve-seo Zod/JWT |
| E2E (thin) | `client` | Playwright | Login smoke + editor create/save sample (kept in repo) |

### Run commands

```bash
cd server && npm test
cd client && npm test
cd client && npm run test:e2e   # optional; requires healthy Next on :3000
```
