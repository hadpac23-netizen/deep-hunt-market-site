const fs=require("fs"),assert=require("assert");
const scan=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE2-IL-SCAN-2026-09-22.json","utf8"));
const qa=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WAVE2-VISUAL-QA-2026-09-22.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-PETS-SHADOW-SHELF-2026-09-22.json","utf8"));
const contract=JSON.parse(fs.readFileSync("boom-eprolo-provider-adapter-contract.json","utf8"));
const adapters=JSON.parse(fs.readFileSync("boom-provider-adapters-contract.json","utf8"));

assert.equal(scan.production_effect,false);
assert.equal(scan.summary.checked,10);
assert.equal(scan.summary.shipping_verified,10);
assert.equal(scan.summary.normal_shipping,3);
assert.equal(scan.summary.high_shipping_review,7);
assert.equal(scan.summary.exact_variant_images,10);
assert.equal(scan.summary.final_profit_verified,0);
assert.equal(scan.summary.checkout_live,0);

assert.equal(qa.production_effect,false);
assert.equal(qa.summary.reviewed,3);
assert.equal(qa.summary.pass_shadow_shelf,2);
assert.equal(qa.summary.claim_image_blocked,1);
const home=qa.items.find(x=>x.product_id==="31495410");
assert.equal(home.status,"BLOCKED_ON_IMAGE_CLAIM_REVIEW");

assert.equal(shelf.production_effect,false);
assert.equal(shelf.summary.products,2);
assert.equal(shelf.summary.exact_variant_images,2);
assert.equal(shelf.summary.stock_verified,2);
assert.equal(shelf.summary.shipping_verified_il,2);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);
assert.equal(shelf.summary.fulfillment_live,0);
assert.deepEqual(new Set(shelf.products.map(x=>x.product_id)),new Set(["24181199","24167510"]));
assert(shelf.products.every(x=>x.checkout==="DISABLED"));
assert(shelf.products.every(x=>x.fulfillment==="DISABLED"));
assert(shelf.products.every(x=>x.production_exposure===false));

assert.equal(contract.current_live_validation.wave2.checked,10);
assert.equal(contract.current_live_validation.wave2.pet_shadow_shelf_products,2);
assert.equal(contract.current_live_validation.wave2.final_profit_verified,0);
assert.equal(adapters.providers.EPROLO.pet_shadow_shelf_products,2);
assert.equal(adapters.providers.EPROLO.total_shadow_shelf_products,8);
console.log("PASS boom-eprolo-wave2");
