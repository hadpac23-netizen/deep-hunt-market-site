const fs=require("fs");
const assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-launch-readiness/index.ts","utf8");

for(const needle of [
  "hunt_payplus_status_observations",
  "success_observation_captured",
  "reject_observation_captured",
  "payplus_status_proof",
  "PAYPLUS_STATUS_PROOF",
  "proofReadiness",
  "callback_accept_paid_owner_approved"
]) assert(src.includes(needle),"Launch Readiness missing "+needle);

assert(src.includes('hunt_order_events?select=id,status,label,created_at'),
  "Launch Readiness must use actual hunt_order_events schema");
assert(!src.includes('hunt_order_events?select=id,event_type'),
  "Launch Readiness still references nonexistent hunt_order_events.event_type");

console.log("BOOM launch readiness contract: PASS — PayPlus proof evidence and real order-event schema enforced");