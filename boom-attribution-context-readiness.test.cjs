const assert=require("node:assert");
const A=require("./boom-attribution-context-readiness.js");

const preview=A.evaluate({
  consent_gated_capture:true,
  browser_first_touch:true,
  browser_last_touch:true,
  checkout_payload_context:true,
  server_session_snapshot:true,
  live_server_session_snapshot:false,
  server_purchase_linkage:false,
  provider_click_validation:false
});
assert.strictEqual(preview.state,"LOCAL_PREVIEW");
assert.strictEqual(preview.local_preview_ready,true);
assert.strictEqual(preview.live_attribution_context_ready,false);
assert.strictEqual(preview.conversion_claim_allowed,false);

const live=A.evaluate({
  consent_gated_capture:true,browser_first_touch:true,browser_last_touch:true,
  checkout_payload_context:true,server_session_snapshot:true,
  live_server_session_snapshot:true,server_purchase_linkage:true,provider_click_validation:true
});
assert.strictEqual(live.state,"OWNER_REVIEW");
assert.strictEqual(live.live_attribution_context_ready,true);
assert.strictEqual(live.paid_launch,false);
assert.strictEqual(live.execute_actions,false);
console.log("boom_attribution_context_readiness=PASS");