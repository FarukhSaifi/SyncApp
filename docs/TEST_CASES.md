# SyncApp Test Cases & TDD Playbook

Catalog of behavior-driven test cases for the monorepo (`client`, `server`, `mobile`), plus the TDD approach SyncApp will use for all future work.

**Automated today:** `server/src/services/seoScoreService.test.ts` (`npm test` in `server/`, via `tsx --test`). Everything else is the backlog.

---

## Research summary — TDD best practices

Sources consulted: Kent Beck–style Red–Green–Refactor; FIRST (Ottinger/Schuchert); Martin Fowler / Mike Cohn **Test Pyramid**; JavaScript unit-testing practice guides (2024–2026); tidy-first / small-slice TDD guidelines.

### What “best approach” means for SyncApp

| Practice | Decision for SyncApp |
| --- | --- |
| **Cycle** | Strict **Red → Green → Refactor**. One failing behavior test at a time; minimal code to pass; then improve design with tests still green. |
| **FIRST** | Tests must be **F**ast, **I**solated, **R**epeatable, **S**elf-validating, **T**imely (written with the behavior, preferably before). |
| **Pyramid** | Many **unit** tests (services, utils, scorecard, SEO improve apply) → fewer **API/integration** tests (routes + Zod + auth) → thin **UI/E2E** smoke for critical journeys. Avoid an “ice-cream cone” of UI-only tests. |
| **Mocks** | Mock only **external boundaries** (Gemini/Vertex, GCS, Slack, Resend, LinkedIn/Medium/DEV APIs). Prefer state assertions on real domain logic. |
| **Naming** | Observable behavior in plain English. Prefer `it("returns … when …")` / `it("rejects … when …")` over vague `should work`. Suites name the unit under test (`describe("getSeoScorecard", …)`). |
| **Structure** | Arrange–Act–Assert (or Given–When–Then) inside each test. One primary behavior per test. Parameterize shared input matrices. |
| **Tidy First** | Do not mix structural refactors with behavior changes in the same commit when avoidable. Tidy under green tests, then add the next red test. |
| **Bug fix rule** | If a high-level/E2E test finds a bug, **first** add a failing unit (or API) test that reproduces it, then fix — so the bug stays dead. |
| **Feedback** | Keep the default unit suite fast enough to run on every change. Put slow/network tests behind explicit scripts or tags later. |

### Coverage priorities (when writing or automating)

| Priority | Focus | Examples |
| --- | --- | --- |
| **P0** | Money / trust / data integrity / auth | Auth JWT, credential encryption, publish partial-failure, SEO score persistence, improve-seo no auto-apply |
| **P1** | Core authoring & list UX | Posts CRUD, pagination/search, editor save, scorecard checks, schedule cron outcomes |
| **P2** | Nice-to-have / polish / optional integrations | Theme toggle, analytics empty charts, Slack/email when env unset, mobile polish |

Always cover for each behavior slice: **happy**, **negative/validation**, **empty/null**, and **failure** where an external call exists.

### How tests drive future development

1. **Spec first** — Pick the smallest user-visible or API-visible behavior from this catalog (or add a new ID). Write the failing test with the naming convention below.
2. **Implement** — Only enough production code to go green.
3. **Refactor** — Deduplicate, move magic values to constants, keep names aligned with `@constants`.
4. **Trace** — Link PR description to case IDs (`SEO-07`, `IMP-08`, …).
5. **Do not ship** a new feature without P0/P1 cases for its acceptance criteria automated or explicitly waived with reason.

### SyncApp naming & file conventions

```text
# Unit (preferred first)
server/src/services/<name>.test.ts
server/src/ai/<name>.test.ts
client/src/utils/<name>.test.ts

# Suggested describe/it style (node:test or Vitest-compatible)
describe("getSeoScorecard", () => {
  it("scores an empty post low without body (rescaled metadata-only path)", () => { … });
  it("rejects … when …", () => { … });
});
```

| Pattern             | Example                                                     |
| ------------------- | ----------------------------------------------------------- |
| Outcome + condition | `persists seo_score when post is saved with body`           |
| Reject + condition  | `rejects improve-seo when targets array is empty`           |
| UI behavior         | `keeps portal tooltip open while pointer is over the panel` |

