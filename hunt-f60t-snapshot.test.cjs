const fs=require("node:fs");
const assert=require("node:assert/strict");
const code=fs.readFileSync("supabase/functions/hunt-f60t-snapshot/index.ts","utf8");

for(const token of [
  'createSupabaseContext(req,{auth:["user","none"]})',
  "ADMIN_OR_CRON_REQUIRED",
  "x-f60t-cron-secret",
  "f60t_cron_auth",
  "analytics_events",
  "f60t_crowd_signal_snapshots",
  "f60t_external_signal_runs",
  '.neq("source_key","hunt_first_party")',
  "external_signals:{",
  "world_watch:worldWatch",
  'code:"SEARCH_RADAR"',
  'code:"SOCIAL_DISCOVERY_RADAR"',
  'code:"COMMUNITY_RADAR"',
  'code:"CREATOR_LIVE_RADAR"',
  'code:"AGENT_RADAR"',
  "skill_count:40",
  'cadence:"HOURLY"',
  "hunt_purchase_attribution_bridge",
  "provider_payment_confirmation===true",
  "server_purchase_confirmation===true",
  "finance_is_test===false",
  "profit_evidence_ready===true",
  "settlement_required_for_verified_net:true",
  "f60t_hourly_profit_ledger",
  "f60t_agent_signal_events",
  "crowd_signals_ready:crowdSignalsReady",
  "local_buying_clock_ready:localBuyingClockReady"
]) assert(code.includes(token),"F60T snapshot missing: "+token);

assert(!code.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert(!code.includes("service_role"));
console.log("hunt_f60t_snapshot_contract=PASS");