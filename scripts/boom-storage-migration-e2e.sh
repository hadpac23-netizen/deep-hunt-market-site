#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${HUNT_STORAGE_E2E_PORT:-8888}"
SESSION="boom-storage-$$"
FIXTURE="$ROOT/.storage-migration-e2e.html"
INIT="/tmp/boom-storage-init-$$.js"
SPID=""
ab(){ npx -y agent-browser --session "$SESSION" "$@"; }
cleanup(){
  ab close >/dev/null 2>&1 || true
  if [[ -n "$SPID" ]]; then kill "$SPID" >/dev/null 2>&1 || true; wait "$SPID" 2>/dev/null || true; fi
  rm -f "$FIXTURE" "$INIT"
}
trap cleanup EXIT
cat >"$FIXTURE" <<'HTML'
<!doctype html><html><body><select data-lang-select><option value="en">EN</option><option value="he">HE</option></select>
<script src="boom-storage-migrations.js"></script><script src="i18n.js"></script>
<script>window.HuntI18n.start("deal");</script></body></html>
HTML
cat >"$INIT" <<'JS'
localStorage.setItem("hunt_language","iw-IL");
localStorage.removeItem("hunt_language_v1");
JS
cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/boom-storage-e2e-$$.log 2>&1 &
SPID=$!
ready=0
for _ in {1..40}; do
  if curl -fsS "http://127.0.0.1:$PORT/.storage-migration-e2e.html" >/dev/null 2>&1; then ready=1; break; fi
  sleep .1
done
[[ "$ready" == "1" ]] || { echo "FAIL: local storage E2E server did not start"; exit 1; }
ab --init-script "$INIT" open "http://127.0.0.1:$PORT/.storage-migration-e2e.html" >/dev/null
ab wait 300 >/dev/null
check(){ local label="$1" expr="$2" result; result="$(ab eval "($expr) ? 'PASS' : 'FAIL'")"; [[ "$result" == *PASS* ]] || { echo "FAIL: $label"; exit 1; }; echo "PASS: $label"; }
check "legacy language migrated" "localStorage.getItem('hunt_language_v1')==='he'"
check "legacy key removed after verified write" "localStorage.getItem('hunt_language')===null"
check "document language restored" "document.documentElement.lang==='he'"
check "RTL restored for Hebrew" "document.documentElement.dir==='rtl'"
check "language selector reflects migration" "document.querySelector('[data-lang-select]')?.value==='he'"
errors="$(ab errors || true)"
[[ -z "$(printf '%s' "$errors" | tr -d '[:space:]')" ]] || { echo "FAIL: browser errors"; printf '%s\n' "$errors"; exit 1; }
echo "BOOM storage migration E2E: PASS — legacy language safely migrated to versioned storage."