const fs=require("fs");
const actions=JSON.parse(fs.readFileSync("boom-action-contract.json","utf8"));
const surfaces=JSON.parse(fs.readFileSync("boom-surface-contract.json","utf8"));
const journeys=JSON.parse(fs.readFileSync("boom-journey-contract.json","utf8"));
const merge=JSON.parse(fs.readFileSync("boom-guest-merge-matrix.json","utf8"));
const actionIds=new Set(actions.actions.map(x=>x.action_id));
const surfaceIds=new Set(surfaces.surfaces.map(x=>x.id));
const errors=[];
for(const j of journeys.journeys){
  if(!j.id||!j.owner||!Array.isArray(j.steps)||!j.steps.length)errors.push("invalid journey "+(j.id||"unknown"));
  for(const step of j.steps){
    if(step.kind==="action"&&!actionIds.has(step.ref))errors.push(j.id+": unknown action "+step.ref);
    if(step.kind==="surface"&&!surfaceIds.has(step.ref))errors.push(j.id+": unknown surface "+step.ref);
    if(step.kind==="merge"&&step.ref!=="guest_merge_matrix")errors.push(j.id+": unknown merge contract "+step.ref);
  }
}
const mergeStates=new Set(merge.states.map(x=>x.state));
for(const required of ["likes_saves","cart","shopping_preferences","theme","language"])if(!mergeStates.has(required))errors.push("merge matrix missing "+required);
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM journey contract: PASS",journeys.journeys.length+" journeys, "+merge.states.length+" merge states");