Avoid: `works`, `test1`, `should correctly handle stuff`.

### Suggested Given–When–Then sketch (for each case)

Use this when writing the actual test file:

```text
Given <precondition / fixture>
When  <action under test>
Then  <observable result / status / state>
```

---

## Per-layer testing stack (research → SyncApp recommendation)

Research basis: [Next.js Testing guides](https://nextjs.org/docs/app/guides/testing) (Vitest + Playwright), Express + Vitest/Supertest + in-memory Mongo patterns, [Expo unit testing](https://docs.expo.dev/develop/unit-testing/) (`jest-expo` + Jest 30 on SDK 58), Expo Router testing library, Maestro on EAS for mobile E2E. Aligned with the TDD playbook above (pyramid, FIRST, mock boundaries only).

**Today:** only `server` `tsx --test` for SEO. Prefer standardizing runners as below when the suite grows (optional: keep SEO on `node:test` until a Vitest migration, or move everything to Vitest for one DX).

### 1. Frontend — Next.js 16 / React 19 / TypeScript / Tailwind (`client/`)

| Concern | Recommendation |
| --- | --- |
| **Unit / component runner** | **Vitest** + **jsdom** (official Next.js Vitest guide). Prefer Vitest over Jest here for speed and ESM/TS fit with the monorepo. |
| **Component queries** | **@testing-library/react** + **@testing-library/user-event** + **@testing-library/jest-dom** matchers. Query by role/label/text (user-visible), not CSS classes or Tailwind internals. |
| **E2E** | **Playwright** against a production `next build` + `next start` (`webServer` in config). Thin smoke only (login → dashboard → open editor). |
| **Structure** | Colocate `*.test.ts(x)` under `client/src/utils`, `hooks`, `components`. Keep App Router `page.tsx` thin; test views/hooks/utils first. |
| **TDD priority** | **P0/P1:** `seoScorecard`, `seoImproveTargets`, Tooltip portal hover, SeoImproveReviewModal (no auto-apply), apiClient error mapping, data-table pagination utils. **Defer:** full TipTap editor (brittle) — cover via small pure helpers + one Playwright smoke. |
| **Gotchas** | Vitest does **not** fully support **async Server Components** — use Playwright for those. Don’t assert on Tailwind class strings. Mock `apiClient` / network at the boundary, not every React context. Prefer `userEvent` over `fireEvent`. Snapshot only tiny presentational bits (badge/ring), never whole pages. |

**Scripts (target):** `client`: `test` (Vitest watch/run), `test:e2e` (Playwright).

### 2. Backend — Express 5 / Node / REST JSON / JWT / Zod / Mongoose (`server/`)

| Concern | Recommendation |
| --- | --- |
| **Unit runner** | **Vitest** (or keep **`tsx --test` / node:test** for pure services already started — migrate to Vitest when adding HTTP tests for one runner). |
| **HTTP / integration** | **Supertest** against the Express `app` **without** calling `listen` in the import path. Export `app` from a module that does not auto-connect production Mongo / start cron. |
| **Database** | Prefer **mongodb-memory-server** for API integration (real Mongoose behavior). For pure service unit tests, inject repos or mock at the service boundary; avoid overusing model mocks when in-memory DB is cheap. |
| **Externals** | `vi.mock` / stubs for `@google/genai`, GCS, Resend, Slack, Medium/DEV/LinkedIn HTTP. Never hit live AI/billing in CI. |
| **Structure** | `*.test.ts` next to services (`seoScoreService.test.ts` pattern), `src/ai/*.test.ts`, `src/routes/*.test.ts` or `src/__tests__/api/*.test.ts` for Supertest suites. |
| **TDD priority** | **P0:** Zod schemas, auth JWT, credential encrypt/decrypt, posts ownership, improve-seo validation, publish partial-failure, cron auth secret. **P1:** schedule outcomes, pagination/filter/sort. |
| **Gotchas** | Importing `index.ts` that connects DB + listens breaks isolation — split **createApp** vs **bootstrap**. Global mongoose cache (`global.mongooseCache`) must reset between suites. Rate limiter / Helmet can affect tests — disable or raise limits in `APP_ENV=test`. Vercel `api/index.ts` serverless entry is not the unit under test; test the Express app. Assert `{ success, data\|error }` envelope. |

**Scripts (target):** `server`: `test` (unit), `test:api` (Supertest + memory Mongo), keep AI/publish mocks default-on.

### 3. Mobile — Expo ~58 / React Native / Expo Router (`mobile/`)

| Concern | Recommendation |
| --- | --- |
| **Unit / component runner** | **Jest 30** + **jest-expo** (required on SDK 58). Do **not** reuse client Vitest config for RN. |
| **Component queries** | **@testing-library/react-native** v14+ + **user-event**. For navigation: **`expo-router/testing-library`**. |
| **File placement** | **Never** put tests under `app/` (Expo Router treats files as routes). Use `mobile/src/**/*.test.tsx` or `mobile/__tests__/`. |
| **E2E** | **Maestro** YAML flows on **EAS** simulator/device builds (Expo’s recommended path). Reserve **Detox** only if gray-box sync is required for gesture-heavy flows. |
| **Structure** | Unit: pure hooks/utils (`useEditorState` persistence boundary). Component: screens with mocked API client. E2E: login + editor save + publish gating smoke. |
| **TDD priority** | **P0:** auth session storage, credential-gated publish targets, AI Copilot **review-before-apply**, `useEditorState` save boundary. **P1:** block insert / formatting. |
| **Gotchas** | Mock at **API client** boundary, not every `expo-*` module with empty objects (false greens). `transformIgnorePatterns` often needs updates for new native deps. Prefer role/label over `testID`-only. Async: `findBy` / `waitFor`. Expo Go ≠ store binary — run Maestro against EAS artifacts. No lint script today — don’t invent one for unrelated PRs; add `test` script when Jest is wired. |

**Scripts (target):** `mobile`: `test` (Jest), Maestro via EAS Workflow / local Maestro CLI for smoke.

### Cross-layer contract & monorepo

| Practice | SyncApp fit |
| --- | --- |
| **Shared API shape** | Assert REST envelope + Zod on server; optionally reuse or mirror critical response schemas in client/mobile contract tests (P1). |
| **Turbo** | `turbo run test` once each package has a `test` script; keep unit fast on every PR; gate Playwright/Maestro on label or main. |
| **TDD loop** | New feature: write **server unit/API** red test → implement → then client util/component red test → thin E2E last. Mobile follows after web API is stable. |
| **Bug from E2E** | Reproduce with unit/API test first (playbook bug-fix rule), then fix. |

### Decision summary

| Layer | Unit | Component | Integration / API | E2E |
| --- | --- | --- | --- | --- |
| **client** | Vitest | Vitest + Testing Library | Mocked `apiClient` in component tests | Playwright (thin) |
| **server** | Vitest or node:test | — | Supertest + mongodb-memory-server | Optional Playwright hitting local API |
| **mobile** | Jest + jest-expo | RNTL + expo-router/testing-library | Mocked API client | Maestro on EAS |

---

## Legend

| Column             | Meaning                                         |
| ------------------ | ----------------------------------------------- |
| **Pri**            | P0 / P1 / P2 (see above)                        |
| **H/N/E/F/P**      | Happy / Negative / Empty / Failure / Permission |
| **Layer**          | Unit · API · UI · E2E                           |
| **Suggested name** | Preferred `it("…")` string when automating      |

---

## 1. Authentication & session

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| AUTH-01 | P0 | Valid register returns JWT + user | H | API | `creates user and returns token when registration payload is valid` |
| AUTH-02 | P0 | Duplicate email rejected | N | API | `rejects registration when email already exists` |
| AUTH-03 | P0 | Invalid email / short password → Zod 400 | N | API | `rejects registration when password is too short` |
| AUTH-04 | P0 | Valid login returns JWT | H | API | `returns token when credentials are valid` |
| AUTH-05 | P0 | Wrong password → 401 | N | API | `rejects login when password is wrong` |
| AUTH-06 | P0 | Unknown email → 401 without leaking existence | N | API | `rejects login when email is unknown` |
| AUTH-07 | P0 | `/auth/me` with Bearer returns user | H | API | `returns current user when token is valid` |
| AUTH-08 | P0 | Missing/expired/malformed token → 401 | N | API | `rejects me when token is missing or malformed` |
| AUTH-09 | P1 | Client stores token; leaves login when authenticated | H | UI | `redirects away from login when session exists` |
| AUTH-10 | P1 | Logout clears session and blocks protected routes | H | UI | `clears session and blocks dashboard after logout` |
| AUTH-11 | P0 | Unauthenticated dashboard/editor → login | P | UI / E2E | `redirects to login when visiting dashboard without token` |

---

## 2. Posts — CRUD & dashboard

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| POST-01 | P0 | Create draft with title + content | H | API | `creates draft when title and content are provided` |
| POST-02 | P0 | Update metadata and body fields | H | API | `updates post fields when owner sends valid payload` |
| POST-03 | P0 | Delete own post | H | API | `deletes post when owner requests delete` |
| POST-04 | P0 | Cannot mutate another user’s post | P | API | `forbids update when post belongs to another user` |
| POST-05 | P1 | List paginated; default limit 5 | H | API | `lists posts with default page size of 5` |
| POST-06 | P2 | Page size options 5/10/20/50 | H | UI | `requests new page when page size changes` |
| POST-07 | P1 | Search filters posts | H | API | `filters posts when search query is set` |
| POST-08 | P1 | Status filter | H | API | `filters posts when status is draft` |
| POST-09 | P1 | Sort by title/created/updated/seo | H | API | `orders posts by seo_score when sort=seo` |
| POST-10 | P1 | Empty list empty state | E | UI | `shows empty state when there are no posts` |
| POST-11 | P1 | List API failure + retry | F | UI | `shows error and retry when list request fails` |
| POST-12 | P0 | SEO ring uses persisted `seo_score` | H | UI | `renders badge from seo_score without list body` |
| POST-13 | P1 | Missing score → pending/unknown | E | UI | `shows pending badge when seo_score is null` |
| POST-14 | P1 | Portal tooltip hover + scroll | H | UI | `keeps tooltip open while pointer is over the panel` |
| POST-15 | P1 | Unsaved leave confirmation | H | UI | `prompts before leave when editor is dirty` |
| POST-16 | P1 | Save draft then see it on dashboard | H | E2E | `shows saved draft on dashboard after editor save` |

---

## 3. Editor — authoring

| ID    | Pri | Behavior                        | Tags  | Layer | Suggested test name                                  |
| ----- | --- | ------------------------------- | ----- | ----- | ---------------------------------------------------- |
| ED-01 | P1  | Edit title/body sets dirty      | H     | UI    | `marks editor dirty when content changes`            |
| ED-02 | P1  | Tags add/remove; max 4 for DEV  | H / N | UI    | `blocks adding a fifth tag when at DEV limit`        |
| ED-03 | P2  | Meta length guidance            | H     | UI    | `shows aim range when meta length is out of band`    |
| ED-04 | P2  | Canonical URL field             | H     | UI    | `accepts canonical URL input`                        |
| ED-05 | P1  | Preview renders body + cover    | H     | UI    | `renders preview content when preview tab is active` |
| ED-06 | P2  | Word/reading-time bar           | H     | UI    | `updates word count when markdown changes`           |
| ED-07 | P2  | Mobile sheets for sidebars      | H     | UI    | `opens post settings sheet on mobile`                |
| ED-08 | P2  | Keyboard shortcuts              | H     | UI    | `toggles preview on shortcut`                        |
| ED-09 | P1  | Loading skeleton while fetching | E     | UI    | `shows skeleton while post is loading`               |
| ED-10 | P1  | Invalid post id error           | N     | UI    | `shows error when post id is not found`              |

---

## 4. SEO scorecard

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| SEO-01 | P0 | Empty post → low rescaled score | E | Unit | `scores an empty post low without body (rescaled metadata-only path)` |
| SEO-02 | P0 | Strong full post → high score | H | Unit | `scores a complete post highly with body present` |
| SEO-03 | P0 | Soft warnings do not hard-block | H | Unit | `returns publish warnings without throwing` |
| SEO-04 | P1 | Platform context changes weights | H | Unit | `adjusts discussion weight when google-only platforms` |
| SEO-05 | P1 | Primary keyword placement checks | H | Unit | `flags title when primary keyword is missing` |
| SEO-06 | P1 | Structure checks (answer, headings, alt, stuffing) | H / N | Unit | `flags missing direct answer under first H2` |
| SEO-07 | P0 | Persist score + summary on save | H | API | `persists seo_score and summary when post is saved` |
| SEO-08 | P1 | Generate attaches scorecard for google | H | API | `includes seoScorecard when google target is selected` |
| SEO-09 | P0 | Client scorecard stays aligned with server | H | Unit | `matches server checks for the same fixture post` |
| SEO-10 | P0 | Summary format/parse round-trip | H | Unit | `round-trips OK WARN FAIL summary lines` |
| SEO-11 | P1 | Editor breakdown colors | H | UI | `colors passing checks green and warnings orange` |
| SEO-12 | P1 | Dashboard tooltip uses same colors | H | UI | `parses summary into colored breakdown items` |

---

## 5. AI — generate, research, edit, image, LinkedIn

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| AI-01 | P1 | Capabilities reports provider flags | H / E | API | `returns textAi false when no provider configured` |
| AI-02 | P0 | Generate with allowlisted model + targets | H | API | `returns draft JSON when keyword and model are valid` _(mock LLM)_ |
| AI-03 | P0 | Disallowed model rejected | N | API | `rejects generate when model is not allowlisted` |
| AI-04 | P0 | Invalid targets rejected | N | API | `rejects generate when targetPlatforms are invalid` |
| AI-05 | P0 | Keyword required | N | API | `rejects generate when keyword is empty` |
| AI-06 | P1 | LinkedIn target includes teaser + read-more | H | API | `includes linkedin_post when linkedin target and base URL set` |
| AI-07 | P1 | Missing canonical base → flag | E | API | `sets linkedin_missing_canonical when blog base URL unset` |
| AI-08 | P2 | Google grounding falls back | H / F | API | `falls back to plain generation when grounding fails` |
| AI-09 | P1 | Research context reaches prompt builder | H | Unit | `appends monetization rules when researchContext present` |
| AI-10 | P1 | Keyword research returns scored list | H | API | `returns ranked keywords when seed is valid` _(mock)_ |
| AI-11 | P0 | Seed length Zod bounds | N | API | `rejects keyword-research when seed is too short` |
| AI-12 | P2 | Trending topics / DEV.to tags cache | H | API | `returns cached trending topics within TTL` |
| AI-13 | P1 | Inline edit returns markdown | H | API | `returns edited markdown when action and text are valid` |
| AI-14 | P0 | Empty edit context → 400 | N | API | `rejects edit when context text is empty` |
| AI-15 | P1 | Image generate returns data URL | H | API | `returns imageDataUrl when topic is provided` _(mock)_ |
| AI-16 | P1 | LinkedIn summary from article | H | API | `returns linkedin_post when title and content provided` |
| AI-17 | P0 | LinkedIn summary needs context | N | API | `rejects linkedin summary when article context is empty` |
| AI-18 | P1 | Rate limit / credits map to errors | F | API | `maps RESOURCE_EXHAUSTED to rate-limit message` |
| AI-19 | P1 | Model picker allowlist only | H | UI | `lists only allowlisted content models` |
| AI-20 | P1 | Generate fills editor after explicit Generate | H | UI | `applies draft to editor when generate succeeds` |
| AI-21 | P1 | Research pick fills keyword + context | H | UI | `sets keyword and researchContext when card is picked` |
| AI-22 | P2 | Toolkit insert after edit | H | UI | `inserts edit result into selection when toolkit action completes` |

---

## 6. AI — SEO improve (targeted snippets)

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| IMP-01 | P0 | Targets only fail/warn; skip cover/schema | H / E | Unit | `omits cover checks when building improve targets` |
| IMP-02 | P0 | Clamp values to SEO_IMPROVE_LIMITS | N | Unit | `clamps currentValue to CURRENT_VALUE_MAX` |
| IMP-03 | P0 | improve-seo returns fixes by id | H | API | `returns fixes for each target id when request is valid` _(mock LLM)_ |
| IMP-04 | P0 | Empty targets rejected | N | API | `rejects improve-seo when targets are empty` |
| IMP-05 | P0 | Overlong currentValue rejected by Zod | N | API | `rejects improve-seo when currentValue exceeds max` |
| IMP-06 | P1 | Empty usable fixes → error | F | API | `fails when model returns no matching fix ids` |
| IMP-07 | P0 | Review modal; no auto-apply | H | UI | `does not mutate editor until apply is confirmed` |
| IMP-08 | P0 | Apply selected only | H | Unit | `leaves unselected fields unchanged when applying fixes` |
| IMP-09 | P1 | replaceAll for duplicate snippets | H | Unit | `replaces every identical currentValue occurrence` |
| IMP-10 | P1 | Append when current empty | H | Unit | `appends content when applyMode is append` |
| IMP-11 | P1 | Parse comma-separated tags | H | Unit | `parses tags from comma-separated AI value` |
| IMP-12 | P1 | Dismiss leaves editor unchanged | H | UI | `keeps editor state when review is dismissed` |

---

## 7. Cover upload & media

| ID    | Pri | Behavior                        | Tags | Layer | Suggested test name                                   |
| ----- | --- | ------------------------------- | ---- | ----- | ----------------------------------------------------- |
| UP-01 | P0  | Valid presigned request → URL   | H    | API   | `returns signed PUT URL when upload payload is valid` |
| UP-02 | P0  | Oversized / bad mime rejected   | N    | API   | `rejects presigned request when mime is not allowed`  |
| UP-03 | P0  | Unauthenticated upload → 401    | P    | API   | `rejects presigned request when unauthenticated`      |
| UP-04 | P1  | Client PUT then saves cover URL | H    | E2E   | `saves public cover URL after successful GCS PUT`     |
| UP-05 | P1  | AI cover attach paths           | H    | UI    | `sets cover_image when use-as-featured is clicked`    |
| UP-06 | P2  | Private bucket preview hint     | F    | UI    | `shows storage hint when cover preview fails`         |
| UP-07 | P2  | Inline image upload             | H    | UI    | `inserts image markdown when inline upload succeeds`  |

---

## 8. Credentials & platforms

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| CRED-01 | P0 | Upsert encrypts AES-256-GCM payload | H | Unit / API | `stores iv:tag:ciphertext when credential is saved` |
| CRED-02 | P0 | Zod rejects bad credential body | N | API | `rejects upsert when api_key is missing` |
| CRED-03 | P0 | Delete disconnects platform | H | API | `removes credential when platform is disconnected` |
| CRED-04 | P0 | List never returns plaintext secrets | H / P | API | `omits decrypted api_key from credentials list` |
| CRED-05 | P0 | Tampered ciphertext fails decrypt | N | Unit | `throws when auth tag verification fails` |
| CRED-06 | P1 | Settings connect/disconnect UX | H | UI | `shows connected state after successful save` |
| CRED-07 | P1 | LinkedIn OAuth start URL + state | H | API | `returns authorize URL with signed state` |
| CRED-08 | P1 | OAuth callback stores tokens | H | API | `persists encrypted LinkedIn tokens on callback` |
| CRED-09 | P0 | Bad OAuth state rejected | N | API | `rejects callback when state signature is invalid` |
| CRED-10 | P0 | Publish menu only active platforms | H / E | UI | `hides platforms without active credentials` |

---

## 9. Publishing

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| PUB-01 | P0 | Publish one platform success | H | API | `sets platform_status success when publish succeeds` _(mock platform)_ |
| PUB-02 | P0 | Publish all attempts each active | H | API | `attempts every active credential on publish-all` |
| PUB-03 | P0 | Partial failure reporting | F | API | `returns successes and failures on partial publish` |
| PUB-04 | P0 | No credentials → clear error | E | API | `fails clearly when no credentials are connected` |
| PUB-05 | P0 | LinkedIn uses summary not article | H | API | `posts linkedin_post body instead of content_markdown` |
| PUB-06 | P0 | Empty LinkedIn summary blocked | N | API | `rejects LinkedIn publish when linkedin_post is empty` |
| PUB-07 | P1 | Unpublish supported; LinkedIn unsupported | H / N | API | `rejects LinkedIn unpublish with unsupported message` |
| PUB-08 | P1 | Already published message | N | API | `reports already published when platform status exists` |
| PUB-09 | P1 | Soft SEO warnings non-blocking | H | UI | `allows publish click when only soft SEO warnings exist` |
| PUB-10 | P1 | Confirm before external publish | H | UI | `requires confirmation before publish to platform` |

---

## 10. Scheduled publishing & notifications

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| SCH-01 | P0 | Future schedule persisted | H | API | `saves scheduled_for and platforms when schedule is set` |
| SCH-02 | P1 | Past datetime rejected | N | UI / API | `rejects schedule when datetime is in the past` |
| SCH-03 | P1 | Clear schedule | H | API | `clears schedule fields when schedule is removed` |
| SCH-04 | P0 | Cron selects due drafts with batch cap | H | API | `processes at most max batch of due drafts per run` |
| SCH-05 | P0 | Cron success clears schedule | H | API | `marks published and clears schedule on cron success` |
| SCH-06 | P0 | Cron partial / failed / skipped | F / E | API | `records skipped_no_credentials when no active creds` |
| SCH-07 | P1 | Respect scheduled_platforms filter | H | API | `publishes only scheduled_platforms when set` |
| SCH-08 | P2 | Slack notify when webhook set | H / E | Unit | `skips Slack when webhook env is unset` |
| SCH-09 | P2 | Email notify when Resend set | H / E | Unit | `skips email when RESEND_API_KEY is unset` |
| SCH-10 | P0 | Cron unauthorized without secret | P | API | `rejects cron when authorization secret is missing` |

---

## 11. Analytics

| ID    | Pri | Behavior                       | Tags  | Layer | Suggested test name                                   |
| ----- | --- | ------------------------------ | ----- | ----- | ----------------------------------------------------- |
| AN-01 | P1  | Stats for authenticated user   | H     | API   | `returns publish counts for the current user`         |
| AN-02 | P2  | Empty period zeros             | E     | UI    | `renders empty charts when period has no data`        |
| AN-03 | P2  | Date presets                   | H     | UI    | `refetches when date preset changes`                  |
| AN-04 | P1  | API failure state              | F     | UI    | `shows error when analytics request fails`            |
| AN-05 | P2  | GA4/engagement when configured | H / E | API   | `returns empty engagement when GA4 is not configured` |

---

## 12. Admin users

| ID     | Pri | Behavior                    | Tags | Layer    | Suggested test name                          |
| ------ | --- | --------------------------- | ---- | -------- | -------------------------------------------- |
| ADM-01 | P1  | Admin lists users           | H    | API      | `lists users when caller is admin`           |
| ADM-02 | P0  | Non-admin forbidden         | P    | API      | `forbids user list when caller is not admin` |
| ADM-03 | P1  | Create user                 | H    | API      | `creates user when admin payload is valid`   |
| ADM-04 | P1  | Update role/status          | H    | API      | `updates role when admin changes user`       |
| ADM-05 | P1  | Delete with confirmation    | H    | API / UI | `deletes user when admin confirms`           |
| ADM-06 | P1  | Validation on create/update | N    | API      | `rejects create when email is invalid`       |

---

## 13. Profile & settings

| ID      | Pri | Behavior                  | Tags | Layer | Suggested test name                                      |
| ------- | --- | ------------------------- | ---- | ----- | -------------------------------------------------------- |
| PROF-01 | P1  | Update profile            | H    | API   | `updates profile fields for authenticated user`          |
| PROF-02 | P1  | Change password success   | H    | API   | `changes password when current password matches`         |
| PROF-03 | P0  | Wrong current password    | N    | API   | `rejects password change when current password is wrong` |
| SET-01  | P2  | Theme toggle persisted    | H    | UI    | `persists theme preference when toggled`                 |
| SET-02  | P1  | Credential forms (see §8) | H    | UI    | _(delegate to CRED-06)_                                  |

---

## 14. MDX export

| ID     | Pri | Behavior                     | Tags | Layer | Suggested test name                         |
| ------ | --- | ---------------------------- | ---- | ----- | ------------------------------------------- |
| MDX-01 | P1  | Export download              | H    | API   | `returns MDX payload when post exists`      |
| MDX-02 | P0  | Unauthenticated export → 401 | P    | API   | `rejects MDX export when unauthenticated`   |
| MDX-03 | P1  | Missing post → 404           | N    | API   | `returns 404 when exported post is missing` |

---

## 15. Security & cross-cutting (NFR)

| ID     | Pri | Behavior                   | Tags | Layer | Suggested test name                                    |
| ------ | --- | -------------------------- | ---- | ----- | ------------------------------------------------------ |
| SEC-01 | P0  | Zod rejects bad bodies     | N    | API   | `rejects improve-seo body when field enum is invalid`  |
| SEC-02 | P1  | Rate limit 429             | F    | API   | `returns 429 when request burst exceeds limiter`       |
| SEC-03 | P0  | Secrets never logged       | H    | Unit  | `redacts credential fields in log payload`             |
| SEC-04 | P0  | Protected routes need auth | P    | API   | `rejects posts list when Authorization header missing` |
| SEC-05 | P1  | Response envelope shape    | H    | API   | `returns success false and error string on AppError`   |

---

## 16. Mobile (Expo)

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| MOB-01 | P1 | Login against same API | H | UI | `stores session after successful login` |
| MOB-02 | P1 | Editor blocks + formatting | H | UI | `inserts block when drawer action is chosen` |
| MOB-03 | P0 | AI Copilot review before apply | H | UI | `does not apply copilot diff until user confirms` |
| MOB-04 | P0 | Publish only credentialed platforms | H / E | UI | `disables platforms without credentials` |
| MOB-05 | P0 | `useEditorState` persistence boundary | H | Unit | `persists draft through useEditorState save path` |
| MOB-06 | P1 | API failure messaging | F | UI | `shows error when publish request fails` |

---

## 17. Client utilities

| ID | Pri | Behavior | Tags | Layer | Suggested test name |
| --- | --- | --- | --- | --- | --- |
| UTIL-01 | P1 | Markdown normalize/storage | H | Unit | `normalizes newlines when converting to storage markdown` |
| UTIL-02 | P1 | LinkedIn read-more helpers | H / E | Unit | `builds read-more URL when canonical base is set` |
| UTIL-03 | P2 | Data table page window math | H | Unit | `builds pagination window for current page` |
| UTIL-04 | P2 | AI prefs storage | H | Unit | `persists selected model to localStorage` |
| UTIL-05 | P1 | Tooltip dismiss delay + panel hover | H | UI | `cancels hide when pointer enters portal panel` |

---

## Implementation order (pyramid + P0)

1. **P0 Unit:** SEO scorecard (extend existing), `seoImproveTargets`, encryption helpers.
2. **P0 API:** Auth, Zod validation, posts ownership, improve-seo empty targets, cron auth.
3. **P0 API (mocked externals):** Publish partial failure, LinkedIn summary body, credentials encrypt/decrypt.
4. **P1 Unit/API:** Pagination/search/sort, schedule outcomes, keyword-research Zod.
5. **P1 UI:** SEO badge/tooltip, improve review (no auto-apply), leave guard.
6. **P2 / thin E2E:** Login → save draft → dashboard SEO badge; mobile smoke later.

---

## Traceability (FR → sections)

| FR             | Sections |
| -------------- | -------- |
| FR1            | §1       |
| FR2–FR3        | §2, §3   |
| FR4–FR7        | §8, §9   |
| FR8, FR14      | §10      |
| FR9, FR15–FR17 | §5       |
| FR10           | §7       |
| FR11           | §11      |
| FR12           | §12      |
| FR13           | §14      |
| FR18–FR19      | §4, §6   |
| NFR1–NFR6      | §15      |

---

## Example Red–Green–Refactor slice

**Feature:** Improve-seo rejects empty targets (IMP-04).

1. **Red** — Add `improveSeo.test.ts` / route test: `it("rejects improve-seo when targets are empty", …)` expecting 400 + `AI_SEO_IMPROVE_TARGETS_REQUIRED`.
2. **Green** — Rely on existing Zod schema (or fix if missing); test passes.
3. **Refactor** — Ensure schema uses `SEO_IMPROVE_LIMITS`; no magic numbers.
4. **Next red** — IMP-02 clamp unit test, then IMP-08 apply-selected unit test.

Repeat until the section’s P0 rows are green.
