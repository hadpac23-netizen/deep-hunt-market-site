#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -n "${HUNT_MATRIX_PORT:-}" ]]; then
  PORT="$HUNT_MATRIX_PORT"
else
  PORT="$(python3 - <<'PYPORT'
import socket
s=socket.socket()
s.bind(("127.0.0.1",0))
print(s.getsockname()[1])
s.close()
PYPORT
)"
fi
SERVER_LOG="/tmp/hunt-final-matrix-http-$$.log"
SERVER_PID=""

SESSIONS=()
cleanup() {
  for s in "${SESSIONS[@]:-}"; do
    [[ -n "$s" ]] && npx -y agent-browser --session "$s" close >/dev/null 2>&1 || true
  done
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$SERVER_LOG"
}
trap cleanup EXIT

cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
ready=0
for _ in {1..50}; do
  if curl -fsS "http://127.0.0.1:$PORT/index.html" 2>/dev/null | grep -q 'id="hunt-hero4"'; then
    ready=1
    break
  fi
  sleep 0.1
done
if [[ "$ready" != "1" ]]; then
  echo "FAIL: Final Candidate local server fingerprint did not become ready on port $PORT"
  cat "$SERVER_LOG" 2>/dev/null || true
  exit 1
fi

check() {
  local session="$1" label="$2" expr="$3"
  local result
  result="$(npx -y agent-browser --session "$session" eval "($expr) ? 'PASS' : 'FAIL'")"
  if [[ "$result" != *PASS* ]]; then
    echo "FAIL [$session]: $label"
    echo "RAW RESULT: $result"
    exit 1
  fi
  echo "PASS [$session]: $label"
}

