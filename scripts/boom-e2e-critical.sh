#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${HUNT_E2E_PORT:-8876}"
SESSION="boom-critical-$$"
SERVER_LOG="/tmp/boom-e2e-http-$$.log"
SERVER_PID=""

ab() { npx -y agent-browser --session "$SESSION" "$@"; }
cleanup() {
  ab close >/dev/null 2>&1 || true
  if [[ -n "$SERVER_PID" ]]; then kill "$SERVER_PID" >/dev/null 2>&1 || true; wait "$SERVER_PID" 2>/dev/null || true; fi
  rm -f "$SERVER_LOG"
}
trap cleanup EXIT

cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
ready=0
for _ in {1..40}; do
  if curl -fsS "http://127.0.0.1:$PORT/product.html" >/dev/null 2>&1; then ready=1; break; fi
  sleep 0.1
done
if [[ "$ready" != "1" ]]; then
  echo "FAIL: local E2E server did not start"
  exit 1
fi

PRODUCT_URL="http://127.0.0.1:$PORT/product.html?provider=CJdropshipping&id=2410010236461621700"
npx -y agent-browser --session "$SESSION" --init-script "$ROOT/scripts/boom-e2e-fetch-mock.js" open "$PRODUCT_URL"
ab storage local clear
ab reload
ab wait 700
ab click "#hunt-analytics-consent button[data-consent='decline']"
check() {
  local label="$1"
  local expr="$2"
  local result
  result="$(ab eval "($expr) ? 'PASS' : 'FAIL'")"
  if [[ "$result" != *PASS* ]]; then
    echo "FAIL: $label"
    ab screenshot "$ROOT/.e2e-failure.png" >/dev/null 2>&1 || true
    exit 1
  fi
  echo "PASS: $label"
}

check "product truth renders" 'document.querySelector("#hd-product-title")?.textContent === "HUNT E2E Verified CJ Product"'
check "verified retail price renders" 'document.querySelector("#hd-product-price")?.textContent === "$7.99"'
check "supplier quote state renders" 'document.querySelector("#hd-product-stock")?.textContent === "QUOTE VERIFIED"'
check "cart action enabled" '!document.querySelector("#hd-product-add")?.disabled'

ab click '#hd-size-options [data-size="M"]'
check "variant selection updates" 'document.querySelector("#hd-selected-size")?.textContent === "M"'
ab click '#hd-product-add'
ab wait 500
check "navigates to checkout" 'location.pathname.endsWith("/checkout.html")'
check "cart renders one line" 'document.querySelectorAll(".hd-checkout-item").length === 1'
check "chosen variant survives navigation" 'document.querySelector(".hd-checkout-item")?.textContent.includes("Black / M")'
check "cart state keeps variant id" 'window.HuntCore.cart()[0]?.variant_id === "E2E-BLK-M"'
ab select '#hd-checkout-market' 'US'
ab click '#hd-checkout-verify'
ab wait 350
check "shipping quote renders" 'document.querySelector("#hd-checkout-shipping")?.textContent === "$4.50"'
check "verified total renders" 'document.querySelector("#hd-checkout-total")?.textContent === "$12.49"'
check "global feedback confirms quote" 'document.querySelector("#boom-feedback-center .boom-feedback-card")?.textContent === "Price and shipping verified."'
check "quote trace carries full lineage" 'window.__boomActionTrace?.some(x=>x.action_id==="checkout.quote.verify"&&x.detail?.state==="success"&&x.owner==="operations_brain"&&x.endpoint==="hunt-payment-session"&&x.analytics==="checkoutQuoteVerified"&&x.learning==="evidence_refresh")'
check "prelaunch status blocks payment" 'document.querySelector("#hd-checkout-status")?.textContent.includes("Payment is still disabled")'
check "payment control stays disabled" 'document.querySelector(".hd-pay-disabled")?.disabled === true'

console_output="$(ab console || true)"
if [[ "$console_output" == *"Multiple GoTrueClient instances"* ]]; then
  echo "FAIL: duplicate Supabase auth clients detected"
  exit 1
fi
echo "PASS: one shared Supabase auth client"

errors_output="$(ab errors || true)"
if [[ -n "$(printf '%s' "$errors_output" | tr -d '[:space:]')" ]]; then
  echo "FAIL: browser page errors detected"
  printf '%s\n' "$errors_output"
  exit 1
fi
echo "PASS: no browser page errors"

echo "BOOM critical E2E: PASS — product → variant → cart → checkout → verified quote; payment remained disabled."