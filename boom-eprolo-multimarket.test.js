const fs=require("fs"),assert=require("assert");
const scan1=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-WAVE1-2026-09-23.json","utf8"));
const scan2=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-WAVE2-2026-09-23.json","utf8"));
const qa=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-VISUAL-QA-2026-09-23.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-SHADOW-SHELF-2026-09-23.json","utf8"));

assert.equal(scan1.production_effect,false);
assert.equal(scan1.summary.checked,7);
assert.equal(scan1.summary.market_pass_counts.IL,0);
assert.equal(scan1.summary.market_pass_counts.DE,4);
assert.equal(scan1.summary.market_pass_counts.US,3);

assert.equal(scan2.production_effect,false);
assert.equal(scan2.summary.checked,7);
assert.equal(scan2.summary.markets.length,13);
assert.equal(scan2.summary.shipping_pass_counts.IL,0);
assert.equal(scan2.summary.shipping_pass_counts.DE,4);
assert.equal(scan2.summary.shipping_pass_counts.FR,4);
assert.equal(scan2.summary.shipping_pass_counts.IT,3);
assert.equal(scan2.summary.shipping_pass_counts.ES,4);
assert.equal(scan2.summary.shipping_pass_counts.NL,3);
assert.equal(scan2.summary.shipping_pass_counts.GB,4);
assert.equal(scan2.summary.shipping_pass_counts.US,3);
assert.equal(scan2.summary.shipping_pass_counts.CA,4);
assert.equal(scan2.summary.shipping_pass_counts.AU,2);
assert.equal(scan2.summary.shipping_pass_counts.AE,2);
assert.equal(scan2.summary.shipping_pass_counts.JP,2);
assert.equal(scan2.summary.shipping_pass_counts.SG,5);
assert.equal(scan2.summary.live_eligible_products,0);

assert.equal(qa.production_effect,false);
assert.equal(qa.summary.reviewed,4);
assert.equal(qa.summary.pass_market_shadow,2);
assert.equal(qa.summary.brand_rights_review,1);
assert.equal(qa.summary.claim_function_review,1);

assert.equal(shelf.version,"HUNT-EPROLO-MULTIMARKET-SHADOW-SHELF-V2");
assert.equal(shelf.production_effect,false);
assert.equal(shelf.summary.unique_products,2);
assert.equal(shelf.summary.markets_checked,13);
assert.equal(shelf.summary.shadow_product_counts_by_market.IL,0);
assert.equal(shelf.summary.shadow_product_counts_by_market.DE,2);
assert.equal(shelf.summary.shadow_product_counts_by_market.FR,2);
assert.equal(shelf.summary.shadow_product_counts_by_market.GB,2);
assert.equal(shelf.summary.shadow_product_counts_by_market.US,2);
assert.equal(shelf.summary.shadow_product_counts_by_market.CA,2);
assert.equal(shelf.summary.shadow_product_counts_by_market.AU,1);
assert.equal(shelf.summary.shadow_product_counts_by_market.AE,1);
assert.equal(shelf.summary.shadow_product_counts_by_market.JP,1);
assert.equal(shelf.summary.shadow_product_counts_by_market.SG,2);
assert.equal(shelf.summary.mapped_policy_shadow_counts_by_market.CA,0);
assert.equal(shelf.summary.mapped_policy_shadow_counts_by_market.AE,0);
assert.equal(shelf.summary.mapped_policy_shadow_counts_by_market.JP,0);
assert.equal(shelf.summary.mapped_policy_shadow_counts_by_market.SG,0);
assert.equal(shelf.summary.live_eligible_products,0);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);

const ids=new Set(shelf.products.map(x=>x.product_id));
assert.deepEqual(ids,new Set(["24539904","26556212"]));
for(const p of shelf.products){
  assert(!p.shadow_eligible_markets.includes("IL"));
  assert(p.shadow_eligible_markets.includes("DE"));
  assert(p.shadow_eligible_markets.includes("GB"));
  assert(p.shadow_eligible_markets.includes("US"));
  assert(p.unmapped_policy_hold_markets.includes("CA"));
  assert(p.unmapped_policy_hold_markets.includes("SG"));
  assert.equal(p.final_profit_verified,false);
  assert.equal(p.production_exposure,false);
  assert.equal(p.checkout,"DISABLED");
  assert.equal(p.fulfillment,"DISABLED");
  assert(p.exact_variant_image_url);
  for(const m of Object.values(p.market_truth)) assert.equal(m.live_eligible,false);
}
assert(!ids.has("25354414"));
assert(!ids.has("31441975"));
console.log("PASS boom-eprolo-multimarket-v2");
