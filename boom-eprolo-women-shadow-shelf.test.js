const fs=require("fs"),assert=require("assert");
const truth=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2-2026-09-22.json","utf8"));
const visual=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WOMEN-DRESSES-VISUAL-QA-2026-09-22.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WOMEN-SHADOW-SHELF-2026-09-22.json","utf8"));

assert.equal(truth.version,"HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2");
assert.equal(truth.production_effect,false);
assert.equal(truth.summary.checked,12);
assert.equal(truth.summary.shipping_verified,12);
assert.equal(truth.summary.high_shipping_review,2);
assert.equal(truth.summary.final_profit_verified,0);
assert.equal(truth.summary.checkout_live,0);

const setA=truth.results.find(x=>x.product_id==="22274784");
const setB=truth.results.find(x=>x.product_id==="22272639");
assert.equal(setA.variant_scope,"FULL_SET_REQUIRED");
assert(/^Set-/i.test(setA.variant.title));
assert.equal(setB.variant_scope,"FULL_SET_REQUIRED");
assert(/^2pcs-/i.test(setB.variant.title));
assert(setA.variant.supplier_cost_usd>7.16,"full set must not use component-only price");
assert(setB.variant.supplier_cost_usd>6.98,"full set must not use top-only price");

assert.equal(visual.production_effect,false);
assert.equal(visual.exact_variant_image_required,true);
assert.equal(visual.passes.length,4);
assert(visual.holds.some(x=>x.product_id==="22272657"));
assert(visual.holds.some(x=>x.product_id==="22272639"));
for(const x of visual.passes){
  assert(x.exact_variant_image_url);
  assert(/^PASS_SHELF/.test(x.status));
}

assert.equal(shelf.version,"HUNT-EPROLO-WOMEN-SHADOW-SHELF-V1");
assert.equal(shelf.production_effect,false);
assert.equal(shelf.mode,"SHADOW_CANDIDATE_SHELF");
assert.equal(shelf.summary.products,4);
assert.equal(shelf.summary.exact_variant_images,4);
assert.equal(shelf.summary.stock_verified,4);
assert.equal(shelf.summary.shipping_verified_il,4);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);
assert.equal(shelf.summary.fulfillment_live,0);
for(const x of shelf.products){
  assert.equal(x.provider,"EPROLO");
  assert.equal(x.stock_verified,true);
  assert.equal(x.stock_available,true);
  assert(x.exact_variant_image_url);
  assert.equal(x.final_profit_verified,false);
  assert.equal(x.production_exposure,false);
  assert.equal(x.checkout,"DISABLED");
  assert.equal(x.fulfillment,"DISABLED");
  assert(x.shipping_il.cost_usd>0);
  assert(x.retail_price_shadow_usd>0);
}
console.log("PASS boom-eprolo-women-shadow-shelf");
