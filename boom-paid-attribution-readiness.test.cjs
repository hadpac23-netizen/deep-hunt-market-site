const assert=require("node:assert");
const R=require("./boom-paid-attribution-readiness.js");

const current=R.evaluate({
  browser_event_id_generation:true,
  ga4_configured:true,
  first_party_signal_live:true,
  live_event_id_persistence:false,
  durable_server_dedup:false,
  server_purchase_confirmation:false,
  campaign_touchpoint_persistence:false,
  purchase_touchpoint_linkage:false,
  provider_click_validation:false,
  paid_destination_connection:false,
  owner_paid_approval:false,
  local_preview_event_id_patch:true,
  live_function_version:8
});
assert.strictEqual(current.state,"HOLD");
assert.strictEqual(current.paid_attribution_ready,false);
assert.strictEqual(current.local_preview_event_id_patch,true);
assert.strictEqual(current.live_function_version,8);
assert(current.blockers.includes("live_event_id_persistence_missing"));
assert(current.blockers.includes("server_purchase_confirmation_missing"));

const persisted=R.evaluate({
  browser_event_id_generation:true,
  first_party_signal_live:true,
  live_event_id_persistence:true,
  durable_server_dedup:false,
  server_purchase_confirmation:false,
  campaign_touchpoint_persistence:false,
  purchase_touchpoint_linkage:false,
  provider_click_validation:false
});
assert.strictEqual(persisted.state,"PARTIAL");
assert.strictEqual(persisted.measurement_core_ready,true);
assert.strictEqual(persisted.paid_attribution_ready,false);

const full=R.evaluate({
  browser_event_id_generation:true,
  first_party_signal_live:true,
  live_event_id_persistence:true,
  durable_server_dedup:true,
  server_purchase_confirmation:true,
  campaign_touchpoint_persistence:true,
  purchase_touchpoint_linkage:true,
  provider_click_validation:true,
  paid_destination_connection:false,
  owner_paid_approval:false
});
assert.strictEqual(full.state,"OWNER_REVIEW");
assert.strictEqual(full.paid_attribution_ready,true);
assert.strictEqual(full.paid_launch,false);
assert.strictEqual(full.paid_spend,false);
assert.strictEqual(full.execute_actions,false);
console.log("boom_paid_attribution_readiness=PASS");