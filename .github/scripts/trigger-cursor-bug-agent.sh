#!/usr/bin/env bash
# Trigger a Cursor Cloud Agent to investigate bugs and open a draft PR.
# Requires CURSOR_API_KEY repository secret (Cursor Dashboard → API Keys).

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/FarukhSaifi/SyncApp}"
BASE_REF="${BASE_REF:-main}"
AGENT_NAME="${AGENT_NAME:-SyncApp bug fix}"
PROMPT_FILE="${PROMPT_FILE:-.github/cursor/bug-fix-prompt.txt}"

if [[ -z "${CURSOR_API_KEY:-}" ]]; then
  echo "::warning::CURSOR_API_KEY is not set — skipping Cursor agent trigger."
  echo "Add the secret in GitHub: Settings → Secrets → Actions → CURSOR_API_KEY"
  echo "See docs/BUG_AGENT_AUTOMATION.md for setup."
  exit 0
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "::error::Prompt file not found: $PROMPT_FILE"
  exit 1
fi

PROMPT="$(cat "$PROMPT_FILE")"

if [[ -n "${EXTRA_CONTEXT:-}" ]]; then
  PROMPT="${PROMPT}

## Trigger context
${EXTRA_CONTEXT}"
fi

PAYLOAD="$(jq -n \
  --arg text "$PROMPT" \
  --arg url "$REPO_URL" \
  --arg ref "$BASE_REF" \
  --arg name "$AGENT_NAME" \
  '{
    prompt: { text: $text },
    repos: [{ url: $url, startingRef: $ref }],
    autoCreatePR: true,
    name: $name
  }')"

echo "Triggering Cursor Cloud Agent (base: ${BASE_REF})..."

HTTP_CODE="$(curl -sS -o /tmp/cursor-agent-response.json -w "%{http_code}" \
  -X POST "https://api.cursor.com/v1/agents" \
  -u "${CURSOR_API_KEY}:" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")"

if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 300 ]]; then
  echo "::error::Cursor API returned HTTP ${HTTP_CODE}"
  cat /tmp/cursor-agent-response.json
  exit 1
fi

AGENT_URL="$(jq -r '.agent.url // empty' /tmp/cursor-agent-response.json)"
AGENT_ID="$(jq -r '.agent.id // empty' /tmp/cursor-agent-response.json)"

if [[ -n "$AGENT_URL" ]]; then
  echo "::notice title=Cursor agent started::${AGENT_URL}"
else
  echo "Response:"
  cat /tmp/cursor-agent-response.json
fi

echo "agent_id=${AGENT_ID}" >> "${GITHUB_OUTPUT:-/dev/null}"
