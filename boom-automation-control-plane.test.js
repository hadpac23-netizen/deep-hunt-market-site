const fs=require("fs");
const assert=require("assert");
const p=JSON.parse(fs.readFileSync("boom-automation-control-plane.json","utf8"));
assert.equal(p.version,"BOOM-AUTOMATION-CONTROL-PLANE-V1");
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
const n8n=p.adapters.find(x=>x.id==="n8n_adapter");
assert(n8n,"n8n adapter required");
assert.equal(n8n.authority,"NONE");
for(const banned of ["approve itself","activate payment","place supplier orders","publish externally","change production"]){
  assert(n8n.may_not.some(x=>x.includes(banned)), "n8n boundary missing: "+banned);
}
const material=p.workflows.filter(w=>w.material_action!=="none" && w.material_action!=="shelf_activation");
assert(material.every(w=>w.final_owner_gate===true),"material workflows must require Owner Gate");
console.log("BOOM automation control plane: PASS — authority, six workflows, 17x1000 target, n8n boundary and Owner Gate verified");
