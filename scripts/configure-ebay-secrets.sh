#!/bin/zsh
set -euo pipefail
PROJECT_REF="zszlnahjqmwozwubetkm"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "eBay Production Application Keys -> Supabase secrets"
echo "The values stay local and are never written to Git or chat."
read "EBAY_CLIENT_ID?Production Client ID (App ID): "
read -s "EBAY_CLIENT_SECRET?Production Client Secret (Cert ID): "
echo

if [[ -z "$EBAY_CLIENT_ID" || -z "$EBAY_CLIENT_SECRET" ]]; then
  echo "Missing Client ID or Client Secret. Nothing changed."
  exit 1
fi

INTERNAL_TOKEN="$(openssl rand -hex 32)"
TOKEN_FILE="$HOME/.hunt-ebay-internal-token"
TMP_ENV="$(mktemp -t hunt-ebay-secrets)"
chmod 600 "$TMP_ENV"
trap 'rm -f "$TMP_ENV"; unset EBAY_CLIENT_ID EBAY_CLIENT_SECRET INTERNAL_TOKEN' EXIT

cat > "$TMP_ENV" <<ENV
EBAY_CLIENT_ID=$EBAY_CLIENT_ID
EBAY_CLIENT_SECRET=$EBAY_CLIENT_SECRET
EBAY_MARKETPLACE_ID=EBAY_US
HUNT_EBAY_INTERNAL_TOKEN=$INTERNAL_TOKEN
ENV

printf '%s' "$INTERNAL_TOKEN" > "$TOKEN_FILE"
chmod 600 "$TOKEN_FILE"

npx supabase secrets set --project-ref "$PROJECT_REF" --env-file "$TMP_ENV"
npx supabase functions deploy hunt-ebay-browse --project-ref "$PROJECT_REF" --no-verify-jwt

STATUS_URL="https://${PROJECT_REF}.supabase.co/functions/v1/hunt-ebay-browse"
STATUS="$(curl -sS --max-time 20 -X POST "$STATUS_URL" \
  -H "content-type: application/json" \
  -H "x-hunt-ebay-token: $INTERNAL_TOKEN" \
  --data '{"action":"status"}')"

if [[ "$STATUS" != *'"configured":true'* ]]; then
  echo "eBay function deployed, but credentials did not validate as configured."
  exit 2
fi

SEARCH="$(curl -sS --max-time 25 -X POST "$STATUS_URL" \
  -H "content-type: application/json" \
  -H "x-hunt-ebay-token: $INTERNAL_TOKEN" \
  --data '{"action":"search","department":"women","limit":5}')"

if [[ "$SEARCH" != *'"ok":true'* || "$SEARCH" != *'"provider":"eBay"'* ]]; then
  echo "Secrets were stored, but the live eBay OAuth/Browse test failed."
  exit 3
fi

echo "EBAY_SECRETS_CONFIGURED"
echo "EBAY_OAUTH_BROWSE_PASS"
echo "eBay Browse adapter deployed and live search verified."
