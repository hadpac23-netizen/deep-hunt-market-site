(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const LEVELS=Object.freeze([
    "measurement_foundations","product_feed_quality","merchandising","creative_strategy",
    "organic_growth","advertising_systems","attribution_decision_science","lifecycle_retention",
    "country_marketing","experiment_loop"
  ]);
  const clean=(v,max=400)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean))];

  function sourceEvidence(input={}){
    const blockers=[];
    const url=clean(input.source_url,500);
    let https=false;
    try{https=new URL(url).protocol==="https:"}catch{}
    if(!https)blockers.push("official_source_url_missing");
    if(input.official_source_verified!==true)blockers.push("official_source_not_verified");
    const verifiedAt=Date.parse(String(input.verified_at||""));
    if(!Number.isFinite(verifiedAt))blockers.push("verification_date_missing");
    else if(Date.now()-verifiedAt>180*24*60*60*1000)blockers.push("source_verification_stale");
    if(!clean(input.capability,180))blockers.push("capability_missing");
    if(!clean(input.user_problem,300))blockers.push("user_problem_missing");
    return Object.freeze({ready:blockers.length===0,blockers:Object.freeze(blockers),source_url:url,verified_at:Number.isFinite(verifiedAt)?new Date(verifiedAt).toISOString():""});
  }

  function experimentContract(input={}){
    const blockers=[];
    const required=[
      ["objective",240],["hypothesis",400],["audience",240],["primary_kpi",120],
      ["control",240],["duration_rule",160],["trust_safety_check",300],
      ["stop_rule",300],["rollback",300]
    ];
    for(const [key,max] of required)if(!clean(input[key],max))blockers.push(key+"_missing");
    const minSample=n(input.min_sample_size);
    if(minSample===null||minSample<1)blockers.push("min_sample_size_missing");
    if(input.paid===true&&input.owner_approval_status!=="approved")blockers.push("paid_owner_approval_required");
    return Object.freeze({ready:blockers.length===0,blockers:Object.freeze(blockers),min_sample_size:minSample||0});
  }

  function evidence(input={},contract={}){
    const blockers=[];
    const sample=n(input.sample_size);
    const baseline=n(input.baseline_value);
    const treatment=n(input.treatment_value);
    if(sample===null||sample<Number(contract.min_sample_size||1))blockers.push("sample_below_minimum");
    if(baseline===null)blockers.push("baseline_missing");
    if(treatment===null)blockers.push("treatment_missing");
    if(input.control_measured!==true)blockers.push("control_not_measured");
    if(input.primary_kpi_measured!==true)blockers.push("primary_kpi_not_measured");
    if(input.guardrail_measured!==true)blockers.push("guardrail_not_measured");
    if(input.red_team_complete!==true)blockers.push("red_team_missing");
    if(input.data_quality_verified!==true)blockers.push("data_quality_not_verified");
    const lift=baseline!==null&&treatment!==null&&baseline!==0?((treatment-baseline)/Math.abs(baseline))*100:null;
    return Object.freeze({
      ready:blockers.length===0,
      blockers:Object.freeze(blockers),
      sample_size:sample||0,
      baseline_value:baseline,
      treatment_value:treatment,
      lift_pct:lift===null?null:Number(lift.toFixed(3)),
      guardrail_breached:input.guardrail_breached===true
    });
  }

  function evaluate({tactic={},source={},experiment={},result={}}={}){
    const blockers=[];
    const level=clean(tactic.level,80);
    if(!LEVELS.includes(level))blockers.push("curriculum_level_invalid");
    if(!clean(tactic.title,180))blockers.push("tactic_title_missing");
    if(!clean(tactic.hunt_fit,300))blockers.push("hunt_fit_missing");
    const src=sourceEvidence(source);
    const exp=experimentContract(experiment);
    const ev=evidence(result,exp);
    blockers.push(...src.blockers,...exp.blockers,...ev.blockers);

    let state="HOLD";
    if(src.ready&&exp.ready&&!ev.ready)state="MEASURE";
    if(src.ready&&exp.ready&&ev.ready){
      if(ev.guardrail_breached)state="ROLLBACK_CANDIDATE";
      else if(ev.lift_pct!==null&&ev.lift_pct>0)state="GRADUATION_CANDIDATE";
      else if(ev.lift_pct!==null&&ev.lift_pct<0)state="ROLLBACK_CANDIDATE";
      else state="INCONCLUSIVE";
    }

    return Object.freeze({
      state,level,
      source:src,
      experiment:exp,
      evidence:ev,
      blockers:Object.freeze(uniq(blockers)),
      graduate:false,
      adopt:false,
      paid_launch:false,
      external_publish:false,
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function systemReadiness(config={}){
    const blockers=[];
    if(config.measurement_foundation_ready!==true)blockers.push("measurement_foundation_missing");
    if(config.product_truth_ready!==true)blockers.push("product_truth_missing");
    if(config.experiment_registry_ready!==true)blockers.push("experiment_registry_missing");
    if(config.holdout_framework_ready!==true)blockers.push("holdout_framework_missing");
    if(config.guardrail_measurement_ready!==true)blockers.push("guardrail_measurement_missing");
    if(config.learning_archive_ready!==true)blockers.push("learning_archive_missing");
    if(config.source_verification_workflow_ready!==true)blockers.push("source_verification_workflow_missing");
    return Object.freeze({
      state:blockers.length===0?"OWNER_REVIEW":blockers.length<=3?"PREPARE":"HOLD",
      blockers:Object.freeze(blockers),
      levels:LEVELS.length,
      graduates:0,
      auto_adopt:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function summarize(rows=[]){
    const list=Array.isArray(rows)?rows:[];
    const counts={};
    for(const row of list)counts[row.state]=(counts[row.state]||0)+1;
    return Object.freeze({
      total:list.length,
      hold:counts.HOLD||0,
      measure:counts.MEASURE||0,
      graduation_candidates:counts.GRADUATION_CANDIDATE||0,
      rollback_candidates:counts.ROLLBACK_CANDIDATE||0,
      inconclusive:counts.INCONCLUSIVE||0,
      adopted:0,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,LEVELS,sourceEvidence,experimentContract,evidence,evaluate,systemReadiness,summarize});
  if(typeof window!=="undefined")window.BoomDigitalMarketingUniversity=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();