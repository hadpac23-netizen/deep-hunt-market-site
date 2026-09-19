(() => {
  "use strict";
  const VERSION="2026-09-19-f50-rt2";
  const DIMENSIONS=Object.freeze([
    "technical","legal_regulatory","fraud_abuse","ux_adoption","economics",
    "competition","scalability","operations","data_moat"
  ]);
  const SEVERITY=new Set(["LOW","MEDIUM","HIGH","FATAL"]);
  const clean=(v,max=1000)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);

  function attack(candidate={}){
    const rows=(Array.isArray(candidate.red_team_cases)?candidate.red_team_cases:[]).map(row=>({
      dimension:clean(row?.dimension,80).toLowerCase(),
      severity:clean(row?.severity,20).toUpperCase(),
      attack:clean(row?.attack,1000),
      mitigation:clean(row?.mitigation,1000),
      resolved:row?.resolved===true,
      evidence_ref:clean(row?.evidence_ref,1000)
    })).filter(row=>row.dimension&&SEVERITY.has(row.severity)&&row.attack);
    const covered=[...new Set(rows.map(x=>x.dimension))];
    const missing=DIMENSIONS.filter(x=>!covered.includes(x));
    const fatal=rows.filter(x=>x.severity==="FATAL"&&!x.resolved);
    const high=rows.filter(x=>x.severity==="HIGH"&&!x.resolved);
    const weakMitigation=rows.filter(x=>["HIGH","FATAL"].includes(x.severity)&&x.resolved&&x.mitigation.length<30);
    const missingResolutionEvidence=rows.filter(x=>["HIGH","FATAL"].includes(x.severity)&&x.resolved&&!x.evidence_ref);
    const blockers=[];
    if(missing.length)blockers.push("red_team_dimensions_missing");
    if(fatal.length)blockers.push("fatal_risk_unresolved");
    if(high.length)blockers.push("high_risk_unresolved");
    if(weakMitigation.length)blockers.push("high_risk_mitigation_not_substantive");
    if(missingResolutionEvidence.length)blockers.push("high_risk_resolution_evidence_missing");
    const state=fatal.length?"KILL":blockers.length?"HOLD":"PASS";
    return Object.freeze({
      version:VERSION,state,
      red_team_ready:state==="PASS",
      attacks:rows.length,
      covered_dimensions:Object.freeze(covered),
      missing_dimensions:Object.freeze(missing),
      fatal_unresolved:fatal.length,
      high_unresolved:high.length,
      blockers:Object.freeze(blockers),
      execute_actions:false
    });
  }

  const api=Object.freeze({VERSION,DIMENSIONS,SEVERITY,attack});
  if(typeof window!=="undefined")window.BoomF50RedTeam=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();