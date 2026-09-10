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

# Browser copy buttons can add surrounding whitespace/CRLF. Normalize only the edges.
EBAY_CLIENT_ID="$(printf '%s' "$EBAY_CLIENT_ID" | tr -d '\r\n' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
EBAY_CLIENT_SECRET="$(printf '%s' "$EBAY_CLIENT_SECRET" | tr -d '\r\n' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"

if [[ -z "$EBAY_CLIENT_ID" || -z "$EBAY_CLIENT_SECRET" ]]; then
  echo "Missing Client ID or Client Secret. Nothing changed."
  exit 1
fi

OAUTH_TMP="$(mktemp -t hunt-ebay-oauth)"
OAUTH_STATUS="$(curl -sS --max-time 20 -o "$OAUTH_TMP" -w "%{http_code}" \
  -X POST 'https://api.ebay.com/identity/v1/oauth2/token' \
  --user "$EBAY_CLIENT_ID:$EBAY_CLIENT_SECRET" \
  -H 'content-type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'scope=https://api.ebay.com/oauth/api_scope')"

if [[ "$OAUTH_STATUS" != "200" ]] || ! grep -q '"access_token"' "$OAUTH_TMP"; then
  echo "EBAY_CREDENTIAL_CHECK_FAILED (HTTP $OAUTH_STATUS)"
  python3 - "$OAUTH_TMP" <<'PYERR'
import json,sys
try:
    data=json.load(open(sys.argv[1]))
    print('eBay:', data.get('error','oauth_error'), '-', data.get('error_description','Client authentication failed'))
except Exception:
    print('eBay OAuth rejected the Production key pair.')
PYERR
  rm -f "$OAUTH_TMP"
  echo "Use App ID + Cert ID from the SAME Production keyset. Do not use Dev ID or Sandbox keys."
  exit 2
fi
rm -f "$OAUTH_TMP"
echo "EBAY_LOCAL_OAUTH_PASS"

INTERNAL_TOKEN="$(openssl rand -hex 32)"
ORDER_INTERNAL_TOKEN="$(openssl rand -hex 32)"
TOKEN_FILE="$HOME/.hunt-ebay-internal-token"
ORDER_TOKEN_FILE="$HOME/.hunt-ebay-order-internal-token"
TMP_ENV="$(mktemp -t hunt-ebay-secrets)"
chmod 600 "$TMP_ENV"
trap 'rm -f "$TMP_ENV"; unset EBAY_CLIENT_ID EBAY_CLIENT_SECRET INTERNAL_TOKEN ORDER_INTERNAL_TOKEN' EXIT

cat > "$TMP_ENV" <<ENV
EBAY_CLIENT_ID=$EBAY_CLIENT_ID
EBAY_CLIENT_SECRET=$EBAY_CLIENT_SECRET
EBAY_MARKETPLACE_ID=EBAY_US
HUNT_EBAY_INTERNAL_TOKEN=$INTERNAL_TOKEN
HUNT_EBAY_ORDER_INTERNAL_TOKEN=$ORDER_INTERNAL_TOKEN
EBAY_ORDER_API_APPROVED=false
ENV

printf '%s' "$INTERNAL_TOKEN" > "$TOKEN_FILE"
printf '%s' "$ORDER_INTERNAL_TOKEN" > "$ORDER_TOKEN_FILE"
chmod 600 "$TOKEN_FILE" "$ORDER_TOKEN_FILE"

npx supabase secrets set --project-ref "$PROJECT_REF" --env-file "$TMP_ENV"
npx supabase functions deploy hunt-ebay-browse --project-ref "$PROJECT_REF" --no-verify-jwt
npx supabase functions deploy hunt-ebay-order --project-ref "$PROJECT_REF" --no-verify-jwt

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

ORDER_STATUS="$(curl -sS --max-time 20 -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/hunt-ebay-order" \
  -H "content-type: application/json" \
  -H "x-hunt-ebay-order-token: $ORDER_INTERNAL_TOKEN" \
  --data '{"action":"status"}')"

if [[ "$ORDER_STATUS" == *'"onsite_checkout":true'* ]]; then
  echo "EBAY_ONSITE_CHECKOUT_READY"
else
  echo "EBAY_ORDER_API_APPROVAL_REQUIRED"
fi
