const fs=require("fs"),assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-eprolo-provider-adapter-contract.json","utf8"));
const scan=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WOMEN-DRESSES-IL-SCAN-V2-2026-09-22.json","utf8"));
const visual=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WOMEN-EXACT-VISUAL-MAP-2026-09-22.json","utf8"));
const qa=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WOMEN-DRESSES-VISUAL-QA-2026-09-22.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-WOMEN-SHADOW-SHELF-2026-09-22.json","utf8"));

assert.equal(contract.mode,"SIGNED_API_CONNECTED_READ_ONLY");
assert.equal(contract.authority,"GATED");
assert.equal(contract.staged_catalog.women_il_shadow_lane.scan_checked,12);
assert.equal(contract.staged_catalog.women_il_shadow_lane.live_shipping_verified,12);
assert.equal(contract.staged_catalog.women_il_shadow_lane.shadow_shelf_candidates,6);
assert.equal(contract.staged_catalog.variant_scope_rule,"FULL_SET_LISTINGS_MUST_USE_FULL_SET_VARIANTS");
assert.equal(contract.api_truth.order_cost_estimate.final_profit_gate,"BLOCKED");

assert.equal(scan.production_effect,false);
assert.equal(scan.summary.checked,12);
assert.equal(scan.summary.shipping_verified,12);
assert.equal(scan.summary.final_profit_verified,0);
assert.equal(scan.summary.checkout_live,0);
const setA=scan.results.find(x=>x.product_id==="22274784");
assert.equal(setA.variant_scope,"FULL_SET_REQUIRED");
assert(/^Set-/i.test(setA.variant.title));
const setB=scan.results.find(x=>x.product_id==="22272639");
assert.equal(setB.variant_scope,"FULL_SET_REQUIRED");
assert(/^2pcs-/i.test(setB.variant.title));

assert.equal(visual.production_effect,false);
assert.equal(visual.summary.checked,10);
assert.equal(visual.summary.exact_variant_url_present,10);
assert(visual.items.every(x=>x.exact_variant_image_url));

assert.equal(qa.production_effect,false);
assert.equal(qa.summary.visual_passes,6);
assert.equal(qa.summary.holds,6);
assert(qa.newly_reviewed.includes("22272701"));
assert(qa.newly_reviewed.includes("22274780"));

assert.equal(shelf.production_effect,false);
assert.equal(shelf.summary.products,6);
assert.equal(shelf.summary.exact_variant_images,6);
assert.equal(shelf.summary.stock_verified,6);
assert.equal(shelf.summary.shipping_verified_il,6);
assert.equal(shelf.summary.final_profit_verified,0);
assert.equal(shelf.summary.checkout_live,0);
assert.equal(shelf.summary.fulfillment_live,0);
const blocked=new Set(["22272694","22272657","22272639","22272691"]);
assert(shelf.products.every(x=>!blocked.has(x.product_id)));
assert(shelf.products.every(x=>x.checkout==="DISABLED"));
assert(shelf.products.every(x=>x.fulfillment==="DISABLED"));
assert(shelf.products.every(x=>x.production_exposure===false));
assert(shelf.products.every(x=>x.exact_variant_image_url));

console.log("PASS boom-eprolo-women-shadow-shelf");
