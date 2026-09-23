const fs=require("fs");
const assert=require("assert");
const p=JSON.parse(fs.readFileSync("boom-automation-control-plane.json","utf8"));
assert(/^BOOM-AUTOMATION-CONTROL-PLANE-V1\.4-.*RECOVERY$/.test(p.version),"Stage7 recovery control-plane version required");
assert.equal(p.mode,"SHADOW");
assert.equal(p.authority.command,"boom_orchestrator");
assert.equal(p.targets.departments,17);
assert.equal(p.targets.target_products_per_department,1000);
assert(p.workflows.length>=6);
const ids=new Set();
for(const w of p.workflows){
  assert(w.id && !ids.has(w.id), "workflow ids must be unique");
  ids.add(w.id);
  assert(w.owner,"workflow owner required");
  assert(Array.isArray(w.stages) && w.stages.length>0,"workflow stages required");
  assert(w.failure_route,"workflow failure route required");
}
const intake=p.workflows.find(x=>x.id==="supplier_product_intake");
assert(intake && intake.stages.includes("placement_decision"),"supplier intake must include placement decision");
assert(intake.stages.includes("supplier_taxonomy_verification"),"supplier intake must include supplier taxonomy verification");
assert(intake.stages.indexOf("supplier_taxonomy_verification")<intake.stages.indexOf("department_gate"),"supplier taxonomy must run before department gate");
assert(intake.stages.indexOf("placement_decision")<intake.stages.indexOf("shelf_candidate"),"placement must run before shelf candidate");
assert(String(intake.gate).includes("PLACEMENT_PASS"),"supplier intake must require placement PASS");
const placementWatch=p.workflows.find(x=>x.id==="product_placement_watch");
assert(placementWatch && placementWatch.mode==="SHADOW_ALWAYS_ON","always-on placement watch required");
assert(placementWatch.stages.includes("empty_thin_recovery"),"placement watch must recover empty/thin rails");
assert(placementWatch.stages.includes("sourcing_gap_classification"),"placement watch must classify sourcing gaps");
assert.equal(placementWatch.recovery_contract,"boom-product-placement-stage7-contract.json");
const n8n=p.adapters.find(x=>x.id==="n8n_adapter");
assert(n8n,"n8n adapter required");
assert.equal(n8n.authority,"NONE");
for(const banned of ["approve itself","activate payment","place supplier orders","publish externally","change production"]){
  assert(n8n.may_not.some(x=>x.includes(banned)), "n8n boundary missing: "+banned);
}
const material=p.workflows.filter(w=>w.material_action!=="none" && w.material_action!=="shelf_activation");
assert(material.every(w=>w.final_owner_gate===true),"material workflows must require Owner Gate");
console.log("BOOM automation control plane: PASS — authority, six workflows, 17x1000 target, n8n boundary and Owner Gate verified");
