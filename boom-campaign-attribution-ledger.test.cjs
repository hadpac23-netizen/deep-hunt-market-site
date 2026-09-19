const assert=require("node:assert");
const L=require("./boom-campaign-attribution-ledger.js");

const r=L.evaluate({
  table_exists:true,rls_enabled:true,anon_blocked:true,authenticated_blocked:true,
  service_role_granted:true,raw_click_ids_excluded:true,payment_session_unique_link:true,
  provider_validation_gate:true,payment_live_enabled:false,payplus_callback_accept_paid:false,
  total_rows:2,with_click_digest:2,pending_provider_validation:2,
  provider_verified:0,server_confirmed_purchases:0,conversion_claim_allowed:0
});
assert.strictEqual(r.state,"LEDGER_READY");
assert.strictEqual(r.ledger_ready,true);
assert.strictEqual(r.provider_click_validation,false);
assert.strictEqual(r.paid_attribution_ready,false);
assert.strictEqual(r.payments_live,false);
assert.strictEqual(r.execute_actions,false);

console.log("boom_campaign_attribution_ledger=PASS");