const fs=require("fs"),assert=require("assert");
const r=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-F35-ROUND1-2026-09-22.json","utf8"));
const training=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-2026-09-22.json","utf8"));
const ids=new Set(training.products.map(x=>Number(x.product_id)));
assert.equal(r.mode,"SHADOW_EXAM");
assert.equal(r.production_effect,false);
assert.equal(r.survey_exam.department_coverage,17);
assert.equal(r.survey_exam.preference_layers,6);
assert.equal(r.style_exam.status,"BLOCKED_ASSORTMENT_GAP");
assert.equal(r.style_exam.assortment.footwear,0);
assert.equal(r.style_exam.assortment.bottoms,1);
assert.equal(r.shelf_exam.verified_products_used,24);
assert.equal(r.shelf_exam.pass_claimed,false);
for(const s of r.shelf_exam.shelves){
  for(const p of s.products){
    assert(ids.has(Number(p.product_id)),"shadow shelf used non-training product "+p.product_id);
    assert.deepEqual(p.verified_markets,["IL","DE","US"]);
    assert.equal(p.production_effect,false);
  }
}
assert.equal(r.mastery_change,false);
assert.equal(r.current_hunt_comparison.use_as_training_truth,false);
assert.equal(r.current_hunt_comparison.use_as_qa_counterexample,true);
const js=fs.readFileSync("boom-brain-studio.js","utf8");
assert(js.includes("HUNT-STYLIST-F35-ROUND1-2026-09-22.json"));
assert(js.includes("mastery change false"));
console.log("PASS boom-stylist-f35-round1");
