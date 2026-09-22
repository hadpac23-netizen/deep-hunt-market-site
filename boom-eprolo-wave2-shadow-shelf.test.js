const fs=require("fs"),assert=require("assert");
const scan=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE2-IL-SCAN-2026-09-22.json","utf8"));
const visual=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE2-VISUAL-QA-2026-09-22.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE2-SHADOW-SHELF-2026-09-22.json","utf8"));

assert.equal(scan.version,"HUNT-EPROLO-WAVE2-IL-SCAN-V1");
assert.equal(scan.production_effect,false);
assert.equal(scan.summary.checked,10);
assert.equal(scan.summary.shipping_verified,10);
assert.equal(scan.summary.normal_shipping,3);
assert.equal(scan.summary.high_shipping_review,7);
assert.equal(scan.summary.exact_variant_images,10);
assert.equal(scan.summary.final_profit_verified,0);
assert.equal(scan.summary.checkout_live,0);

const home=scan.results.find(x=>x.product_id==="31495410");
assert.equal(home.commercial_training_flag,"NORMAL_SHIPPING_BURDEN");
assert.equal(home.image_scope,"EXACT_VARIANT");
const pet1=scan.results.find(x=>x.product_id==="24181199");
const pet2=scan.results.find(x=>x.product_id==="24167510");
assert.equal(pet1.commercial_training_flag,"NORMAL_SHIPPING_BURDEN");
assert.equal(pet2.commercial_training_flag,"NORMAL_SHIPPING_BURDEN");

assert.equal(visual.production_effect,false);
assert.equal(visual.passes.length,2);
assert(visual.passes.some(x=>x.product_id==="24181199"));
assert(visual.passes.some(x=>x.product_id==="24167510"));
assert(visual.holds.some(x=>x.product_id==="31495410"&&x.status==="IMAGE_CLAIMS_REVIEW"));

assert.equal(shelf.version,"HUNT-EPROLO-WAVE2-SHADOW-SHELF-V1");
assert.equal(shelf.production_effect,false);
assert.equal(shelf.summary.products,2);
assert.equal(shelf.summary.pets,2);
assert.equal(shelf.summary.home,0);
assert.equal(shelf.summary.stock_verified,2);
assert.equal(shelf.summary.shipping_verified_il,2);
assert.equal(shelf.summary.exact_variant_images,2);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);
assert.equal(shelf.summary.fulfillment_live,0);
for(const x of shelf.products){
  assert.equal(x.provider,"EPROLO");
  assert.equal(x.department,"pets");
  assert.equal(x.stock_verified,true);
  assert.equal(x.stock_available,true);
  assert(x.exact_variant_image_url);
  assert.equal(x.final_profit_verified,false);
  assert.equal(x.production_exposure,false);
  assert.equal(x.checkout,"DISABLED");
  assert.equal(x.fulfillment,"DISABLED");
}
console.log("PASS boom-eprolo-wave2-shadow-shelf");
