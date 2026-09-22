const fs=require("fs"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-eprolo-market-eligibility-contract.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-SHADOW-SHELF-2026-09-23.json","utf8"));

assert.equal(c.version,"HUNT-EPROLO-MARKET-ELIGIBILITY-V1");
assert.equal(c.mode,"SHADOW_GLOBAL");
assert.equal(c.authority,"NONE");
assert.equal(c.current_wave2.products_checked,7);
assert.equal(c.current_wave2.markets_checked.length,13);
assert.equal(c.current_wave2.shipping_pass_counts.IL,0);
assert.equal(c.current_wave2.shipping_pass_counts.SG,5);
assert.deepEqual(c.current_wave2.product_truth_pass_ids,["24539904","26556212"]);
assert.deepEqual(c.current_wave2.product_truth_hold_ids,["25354414","31441975"]);
assert.equal(c.current_wave2.live_eligible_products,0);
assert.equal(c.unmapped_discovery_markets.CA,"HOLD_UNMAPPED");
assert.equal(c.unmapped_discovery_markets.AE,"HOLD_UNMAPPED");
assert.equal(c.unmapped_discovery_markets.JP,"HOLD_UNMAPPED");
assert.equal(c.unmapped_discovery_markets.SG,"HOLD_UNMAPPED");
assert.equal(c.mapped_policy_regions.DE,"EU_REVIEW_REQUIRED");
assert.equal(c.mapped_policy_regions.GB,"REVIEW_REQUIRED");
assert.equal(c.mapped_policy_regions.US,"REVIEW_REQUIRED");
assert.equal(c.mapped_policy_regions.AU,"REVIEW_REQUIRED");

for(const p of shelf.products){
  for(const [cc,m] of Object.entries(p.market_truth)){
    assert.equal(m.product_market_shadow_pass,true);
    assert.equal(m.live_eligible,false);
    if(["CA","AE","JP","SG"].includes(cc)) assert.equal(m.market_policy_state,"HOLD_UNMAPPED");
  }
}
assert.equal(shelf.summary.live_eligible_products,0);
assert.equal(shelf.production_effect,false);
console.log("PASS boom-eprolo-market-eligibility");
