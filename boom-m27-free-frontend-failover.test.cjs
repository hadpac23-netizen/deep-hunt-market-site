const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const failover=fs.readFileSync("boom-free-frontend-failover.js","utf8");

for(const token of [
  "M27 · FREE FRONTEND FAILOVER",
  'id="bg-frontend-failover-state"',
  'id="bg-frontend-failover-stats"',
  'id="bg-frontend-failover-proof"',
  'id="bg-frontend-failover-boundary"',
  'boom-free-frontend-failover.js?v=m27'
]) assert(html.includes(token),"M27 Studio surface missing: "+token);

for(const token of [
  "const FrontendFailover=window.BoomFreeFrontendFailover",
  "frontendFailover=FrontendFailover?.evaluate?.()",
  '"M27","Free Frontend Failover","BoomFreeFrontendFailover","PANEL"',
  "function renderFrontendFailover",
  "renderFrontendFailover(data)"
]) assert(studio.includes(token),"M27 Studio integration missing: "+token);

for(const token of [
  'primary_host_status:"usage_exceeded"',
  "primary_http_status:503",
  "paid_host_upgrade_performed:false",
  'fallback_host:"github_pages"',
  'fallback_source_branch:"m26-pages-fallback"',
  'fallback_commit:"2709295a634faf8562b6e0be8824744a6ec3688e"',
  'fallback_build_status:"built"',
  "browser_consent_verified:true",
  "browser_checkout_verified:true",
  "browser_payment_button_disabled:true",
  'db_payment_mode:"prelaunch"',
  "db_paid_at:null",
  "db_order_id:null",
  'db_attribution_status:"browser_context_unverified"',
  "db_attribution_verified:false",
  'db_payment_event_type:"prelaunch_session_created"',
  "payment_live_enabled:false",
  "payplus_callback_accept_paid:false",
  'rollback_pages_source_branch:"main"'
]) assert(failover.includes(token),"M27 failover receipt missing: "+token);

console.log("boom_m27_free_frontend_failover_contract=PASS");