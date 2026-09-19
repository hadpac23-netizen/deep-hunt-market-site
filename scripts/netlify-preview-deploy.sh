#!/usr/bin/env bash
set -euo pipefail

SITE_ID="${NETLIFY_SITE_ID:-11d257a4-f86c-45b8-a9f9-d84189ad9837}"
ALIAS="${1:-hunt-preview}"
DIR="${2:-.}"

echo "Netlify safe preview deploy"
echo "Site: $SITE_ID"
echo "Alias: $ALIAS"
echo "Directory: $DIR"
echo "Production: NO"

exec npx -y netlify-cli@latest deploy \
  --site "$SITE_ID" \
  --dir "$DIR" \
  --alias "$ALIAS" \
  --message "Preview: $ALIAS"
