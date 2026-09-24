(() => {
"use strict";
const clean=v=>String(v??"").trim();
function compile(managerRegistry={},policy={}){
  const declared=(managerRegistry.managers||[])
    .filter(x=>clean(x.schedule))
    .map(x=>Object.freeze({
      id:clean(x.id)+"-declared",
      manager_id:clean(x.id),
      source:"boom-manager-registry",
      schedule:clean(x.schedule),
      cadence:null,
      canonical_owner:clean(policy.canonical_owner)||"boom_orchestrator",
      activation_state:"DECLARED_NOT_CONTROLLED"
    }));
  const policyTasks=(policy.tasks||[]).map(x=>Object.freeze({
    ...x,
    canonical_owner:clean(policy.canonical_owner)||"boom_orchestrator"
  }));
  const map=new Map();
  for(const task of [...declared,...policyTasks]){
    const key=clean(task.id);
    if(!key||map.has(key))continue;
    map.set(key,task);
  }
  const tasks=[...map.values()];
  const duplicateIds=[...declared,...policyTasks]
    .map(x=>clean(x.id)).filter((id,i,a)=>id&&a.indexOf(id)!==i);
  return Object.freeze({
    schema:"BOOM_CANONICAL_SCHEDULER_V1",
    mode:"SHADOW_ONLY",
    canonical_owner:clean(policy.canonical_owner)||"boom_orchestrator",
    activation_enabled:false,
    task_count:tasks.length,
    tasks:Object.freeze(tasks),
    duplicate_ids:Object.freeze([...new Set(duplicateIds)]),
    status:duplicateIds.length?"REVIEW":"INVENTORIED_SHADOW",
    execution_changed:false
  });
}
const api=Object.freeze({compile});
if(typeof window!=="undefined")window.DragonScheduler=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();