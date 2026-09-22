const fs=require("fs"),assert=require("assert");
const w3a=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE3A-IL-SCAN-2026-09-22.json","utf8"));
const w3b=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE3B-IL-SCAN-2026-09-22.json","utf8"));
const w4=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-TECH-WAVE4-IL-SCAN-2026-09-22.json","utf8"));
const qa=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-TECH-VISUAL-QA-2026-09-22.json","utf8"));
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

assert.equal(qa.production_effect,false);
assert.equal(qa.summary.reviewed,5);
assert.equal(qa.summary.pass_shadow_shelf,1);
assert.equal(qa.summary.compatibility_review,3);
assert.equal(qa.summary.brand_compatibility_review,1);
assert.equal(qa.summary.production_ready,0);
assert.equal(qa.summary.checkout_live,0);

assert.equal(shelf.production_effect,false);
assert.equal(shelf.summary.products,1);
assert.equal(shelf.summary.exact_variant_images,1);
assert.equal(shelf.summary.stock_verified,1);
assert.equal(shelf.summary.shipping_verified_il,1);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);
assert.equal(shelf.summary.fulfillment_live,0);
assert.equal(shelf.products[0].product_id,"31417803");
assert.equal(shelf.products[0].compatibility_gate,"NOT_APPLICABLE_GENERIC_PRODUCT");
assert.equal(shelf.products[0].checkout,"DISABLED");
assert.equal(shelf.products[0].fulfillment,"DISABLED");
assert.equal(shelf.products[0].production_exposure,false);

const held=new Set(qa.items.filter(x=>x.status!=="PASS_SHADOW_SHELF").map(x=>x.product_id));
assert(held.has("31715253"));
assert(held.has("29971464"));
assert(held.has("29761463"));
assert(held.has("31405053"));
assert(!shelf.products.some(x=>held.has(x.product_id)));

console.log("PASS boom-eprolo-tech-shadow-shelf");
