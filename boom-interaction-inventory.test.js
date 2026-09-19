const fs=require("fs");
const actions=JSON.parse(fs.readFileSync("boom-action-contract.json","utf8"));
const inventory=JSON.parse(fs.readFileSync("boom-interaction-inventory.json","utf8"));
const known=new Set(actions.actions.map(x=>x.action_id));
const errors=[];
const seen=new Set();
for(const row of inventory.interactions){
  const key=row.file+"::"+row.selector+"::"+row.action_id;
  if(seen.has(key))errors.push("duplicate interaction mapping: "+key);
  seen.add(key);
  if(!known.has(row.action_id))errors.push("unknown action_id "+row.action_id+" for "+key);
  if(!row.file||!row.selector)errors.push("incomplete mapping: "+JSON.stringify(row));
}
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM interaction inventory: PASS",inventory.interactions.length+" mapped controls, "+known.size+" canonical actions");
