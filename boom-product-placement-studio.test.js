const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("boom-brain-studio.html","utf8");
const studio=fs.readFileSync("boom-product-placement-studio.js","utf8");
const control=JSON.parse(fs.readFileSync("boom-automation-control-plane.json","utf8"));
const contract=JSON.parse(fs.readFileSync("boom-product-placement-gate-contract.json","utf8"));
const skills=JSON.parse(fs.readFileSync("boom-operational-skills.json","utf8"));
const supplier=JSON.parse(fs.readFileSync("boom-supplier-product-intake-contract.json","utf8"));
const readiness=JSON.parse(fs.readFileSync("boom-control-plane-readiness.json","utf8"));

assert(html.includes('id="bs-placement-watch"'));
assert(html.includes('id="bs-placement-state"'));
assert(html.includes('boom-product-placement-gate.js?v=placement1'));
assert(html.includes('boom-product-placement-studio.js?v=placement1'));
assert(studio.includes("BoomProductPlacementGate"));
assert(studio.includes("setInterval(run,60000)"));
assert(studio.includes('document.body.dataset.adminReady!=="true"'));

const intake=control.workflows.find(x=>x.id==="supplier_product_intake");
assert(intake);
assert(intake.stages.includes("product_type_detection"));
assert(intake.stages.includes("department_gate"));
assert(intake.stages.includes("category_gate"));
assert(intake.stages.includes("placement_conflict_check"));
assert(intake.stages.includes("placement_decision"));
assert(intake.stages.indexOf("placement_decision")<intake.stages.indexOf("shelf_candidate"));
assert(String(intake.gate).includes("PLACEMENT_PASS"));

const watch=control.workflows.find(x=>x.id==="product_placement_watch");
assert(watch);
assert.equal(watch.mode,"SHADOW_ALWAYS_ON");
assert.equal(watch.material_action,"none");
assert.equal(watch.final_owner_gate,false);

assert.equal(contract.mode,"SHADOW_ALWAYS_ON");
assert.equal(contract.always_on_policy.studio_watch,true);
assert.equal(contract.always_on_policy.automatic_product_move,false);
assert.equal(contract.always_on_policy.production_mutation,false);
assert(skills.skills.some(x=>x.id==="classify_product_placement"&&x.owner==="commerce_truth_brain"));
assert(supplier.stages.includes("placement_decision"));
assert(supplier.stages.indexOf("placement_decision")<supplier.stages.indexOf("shelf_candidate"));
assert(supplier.pass_requirements.includes("placement_decision = PASS"));
assert(readiness.areas.some(x=>x.id==="product_placement_gate"&&x.status==="CODED_SHADOW_ALWAYS_ON_STUDIO"));

console.log("BOOM Studio Product Placement Gate: PASS");
