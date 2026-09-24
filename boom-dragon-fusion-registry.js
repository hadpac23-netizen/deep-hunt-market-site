(() => {
"use strict";
const PATH="boom-dragon-fusion-registry.json";
const VALID_OWNERS=new Set([
  "boom_orchestrator","intelligence_brain","innovation_brain","commerce_truth_brain",
  "experience_brain","growth_brain","operations_brain","learning_governance_brain"
]);
function summarize(reg={}){
  const caps=Array.isArray(reg.capabilities)?reg.capabilities:[];
  const byStatus={},byOwner={};
  for(const c of caps){
    byStatus[c.status]=(byStatus[c.status]||0)+1;
    byOwner[c.owner]=(byOwner[c.owner]||0)+1;
  }
  const invalidOwners=caps.filter(c=>!VALID_OWNERS.has(c.owner)).map(c=>c.id);
  const ids=new Set(),duplicateIds=[];
  for(const c of caps){if(ids.has(c.id))duplicateIds.push(c.id);ids.add(c.id)}
  const connected=caps.filter(c=>["CONNECTED","VERIFIED_REPO"].includes(c.status)).length;
  const preserved=caps.filter(c=>/^PRESERVED/.test(c.status)).length;
  const planned=caps.filter(c=>/PLANNED|PARTIAL/.test(c.status)).length;
  return Object.freeze({
    total:caps.length,connected,preserved,planned,
    mapped:invalidOwners.length===0&&duplicateIds.length===0,
    invalidOwners:Object.freeze(invalidOwners),
    duplicateIds:Object.freeze(duplicateIds),
    byStatus:Object.freeze(byStatus),
    byOwner:Object.freeze(byOwner),
    primaryViews:Array.isArray(reg.views)?reg.views.length:0,
    antiDuplication:Object.freeze([...(reg.doctrine?.anti_duplication||[])]),
    preservedBacklog:Object.freeze([...(reg.preserved_backlog||[])])
  });
}
async function load(){
  const res=await fetch(PATH,{cache:"no-store"});
  if(!res.ok)throw new Error("FUSION_REGISTRY_HTTP_"+res.status);
  const registry=await res.json();
  const summary=summarize(registry);
  const state=Object.freeze({registry,summary,status:summary.mapped?"MAPPED":"REVIEW"});
  if(typeof window!=="undefined"){
    window.DRAGON_FUSION_REGISTRY_STATE=state;
    window.dispatchEvent(new CustomEvent("dragon:fusion-registry",{detail:state}));
  }
  return state;
}
const api=Object.freeze({summarize,load,VALID_OWNERS});
if(typeof window!=="undefined"){
  window.DragonFusionRegistry=api;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(load,220));
  else setTimeout(load,220);
}
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();