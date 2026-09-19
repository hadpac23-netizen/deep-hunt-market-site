const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const readiness=fs.readFileSync("boom-payplus-status-readiness.js","utf8");
const callback=fs.readFileSync("supabase/functions/hunt-payplus-callback/index.ts","utf8");
const mapper=fs.readFileSync("supabase/functions/hunt-payplus-callback/payplus-status-map.mjs","utf8");
const migration=fs.readFileSync("supabase/migrations/20260919144610_payplus_status_observations.sql","utf8");

for(const token of [
  "M30 · PAYPLUS STATUS MAPPING",
  'id="bg-payplus-status-state"',
  'id="bg-payplus-status-stats"',
  'id="bg-payplus-status-proof"',
  'id="bg-payplus-status-sandbox"',
  'boom-payplus-status-readiness.js?v=m30'
]) assert(html.includes(token),"M30 Studio surface missing: "+token);

for(const token of [
  "const PayPlusStatus=window.BoomPayPlusStatusReadiness",
  "payPlusStatus=PayPlusStatus?.evaluate?.()",
  '"M30","PayPlus Status Mapping","BoomPayPlusStatusReadiness","PANEL"',
  'domain:"payplus_status_mapping"',
  "renderPayPlusStatus(data)"
]) assert(studio.includes(token),"M30 Studio integration missing: "+token);

for(const token of [
  'callback_version:9',
  "hmac_user_agent_gate:true",
  "independent_ipn_full_verification:true",
  'observation_migration_version:"20260919144610"',
  "sandbox_success_proven:false",
  "sandbox_reject_proven:false",
  "provider_status_mapping_ready:false",
  "payment_live_enabled:false",
  "payplus_callback_accept_paid:false",
  "accepted_paid_observations:0"
]) assert(readiness.includes(token),"M30 readiness receipt missing: "+token);

for(const token of [
  "verifyPayPlusCallbackHeaders",
  "classifyPayPlusStatus",
  "hunt_payplus_status_observations",
  "accepted_paid:false",
  "PROVIDER_STATUS_MAPPING_REQUIRES_SANDBOX_PROOF"
]) assert(callback.includes(token),"M30 callback hardening missing: "+token);

for(const token of [
  '1:"CHARGE_J4"',
  '2:"APPROVAL_J5"',
  'CHARGE_CANDIDATE_SANDBOX_PROOF_REQUIRED',
  'APPROVAL_NOT_PAID',
  'UNKNOWN_HOLD',
  'paid_state_write_allowed:false'
]) assert(mapper.includes(token),"M30 mapper missing: "+token);

assert(migration.includes("enable row level security"));
assert(migration.includes("check (accepted_paid = false)"));
assert(migration.includes('using (false)'));
assert(migration.includes('with check (false)'));

console.log("boom_m30_payplus_status_readiness_contract=PASS");