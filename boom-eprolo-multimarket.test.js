const fs=require("fs"),assert=require("assert");
const scan=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-WAVE1-2026-09-23.json","utf8"));
const qa=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-VISUAL-QA-2026-09-23.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-MULTIMARKET-SHADOW-SHELF-2026-09-23.json","utf8"));

assert.equal(scan.production_effect,false);
assert.equal(scan.summary.checked,7);
assert.equal(scan.summary.market_pass_counts.IL,0);
assert.equal(scan.summary.market_pass_counts.DE,4);
assert.equal(scan.summary.market_pass_counts.US,3);

assert.equal(qa.production_effect,false);
assert.equal(qa.summary.reviewed,4);
assert.equal(qa.summary.pass_market_shadow,2);
assert.equal(qa.summary.brand_rights_review,1);
assert.equal(qa.summary.claim_function_review,1);

assert.equal(shelf.version,"HUNT-EPROLO-MULTIMARKET-SHADOW-SHELF-V1");
assert.equal(shelf.production_effect,false);
assert.equal(shelf.summary.unique_products,2);
assert.equal(shelf.summary.DE_products,2);
assert.equal(shelf.summary.US_products,2);
assert.equal(shelf.summary.IL_products,0);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);

const ids=new Set(shelf.products.map(x=>x.product_id));
assert.deepEqual(ids,new Set(["24539904","26556212"]));
for(const p of shelf.products){
  assert.deepEqual(p.eligible_markets,["DE","US"]);
  assert.equal(p.il_state,"BLOCKED_HIGH_SHIPPING_OR_NOT_NORMAL");
  assert.equal(p.production_exposure,false);
  assert.equal(p.checkout,"DISABLED");
  assert.equal(p.fulfillment,"DISABLED");
  assert(p.exact_variant_image_url);
}
assert(!ids.has("25354414"));
assert(!ids.has("31441975"));
console.log("PASS boom-eprolo-multimarket");
