(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const DIRECT=new Set(["DIRECT_DB","OWNER_FUNCTION","VERIFIED_WEBHOOK","SIGNED_PROVIDER"]);
  const clean=(v,max=240)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean))];

  function inspect(input={},now=Date.now()){
    const blockers=[];
    const kind=clean(input.source_kind,40).toUpperCase();
    const source=clean(input.source_ref,180);
    const count=n(input.observed_count);
    const observedAt=Date.parse(String(input.observed_at||""));
    const maxAge=Math.max(0,Number(input.max_age_ms||0));
    const freshnessRequired=input.freshness_required!==false;

    if(!source)blockers.push("source_ref_missing");
    if(!kind)blockers.push("source_kind_missing");
    if(input.available!==true)blockers.push("evidence_unavailable");
    if(input.truth_verified===false)blockers.push("truth_not_verified");
    if(input.minimum_count!=null&&(count===null||count<Number(input.minimum_count)))blockers.push("minimum_evidence_count_missing");

    const direct=DIRECT.has(kind);
    let freshness="NOT_REQUIRED";
    if(freshnessRequired){
      if(!Number.isFinite(observedAt))freshness="UNKNOWN";
      else if(maxAge>0&&now-observedAt>maxAge)freshness="STALE";
      else freshness="FRESH";
      if(freshness!=="FRESH")blockers.push(freshness==="STALE"?"evidence_stale":"evidence_timestamp_missing");
    }

    let state="MISSING";
    if(input.available===true){
      if(!direct)state="STRUCTURAL";
      else if(blockers.length===0)state="VERIFIED";
      else if(blockers.every(x=>["evidence_stale","evidence_timestamp_missing"].includes(x)))state="STALE";
      else state="PARTIAL";
    }

    return Object.freeze({
      domain:clean(input.domain,80),
      state,
      source_kind:kind,
      source_ref:source,
      observed_count:count,
      observed_at:Number.isFinite(observedAt)?new Date(observedAt).toISOString():"",
      freshness,
      direct,
      blockers:Object.freeze(uniq(blockers)),
      usable_for_decision:state==="VERIFIED"
    });
  }

  function matrix(records=[],now=Date.now()){
    const rows=(Array.isArray(records)?records:[]).map(x=>inspect(x,now));
    const counts={VERIFIED:0,STALE:0,PARTIAL:0,STRUCTURAL:0,MISSING:0};
    for(const row of rows)counts[row.state]=(counts[row.state]||0)+1;
    const criticalMissing=rows.filter(row=>row.critical===true&&row.state!=="VERIFIED");
    return Object.freeze({
      version:VERSION,
      rows:Object.freeze(rows),
      counts:Object.freeze(counts),
      verified:counts.VERIFIED||0,
      stale:counts.STALE||0,
      partial:counts.PARTIAL||0,
      structural:counts.STRUCTURAL||0,
      missing:counts.MISSING||0,
      usable_domains:Object.freeze(rows.filter(x=>x.usable_for_decision).map(x=>x.domain)),
      execute_actions:false,
      external_publish:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function gate(matrixResult={},requiredDomains=[]){
    const usable=new Set(matrixResult.usable_domains||[]);
    const missing=(Array.isArray(requiredDomains)?requiredDomains:[]).filter(x=>!usable.has(x));
    return Object.freeze({
      ready:missing.length===0,
      missing_domains:Object.freeze(missing),
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,DIRECT,inspect,matrix,gate});
  if(typeof window!=="undefined")window.BoomEvidenceLedger=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();