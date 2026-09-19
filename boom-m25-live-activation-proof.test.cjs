const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const proof=fs.readFileSync("boom-live-activation-proof.js","utf8");
const edge=fs.readFileSync("supabase/functions/hunt-commerce-signal/index.ts","utf8");
const m1=fs.readFileSync("supabase/migrations/20260919133622_add_durable_event_identity.sql","utf8");
const m2=fs.readFileSync("supabase/migrations/20260919134205_enable_durable_event_identity_runtime.sql","utf8");

for(const token of [
  "M25 · LIVE ACTIVATION VERIFICATION",
  'id="bg-live-activation-state"',
  'id="bg-live-activation-stats"',
  'id="bg-live-activation-proof"',
  'id="bg-live-activation-payment"',
  'boom-live-activation-proof.js?v=m25'
]) assert(html.includes(token),"M25 Studio surface missing: "+token);

for(const token of [
  "const LiveActivationProof=window.BoomLiveActivationProof",
  "liveActivation=LiveActivationProof?.evaluate?.()",
  "live_event_id_persistence:liveActivation.live_event_id_persistence===true",
  "live_function_atomic_dedup:liveActivation.durable_ready===true",
  "renderLiveActivation(data)"
]) assert(studio.includes(token),"M25 Studio integration missing: "+token);

for(const token of [
  'migration_version:"20260919133622"',
  "edge_function_version:11",
  "public_top_level_event_id_blocked:true",
  "public_metadata_event_id_blocked:true",
  "legacy_noncanonical_compatible:true",
  "duplicate_proof_rows:1",
  "duplicate_canonical_rows_observed:0",
  "durable_database_dedup_verified:true",
  "live_event_id_persistence_verified:true",
  "payment_live_enabled:false",
  "payplus_callback_accept_paid:false"
]) assert(proof.includes(token),"M25 receipt missing: "+token);

for(const token of [
  "hunt_runtime_controls?key=eq.hunt_durable_event_identity",
  "durableIdentityEnabled&&eventId",
  "?on_conflict=event_id",
  "resolution=ignore-duplicates,return=representation",
  "durable_cross_worker_dedup:true",
  "paid_attribution:false"
]) assert(edge.includes(token),"M25 live Edge contract missing: "+token);

assert(m1.includes("add column event_id text null"));
assert(m1.includes("analytics_events_event_id_key unique (event_id)"));
assert(m2.includes("'hunt_durable_event_identity'"));
assert(m2.includes("enabled=true"));
assert(!m2.includes("hunt_payment_live"));
assert(!m2.includes("hunt_payplus_callback_accept_paid"));

console.log("boom_m25_live_activation_proof_contract=PASS");