const fs=require("fs"),assert=require("assert");
const w3a=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE3A-IL-SCAN-2026-09-22.json","utf8"));
const w3b=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE3B-IL-SCAN-2026-09-22.json","utf8"));
const w4=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-TECH-WAVE4-IL-SCAN-2026-09-22.json","utf8"));
const qa4=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-TECH-VISUAL-QA-2026-09-22.json","utf8"));
const w5=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-TECH-WAVE5-IL-SCAN-2026-09-23.json","utf8"));
const qa5=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-TECH-WAVE5-VISUAL-COMPLIANCE-QA-2026-09-23.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-TECH-SHADOW-SHELF-2026-09-22.json","utf8"));

assert.equal(w3a.production_effect,false);
assert.equal(w3a.summary.checked,8);
assert.equal(w3a.summary.shipping_verified,7);
assert.equal(w3a.summary.normal_shipping,0);
assert.equal(w3a.summary.final_profit_verified,0);

assert.equal(w3b.production_effect,false);
assert.equal(w3b.summary.checked,8);
assert.equal(w3b.summary.shipping_verified,8);
assert.equal(w3b.summary.normal_shipping,1);
assert.equal(w3b.summary.final_profit_verified,0);

assert.equal(w4.production_effect,false);
assert.equal(w4.summary.checked,5);
assert.equal(w4.summary.shipping_verified,5);
assert.equal(w4.summary.normal_shipping,4);
assert.equal(w4.summary.high_shipping_review,1);
assert.equal(w4.summary.final_profit_verified,0);

assert.equal(qa4.production_effect,false);
assert.equal(qa4.summary.reviewed,5);
assert.equal(qa4.summary.pass_shadow_shelf,1);
assert.equal(qa4.summary.compatibility_review,3);
assert.equal(qa4.summary.brand_compatibility_review,1);

assert.equal(w5.production_effect,false);
assert.equal(w5.summary.checked,6);
assert.equal(w5.summary.shipping_verified,6);
assert.equal(w5.summary.normal_shipping,6);
assert.equal(w5.summary.high_shipping_review,0);
assert.equal(w5.summary.final_profit_verified,0);
assert.equal(w5.summary.checkout_live,0);

assert.equal(qa5.production_effect,false);
assert.equal(qa5.summary.reviewed,6);
assert.equal(qa5.summary.pass_shadow_shelf,1);
assert.equal(qa5.summary.compatibility_or_compliance_review,4);
assert.equal(qa5.summary.image_claim_blocked,1);
assert.equal(qa5.summary.production_ready,0);
assert.equal(qa5.summary.checkout_live,0);

assert.equal(shelf.version,"HUNT-EPROLO-TECH-SHADOW-SHELF-V2");
assert.equal(shelf.production_effect,false);
assert.equal(shelf.summary.products,2);
assert.equal(shelf.summary.exact_variant_images,2);
assert.equal(shelf.summary.stock_verified,2);
assert.equal(shelf.summary.shipping_verified_il,2);
assert.equal(shelf.summary.spec_review_pending,1);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);
assert.equal(shelf.summary.fulfillment_live,0);

const ids=new Set(shelf.products.map(x=>x.product_id));
assert.deepEqual(ids,new Set(["31417803","26935524"]));
const card=shelf.products.find(x=>x.product_id==="26935524");
assert.equal(card.compatibility_gate,"GENERIC_ACCESSORY");
assert.equal(card.spec_gate,"USB_3_0_AND_INTERFACE_SPEC_VERIFICATION_REQUIRED_BEFORE_PRODUCTION");
assert(shelf.products.every(x=>x.checkout==="DISABLED"));
assert(shelf.products.every(x=>x.fulfillment==="DISABLED"));
assert(shelf.products.every(x=>x.production_exposure===false));

const held=new Set([
  ...qa4.items.filter(x=>x.status!=="PASS_SHADOW_SHELF").map(x=>x.product_id),
  ...qa5.items.filter(x=>x.status!=="PASS_SHADOW_SHELF").map(x=>x.product_id)
]);
for(const id of ["31715253","29971464","29761463","31405053","29703672","31594991","19374325","31423107","21040880"]){
  assert(held.has(id));
  assert(!ids.has(id));
}
console.log("PASS boom-eprolo-tech-shadow-shelf-v2");
