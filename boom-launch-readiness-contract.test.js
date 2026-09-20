const fs=require("fs");
const assert=require("assert");

const src=fs.readFileSync("supabase/functions/hunt-launch-readiness/index.ts","utf8");
const contract=JSON.parse(fs.readFileSync("boom-launch-readiness-contract.json","utf8"));

assert.equal(contract.version,"HUNT-LAUNCH-READINESS-V1");
assert.equal(contract.owner,"owner_gate");
assert.equal(contract.current_policy.payment,"PRELAUNCH_ONLY");
assert.equal(contract.current_policy.production_deploy,"OWNER_APPROVAL_REQUIRED");

for(const needle of [
  "hunt_payplus_status_observations",
  "success_observation_captured",
  "reject_observation_captured",
  "payplus_status_proof",
  "PAYPLUS_STATUS_PROOF",
  "proofReadiness",
  "callback_accept_paid_owner_approved"
]) assert(src.includes(needle),"Launch Readiness missing "+needle);

assert(src.includes("hunt_order_events?select=id,status,label,created_at"),
  "Launch Readiness must use actual hunt_order_events schema");
assert(!src.includes("hunt_order_events?select=id,event_type"),
  "Launch Readiness still references nonexistent hunt_order_events.event_type");

const expectedDynamic=[
  "business_identity_runtime",
  "legal_documents_runtime",
  "checkout_prelaunch_proof",
  "unit_economics_proof",
  "payplus_runtime",
  "payplus_status_proof",
  "runtime_order_state",
  "analytics_runtime",
  "merchant_program_runtime"
];
assert.deepEqual(contract.dynamic_gates.map(x=>x.gate_key),expectedDynamic);
for(const gate of expectedDynamic){
  assert(src.includes('"'+gate+'"'),"Edge Launch Readiness missing contract gate "+gate);
}

assert.equal(contract.source_of_truth.legal_documents_table,"hunt_legal_document_versions");
assert(src.includes('rest("hunt_legal_document_versions?'),
  "Edge Launch Readiness does not query legal registry");

for(const migration of contract.required_source_migrations_after_live_20260919193323){
  assert(fs.existsSync("supabase/migrations/"+migration),
    "Required post-live source migration missing: "+migration);
}

for(const invariant of [
  "No public launch while any soft-launch blocker is non-PASS.",
  "No real-money launch while any real-money blocker is non-PASS.",
  "No production deploy without explicit Owner approval."
]){
  assert(contract.hard_invariants.includes(invariant),"Launch invariant missing: "+invariant);
}

console.log("BOOM launch readiness contract: PASS — static contract matches Edge gates and source migrations");
