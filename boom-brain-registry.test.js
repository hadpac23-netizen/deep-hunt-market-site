const fs=require("fs");
const brains=JSON.parse(fs.readFileSync("boom-brain-registry.json","utf8"));
const actions=JSON.parse(fs.readFileSync("boom-action-contract.json","utf8"));

const ids=new Set(brains.primary_brains.map(x=>x.id));
const planes=new Set(brains.shared_control_planes.map(x=>x.id));
const allOwners=new Set([...ids,...planes]);
const seenActions=new Set();
const errors=[];\nconst lifecycleModes=new Set(Object.keys(brains.lifecycle_modes||{}));

for(const a of actions.actions){
  if(seenActions.has(a.action_id))errors.push("duplicate action_id: "+a.action_id);
  seenActions.add(a.action_id);
  if(!allOwners.has(a.owner))errors.push("unknown owner for "+a.action_id+": "+a.owner);
  for(const field of actions.required_fields)if(a[field]===undefined)errors.push("missing "+field+" on "+a.action_id);
}

const graph=new Map(brains.primary_brains.map(b=>[b.id,(b.before||[]).filter(x=>ids.has(x))]));
function cycleFrom(start){
  const visiting=new Set(),done=new Set();
  function visit(n){
    if(visiting.has(n))return true;
    if(done.has(n))return false;
    visiting.add(n);
    for(const m of graph.get(n)||[])if(visit(m))return true;
    visiting.delete(n);done.add(n);return false;
  }
  return visit(start);
}
for(const id of ids)if(cycleFrom(id)){errors.push("brain dependency cycle involving "+id);break;}
for(const brain of brains.primary_brains){
  if(!lifecycleModes.has(brain.lifecycle))errors.push("invalid lifecycle for "+brain.id+": "+brain.lifecycle);
  if(brain.review_route&&!ids.has(brain.review_route))errors.push("unknown review_route for "+brain.id+": "+brain.review_route);
}

if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM Brain OS registry: PASS",brains.primary_brains.length+" brains,",actions.actions.length+" canonical actions");
