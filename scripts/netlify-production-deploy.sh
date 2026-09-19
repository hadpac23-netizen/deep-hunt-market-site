#!/usr/bin/env bash
set -euo pipefail

SITE_ID="${NETLIFY_SITE_ID:-11d257a4-f86c-45b8-a9f9-d84189ad9837}"
DIR="${1:-.}"
REASON="${2:-Approved production release}"

if [[ "${HUNT_OWNER_PROD_APPROVED:-}" != "YES" ]]; then
  echo "BLOCKED: production deploy requires HUNT_OWNER_PROD_APPROVED=YES"
  exit 42
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "BLOCKED: git worktree is not clean"
  exit 43
fi

BRANCH="$(git symbolic-ref --short -q HEAD || true)"
if [[ "$BRANCH" != "main" ]]; then
  echo "BLOCKED: production deploy must run from main (current: ${BRANCH:-detached})"
  exit 44
fi

git fetch origin main --quiet
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"
if [[ "$LOCAL" != "$REMOTE" ]]; then
  echo "BLOCKED: local main does not match origin/main"
  exit 45
fi

echo "OWNER-GATED PRODUCTION DEPLOY"
echo "Site: $SITE_ID"
echo "Commit: $LOCAL"
echo "Reason: $REASON"

exec npx -y netlify-cli@latest deploy \
  --prod \
  --site "$SITE_ID" \
  --dir "$DIR" \
  --message "$REASON | $LOCAL"