page_clean() {
  local session="$1"
  local payload count
  payload="$(npx -y agent-browser --session "$session" --json errors --clear || true)"
  count="$(printf '%s' "$payload" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(len(d.get("data",{}).get("errors",[])))' 2>/dev/null || echo 999)"
  if [[ "$count" != "0" ]]; then
    echo "FAIL [$session]: browser page errors ($count)"
    printf '%s' "$payload" | python3 -c 'import json,sys; d=json.load(sys.stdin); [print(" - "+str(e.get("text",""))) for e in d.get("data",{}).get("errors",[])]' 2>/dev/null || printf '%s\n' "$payload"
    exit 1
  fi
  echo "PASS [$session]: no browser page errors"
}
surface_matrix() {
  local width="$1" height="$2" label="$3"
  local session="hunt-matrix-$label-$$"
  SESSIONS+=("$session")
  local base="http://127.0.0.1:$PORT"
  npx -y agent-browser --session "$session" --init-script "$ROOT/scripts/boom-e2e-fetch-mock.js" open "$base/" >/dev/null
  local ab=(npx -y agent-browser --session "$session")

  "${ab[@]}" set viewport "$width" "$height" >/dev/null
  "${ab[@]}" reload >/dev/null
  "${ab[@]}" wait 700 >/dev/null
  "${ab[@]}" eval "document.querySelector('#hunt-analytics-consent button[data-consent=decline]')?.click(); true" >/dev/null

  check "$session" "Home horizontal overflow" 'document.documentElement.scrollWidth <= window.innerWidth + 2'
  check "$session" "Hero visible" '(()=>{const e=document.querySelector("#hunt-hero4");if(!e)return false;const r=e.getBoundingClientRect();const c=getComputedStyle(e);return c.display!=="none"&&c.visibility!=="hidden"&&Number(c.opacity)>0&&r.width>100&&r.height>100})()'
  check "$session" "HUNT brand visible" '!!document.querySelector(".hd-hunt-wordmark")'
  check "$session" "Categories gateway present" '!!document.querySelector("[data-open-categories]")'
  if [[ "$width" -le 760 ]]; then
    check "$session" "Mobile navigation visible" '!!document.querySelector(".hd-mobile-nav") && getComputedStyle(document.querySelector(".hd-mobile-nav")).display!=="none"'
  else
    check "$session" "Top navigation visible" '!!document.querySelector(".hd-topbar") && getComputedStyle(document.querySelector(".hd-topbar")).display!=="none"'
  fi
  page_clean "$session"

  "${ab[@]}" open "$base/category.html?c=women" >/dev/null
  "${ab[@]}" wait 700 >/dev/null
  check "$session" "Category horizontal overflow" 'document.documentElement.scrollWidth <= window.innerWidth + 2'
  check "$session" "Category grid present" '!!document.querySelector("#hd-category-grid")'
  check "$session" "Category controls accessible" '!!document.querySelector("#hd-cat-sort") && !!document.querySelector("#hd-filter-clear-all")'
  check "$session" "No duplicate IDs on Category" '(()=>{const ids=[...document.querySelectorAll("[id]")].map(x=>x.id);return ids.length===new Set(ids).size})()'
  page_clean "$session"

  "${ab[@]}" open "$base/search.html" >/dev/null
  "${ab[@]}" wait 500 >/dev/null
  check "$session" "Search horizontal overflow" 'document.documentElement.scrollWidth <= window.innerWidth + 2'
  check "$session" "AI Find input visible" '!!document.querySelector("#hd-ai-search-input") && getComputedStyle(document.querySelector("#hd-ai-search-input")).display!=="none"'
  check "$session" "Mission Shopping panel present" '!!document.querySelector("#hd-mission-panel")'
  page_clean "$session"

  "${ab[@]}" open "$base/product.html?provider=CJdropshipping&id=2410010236461621700" >/dev/null
  "${ab[@]}" wait 700 >/dev/null
  check "$session" "Product horizontal overflow" 'document.documentElement.scrollWidth <= window.innerWidth + 2'
  check "$session" "Product title renders" 'document.querySelector("#hd-product-title")?.textContent==="HUNT E2E Verified CJ Product"'
  check "$session" "Decision Check visible" '!!document.querySelector("#hd-decision-check")'
  if [[ "$width" -le 760 ]]; then
    check "$session" "Mobile add/verify control visible" '(()=>{const e=document.querySelector("#hd-mobile-add");if(!e)return false;const r=e.getBoundingClientRect();const c=getComputedStyle(e);return !e.disabled&&c.display!=="none"&&c.visibility!=="hidden"&&r.width>80&&r.height>30})()'
  else
  check "$session" "Add/verify control reachable" '!!document.querySelector("#hd-product-add") && !document.querySelector("#hd-product-add").disabled'
  fi
  check "$session" "No duplicate IDs on Product" '(()=>{const ids=[...document.querySelectorAll("[id]")].map(x=>x.id);return ids.length===new Set(ids).size})()'
  page_clean "$session"

  if [[ "$label" == "1440" || "$label" == "390" ]]; then
    "${ab[@]}" click '#hd-size-options [data-size="M"]' >/dev/null
    if [[ "$width" -le 760 ]]; then
      "${ab[@]}" click '#hd-mobile-add' >/dev/null
    else
      "${ab[@]}" click '#hd-product-add' >/dev/null
    fi
    "${ab[@]}" wait 700 >/dev/null
    check "$session" "E2E navigates to Checkout" 'location.pathname.endsWith("/checkout.html")'
    check "$session" "Checkout horizontal overflow" 'document.documentElement.scrollWidth <= window.innerWidth + 2'
    check "$session" "Cart line visible" 'document.querySelectorAll(".hd-checkout-item").length===1'
    check "$session" "Selected variant preserved" 'document.querySelector(".hd-checkout-item")?.textContent.includes("Black / M")'
    check "$session" "Payment remains disabled" 'document.querySelector(".hd-pay-disabled")?.disabled===true'
    page_clean "$session"
  fi

  "${ab[@]}" close >/dev/null 2>&1 || true
}

surface_matrix 1440 1000 1440
surface_matrix 1280 800 1280
surface_matrix 768 1024 768
surface_matrix 390 844 390

echo "HUNT Final Preview Matrix: PASS — 1440 / 1280 / 768 / 390; responsive surfaces clean; desktop+mobile product-to-checkout path clean; payment disabled."
