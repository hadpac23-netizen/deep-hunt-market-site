#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${HUNT_ADMIN_E2E_PORT:-8881}"
DENY="boom-admin-deny-$$"
ALLOW="boom-admin-allow-$$"
SPID=""
cleanup(){
  npx -y agent-browser --session "$DENY" close >/dev/null 2>&1 || true
  npx -y agent-browser --session "$ALLOW" close >/dev/null 2>&1 || true
  if [[ -n "$SPID" ]]; then kill "$SPID" >/dev/null 2>&1 || true; wait "$SPID" 2>/dev/null || true; fi
  rm -f /tmp/boom-admin-deny-$$.js /tmp/boom-admin-allow-$$.js
}
trap cleanup EXIT
cat >/tmp/boom-admin-deny-$$.js <<'JS'
window.BoomRuntime={version:"TEST",adminReady:async()=>({ok:false,reason:"AUTH_REQUIRED"}),emit:()=>{}};
JS
cat >/tmp/boom-admin-allow-$$.js <<'JS'
window.BoomRuntime={version:"TEST",adminReady:async()=>({ok:true,session:{user:{id:"e2e-admin"}}}),emit:()=>{}};
JS
cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/boom-admin-e2e-$$.log 2>&1 &
SPID=$!
sleep .4
check(){ local s="$1" label="$2" expr="$3" result; result="$(npx -y agent-browser --session "$s" eval "($expr) ? 'PASS' : 'FAIL'")"; [[ "$result" == *PASS* ]] || { echo "FAIL: $label"; exit 1; }; echo "PASS: $label"; }

npx -y agent-browser --session "$DENY" --init-script /tmp/boom-admin-deny-$$.js open "http://127.0.0.1:$PORT/boom-brain-studio.html" >/dev/null
npx -y agent-browser --session "$DENY" wait 400 >/dev/null
check "$DENY" "unauthorized Studio stays locked" "document.body.dataset.adminReady==='false'"
check "$DENY" "private shell does not flash" "getComputedStyle(document.querySelector('.bs-shell')).display==='none'"
check "$DENY" "contracts are not loaded before admin" "document.querySelector('#bs-contract-state')?.textContent==='Loading contracts…'"
npx -y agent-browser --session "$DENY" close >/dev/null 2>&1 || true

npx -y agent-browser --session "$ALLOW" --init-script /tmp/boom-admin-allow-$$.js open "http://127.0.0.1:$PORT/boom-brain-studio.html" >/dev/null
npx -y agent-browser --session "$ALLOW" wait 700 >/dev/null
check "$ALLOW" "authorized Studio unlocks" "document.body.dataset.adminReady==='true'"
check "$ALLOW" "Brain OS metrics render" "document.querySelectorAll('#bs-metrics .bs-metric').length===5"
check "$ALLOW" "contracts load only after admin" "document.querySelector('#bs-contract-state')?.textContent.includes('contracts loaded')"
errors="$(npx -y agent-browser --session "$ALLOW" errors || true)"
[[ -z "$(printf '%s' "$errors" | tr -d '[:space:]')" ]] || { echo "FAIL: browser errors"; printf '%s\n' "$errors"; exit 1; }
echo "BOOM admin gate E2E: PASS — private Studio locked before authorization and opens after admin approval."