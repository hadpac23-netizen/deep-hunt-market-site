const assert=require("node:assert");
const B=require("./boom-purchase-attribution-bridge.js");

const receipt=B.evaluate();
assert.strictEqual(receipt.state,"BRIDGE_READY");
assert.strictEqual(receipt.bridge_ready,true);
assert.strictEqual(receipt.total_sessions,23);
assert.strictEqual(receipt.campaign_context_present,3);
assert.strictEqual(receipt.server_confirmed_purchases,0);
assert.strictEqual(receipt.profit_evidence_ready,0);
assert.strictEqual(receipt.conversion_claim_allowed,0);
assert.strictEqual(receipt.provider_status_mapping_ready,false);
assert.strictEqual(receipt.payments_live,false);

const empty=B.evaluate([]);
assert.strictEqual(empty.total_sessions,0);
assert.strictEqual(empty.server_purchase_confirmation,false);
assert.strictEqual(empty.purchase_touchpoint_linkage,false);
assert.strictEqual(empty.provider_click_validation,false);
assert.strictEqual(empty.profit_evidence_available,false);
assert.strictEqual(empty.paid_attribution_ready,false);
assert.strictEqual(empty.execute_actions,false);

const proven=B.evaluate([{
  provider_payment_confirmation:true,
  paid_timestamp_present:true,
  real_order_linked:true,
  server_purchase_confirmation:true,
  campaign_context_present:true,
  purchase_touchpoint_linkage:true,
  provider_click_validation:true,
  finance_ledger_present:true,
  profit_evidence_ready:true,
  conversion_claim_allowed:true
}]);
assert.strictEqual(proven.server_confirmed_purchases,1);
assert.strictEqual(proven.purchase_touchpoint_linked,1);
assert.strictEqual(proven.provider_click_validated,1);
assert.strictEqual(proven.profit_evidence_ready,1);
assert.strictEqual(proven.conversion_claim_allowed,1);
assert.strictEqual(proven.paid_attribution_ready,false);
assert.strictEqual(proven.execute_actions,false);

console.log("boom_purchase_attribution_bridge=PASS");