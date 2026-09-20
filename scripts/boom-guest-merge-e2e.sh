#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${HUNT_GUEST_E2E_PORT:-8880}"
SESSION="boom-guest-merge-$$"
FIXTURE="$ROOT/.guest-merge-e2e.html"
SPID=""
ab(){ npx -y agent-browser --session "$SESSION" "$@"; }
cleanup(){
  ab close >/dev/null 2>&1 || true
  if [[ -n "$SPID" ]]; then kill "$SPID" >/dev/null 2>&1 || true; wait "$SPID" 2>/dev/null || true; fi
  rm -f "$FIXTURE"
}
trap cleanup EXIT
cat >"$FIXTURE" <<'HTML'
<!doctype html><html><body><script>
const localKey="hunt_local_product_actions_v1";
localStorage.setItem(localKey,JSON.stringify({"CJdropshipping:E2E-GUEST":{provider:"CJdropshipping",item_id:"E2E-GUEST",title:"Guest Item",liked:true,saved:false,liked_at:"2026-09-20T00:00:00.000Z"}}));
window.__db=[];
function chain(mode,payload){
  const c={select(){mode="select";return c},order(){return c},limit(){return c},eq(){return c},
    upsert(value){mode="upsert";payload=value;window.__db=[value];return c},delete(){mode="delete";return c},single(){return c},
    then(resolve){resolve(mode==="select"?{data:window.__db,error:null}:{data:payload,error:null});}};
  return c;
}const client={from(){return chain("select")}};
window.HuntCore={esc:s=>String(s),publishableKey:"test",recordSignal:()=>{}};
window.supabase={createClient:()=>client};
window.BoomRuntime={version:"TEST",getSupabaseClient:()=>client,subscribeSession:fn=>{window.__sessionCb=fn;return()=>{}},
  runAction:async(_id,opts)=>opts.execute({correlationId:"test"}),announce:()=>{}};
</script><script src="shopping-actions.js"></script></body></html>
HTML
cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/boom-guest-e2e-$$.log 2>&1 &
SPID=$!
sleep .4
ab open "http://127.0.0.1:$PORT/.guest-merge-e2e.html"
ab wait 250
ab eval "(async()=>{await window.__sessionCb({user:{id:'e2e-user'}});return true})()" >/dev/null
check(){
  local label="$1" expr="$2" result
  result="$(ab eval "($expr) ? 'PASS' : 'FAIL'")"
  [[ "$result" == *PASS* ]] || { echo "FAIL: $label"; exit 1; }
  echo "PASS: $label"
}
check "guest state clears after account upsert" "localStorage.getItem('hunt_local_product_actions_v1')===null"
check "guest like merges into account row" "window.__db[0]?.user_id==='e2e-user' && window.__db[0]?.liked===true"
check "provider and item identity survive merge" "window.__db[0]?.provider==='CJdropshipping' && window.__db[0]?.item_id==='E2E-GUEST'"
errors="$(ab errors || true)"
[[ -z "$(printf '%s' "$errors" | tr -d '[:space:]')" ]] || { echo "FAIL: browser errors"; printf '%s\n' "$errors"; exit 1; }
echo "BOOM guest→account E2E: PASS — local likes/saves merge before guest state clears."