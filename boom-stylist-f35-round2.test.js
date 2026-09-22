const fs=require("fs"),assert=require("assert");
const t=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-V2-IL-2026-09-22.json","utf8"));
const r=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-F35-ROUND2-2026-09-22.json","utf8"));
assert.equal(t.mode,"SHADOW_TRAINING");
assert.equal(t.market,"IL");
assert.equal(t.verified_products,36);
assert.equal(t.printful_global_verified,27);
assert.equal(t.cj_il_verified_added,9);
assert.equal(t.production_effect,false);
assert.equal(r.mode,"SHADOW_EXAM");
assert.equal(r.market,"IL");
assert.equal(r.production_effect,false);
assert.equal(r.assortment_gate.status,"PASS");
assert(r.assortment_gate.assortment.footwear>=3);
assert(r.assortment_gate.assortment.bottoms>=5);
assert.equal(r.style_exam.looks.length,5);
assert.equal(r.style_exam.product_truth_gate,"PASS");
assert.equal(r.style_exam.subjective_score_claimed,false);
for(const look of r.style_exam.looks){
  assert.equal(look.product_truth_il,true);
  assert(look.items.some(x=>x.role==="footwear"));
  assert(look.items.some(x=>x.role==="bottom"));
  assert(look.items.some(x=>x.role==="top"));
}
assert.equal(r.mastery_change,false);
assert.equal(r.commerce_exam.status,"PASS_WITH_WARNINGS");
console.log("PASS boom-stylist-f35-round2");
