const assert=require("node:assert");
const V=require("./boom-provider-click-validation.js");

const detected=V.evaluate({attribution:{last_touch:{gclid:"qa-click"}}});
assert.strictEqual(detected.state,"PROVIDER_DETECTED_UNVERIFIED");
assert.strictEqual(detected.detected.provider,"GOOGLE_ADS");
assert.strictEqual(detected.detected.click_id_type,"gclid");
assert.strictEqual(detected.provider_click_validation,false);
assert.strictEqual(detected.raw_click_id_exposed,false);
assert.strictEqual(detected.conversion_claim_allowed,false);

const ambiguous=V.evaluate({attribution:{last_touch:{gclid:"a",fbclid:"b"}}});
assert.strictEqual(ambiguous.state,"AMBIGUOUS_PROVIDER_CLICK_IDS");
assert.strictEqual(ambiguous.provider_click_validation,false);

const verified=V.evaluate({
  attribution:{last_touch:{gclid:"qa-click"}},
  official_api_verified:true,
  evidence_ref:"official-api-proof-ref",
  verified_at:"2026-09-19T14:15:00Z",
  verified_provider:"GOOGLE_ADS",
  verified_click_id_type:"gclid"
});
assert.strictEqual(verified.state,"VERIFIED");
assert.strictEqual(verified.provider_click_validation,true);
assert.strictEqual(verified.conversion_claim_allowed,false);
assert.strictEqual(verified.execute_actions,false);

const aggregate=V.evaluateLedger({provider_verified:0,pending_provider_validation:3});
assert.strictEqual(aggregate.state,"PENDING_PROVIDER_VALIDATION");
assert.strictEqual(aggregate.provider_click_validation,false);
assert.strictEqual(aggregate.official_api_evidence_required,true);
assert.strictEqual(aggregate.raw_click_id_exposed,false);

console.log("boom_provider_click_validation=PASS");