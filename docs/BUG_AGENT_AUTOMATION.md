# Automated Bug-Fix Agent Setup

SyncApp can automatically start a **Cursor Cloud Agent** when CI fails, on a weekly schedule, or on demand. The agent investigates the bug, applies a fix, and opens a **draft PR**.

## What is already in the repo

| File | Purpose |
|------|---------|
| `AGENTS.md` | Architecture + verification commands for agents |
| `.cursor/rules/bug-fix-agent.mdc` | Cursor rules for bug-fix runs |
| `.github/cursor/bug-fix-prompt.txt` | Prompt sent to the Cloud Agent |
| `.github/scripts/trigger-cursor-bug-agent.sh` | Calls Cursor API (`POST /v1/agents`) |
| `.github/workflows/cursor-bug-agent.yml` | GitHub Actions triggers |
| `.github/workflows/ci.yml` | Lint + client build + **server typecheck/build** |

## One-time setup (required)

### 1. Create a Cursor API key

1. Open [Cursor Dashboard → API Keys](https://cursor.com/settings)
2. Create a **User API Key**
3. Copy the key (shown once)

### 2. Add GitHub secret

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `CURSOR_API_KEY`
4. Value: your Cursor API key

Without this secret, the workflow **skips gracefully** (warning only, no failure).

### 3. Grant Cursor access to the repo

1. Open [cursor.com/automations](https://cursor.com/automations) or Cursor **Settings → Integrations**
2. Connect **GitHub**
3. Allow access to **FarukhSaifi/SyncApp** (or your fork)

### 4. Enable Cloud Agents (if not already)

Ensure your Cursor plan includes **Cloud Agents**. The API is in public beta: [Cloud Agents API docs](https://cursor.com/docs/cloud-agent/api/endpoints).

## How triggers work

### A. CI fails on `main` (automatic)

```text
Push to main → CI fails → cursor-bug-agent workflow → Cloud Agent → draft PR
```

Safeguards:

- Only fires on **push to main** (not every PR)
- Skips branches named `cursor/*` to avoid agent loops

### B. Weekly scan (automatic)

Every **Monday 06:00 UTC**, an agent scans for bugs and opens a PR if it finds fixable issues.

### C. Manual run

1. GitHub → **Actions** → **Cursor Bug Agent**
2. **Run workflow**
3. Optional: reason + base branch (default `main`)

## Optional: Cursor Automations UI

For triggers not covered by GitHub Actions (Slack, Sentry, PR review):

1. Go to [cursor.com/automations/new](https://cursor.com/automations/new)
2. **Trigger:** e.g. `CI completed`, `PR opened`, or `Scheduled`
3. **Repository:** SyncApp
4. **Tools:** enable **Create Pull Request**
5. **Prompt:** paste contents of `.github/cursor/bug-fix-prompt.txt`

### Sentry → auto PR (production bugs)

1. [Sentry](https://sentry.io) → **Settings → Integrations → Cursor Agent**
2. Install with your Cursor API key
3. **Seer** stopping point: **Hand off to Cursor Cloud Agent**

## Verify the setup

### Test without waiting for CI failure

```bash
# Locally (requires CURSOR_API_KEY in env)
export CURSOR_API_KEY=your_key
bash .github/scripts/trigger-cursor-bug-agent.sh
```

Or run **Actions → Cursor Bug Agent → Run workflow**.

### Expected result

- GitHub Actions step logs: `Cursor agent started: https://cursor.com/agents/...`
- Within minutes: a **draft PR** from a `cursor/...` branch
- PR body should describe bug, cause, fix, and verification

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow skips with warning | Add `CURSOR_API_KEY` secret |
| HTTP 401 from Cursor API | Regenerate API key; check secret value |
| HTTP 404 model not found | Set `GOOGLE_AI_MODEL=gemini-3.5-flash` + `GOOGLE_CLOUD_LOCATION=global` in server env (unrelated to agent trigger, but common app bug) |
| Agent opens PR but CI fails again | Review agent PR manually; tighten prompt in `.github/cursor/bug-fix-prompt.txt` |
| Too many agent PRs | Disable `schedule` in `cursor-bug-agent.yml` or reduce CI auto-trigger scope |

## Customizing the prompt

Edit `.github/cursor/bug-fix-prompt.txt`. Changes apply to:

- GitHub Actions triggers
- Any automation that copies the same prompt

After editing, run a manual **Cursor Bug Agent** workflow to test.

## Security notes

- Never commit `CURSOR_API_KEY` to the repo
- Agent PRs are **draft** — require human review before merge
- The trigger script only reads the repo; it does not push code itself (the Cloud Agent does)
