const fs=require("fs"),assert=require("assert");
const f35=JSON.parse(fs.readFileSync("boom-f35-style-commerce-research-2026-09-22.json","utf8"));
const base=JSON.parse(fs.readFileSync("evidence/HUNT-F35-SIX-LAYER-PREFERENCE-BASELINE-2026-09-22.json","utf8"));
const shelf=JSON.parse(fs.readFileSync("boom-shelf-department-contract.json","utf8"));
const canonical=shelf.departments.map(x=>x.slug).sort();
const research=f35.department_matrix.map(x=>x.slug).sort();
const surveyed=base.departments.map(x=>x.slug).sort();
assert.equal(f35.production_effect,false);
assert.equal(f35.six_layers.length,6);
assert.equal(f35.department_matrix.length,17);
assert.equal(f35.multidisciplinary_curriculum.length,10);
assert.deepEqual(research,canonical);
assert.deepEqual(surveyed,canonical);
assert.equal(base.layers.length,6);
assert.equal(base.departments.length,17);
for(const d of base.departments){
  assert(Array.isArray(d.priority)&&d.priority.length>=4,d.slug+" missing layer priorities");
  assert(Array.isArray(d.signals)&&d.signals.length>=3,d.slug+" missing signals");
  assert(d.confidence,d.slug+" missing confidence");
}
assert(f35.brand_case_study_policy.blocked.includes("Do not copy"));
assert(f35.ai_style_role.restrictions.includes("no sensitive-trait inference"));
assert.equal(base.warning.includes("not HUNT first-party preference truth"),true);
console.log("PASS boom-f35-style-commerce-research");
