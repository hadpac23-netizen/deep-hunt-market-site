(() => {
"use strict";
const clean=v=>String(v??"").trim();
function confidence(run={}){
  const total=Number(run?.evidence?.total||0);
  if(run?.evidence?.verified===true&&total>=2)return "HIGH";
  if(total>=2)return "MEDIUM";
  return "LOW";
}
function rowForRun(run={}){
  const total=Number(run?.evidence?.total||0);
  return Object.freeze({
    claim:"Control run "+clean(run.run_id)+" · "+clean(run.status)+" · "+clean(run.action_class),
    source_url:"boom://control-plane/run/"+encodeURIComponent(clean(run.run_id||"unknown")),
    confidence:confidence(run),
    supporting_sources:total,
    contradictory_sources:0,
    verified:run?.evidence?.verified===true,
    run_id:clean(run.run_id),
    brain:clean(run.brain),
    manager_id:clean(run.manager_id),
    persistence_state:"PREPARED_NOT_PERSISTED"
  });
}
function prepare(state={}){
  const runs=Array.isArray(state.runs)?state.runs:[];
  const rows=runs.filter(x=>Number(x?.evidence?.total||0)>0).map(rowForRun);
  return Object.freeze({
    schema:"BOOM_CONTROL_EVIDENCE_LEDGER_V1",
    table:"boom_evidence",
    persistence_enabled:false,
    writer_deployed:false,
    rows:Object.freeze(rows),
    counts:Object.freeze({
      prepared:rows.length,
      verified:rows.filter(x=>x.verified===true).length,
      unverified:rows.filter(x=>x.verified!==true).length
    }),
    rule:"Prepared evidence is not persisted or verified by this browser adapter."
  });
}
const api=Object.freeze({confidence,rowForRun,prepare});
if(typeof window!=="undefined"){
  window.DragonEvidenceLedger=api;
  window.addEventListener("dragon:control-plane",e=>{
    const state=prepare(e.detail||{});
    window.DRAGON_EVIDENCE_LEDGER_STATE=state;
    window.dispatchEvent(new CustomEvent("dragon:evidence-ledger",{detail:state}));
  });
}
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();