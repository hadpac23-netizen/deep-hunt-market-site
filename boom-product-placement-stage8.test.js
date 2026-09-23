const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));

const s7=read("evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json");
const qa=read("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QA-SHORTLIST-V2-2026-09-23.json");
const ship=read("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SHIPPING-VERIFY-2026-09-23.json");
const qp=read("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-QUALITY-PROFIT-GATE-2026-09-23.json");
const belts=read("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-BELT-GATE-2026-09-23.json");
const preview=read("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-COMBINED-ADMISSION-PREVIEW-2026-09-23.json");
const ext=read("evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-EXTERNAL-SOURCE-MANIFEST-2026-09-23.json");

for(const x of [qa,ship,qp,belts,preview,ext])assert.equal(x.production_effect,false);
assert.equal(preview.summary.stage7_canonical_products,s7.summary.canonical_products);
assert.equal(preview.summary.canonical_products_shadow,s7.summary.canonical_products+preview.summary.shadow_admitted);
assert.equal(preview.summary.final_net_profit_verified_products,0);
assert.equal(ext.summary.empty_rails,preview.summary.rails_empty);
assert.equal(ext.rails.length,preview.summary.rails_empty);
assert(ext.rails.every(x=>x.hypersku_state==="MANUAL_SOURCING_REQUEST_RECOMMENDED"));
assert(ext.rails.every(x=>x.production_effect===false));
assert((ship.summary.verified_4_of_4||0)>0);
assert.equal(ship.summary.final_net_profit_verified_products,0);
assert.equal(qp.summary.final_net_profit_verified_products,0);
assert.equal(belts.summary.final_net_profit_verified_products,0);
assert(preview.admitted.every(x=>x.state==="SHADOW_ADMISSION_CANDIDATE"));
console.log("Product Placement Stage8 Supplier Recovery: PASS");
