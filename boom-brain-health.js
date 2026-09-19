(() => {
  "use strict";
  const DEFAULTS={error_sample_min:20,error_rate_shadow:.25,conflict_sample_min:10,conflict_rate_shadow:.20};
  function evaluate(input={},thresholds=DEFAULTS){
    const current=String(input.lifecycle||"SHADOW").toUpperCase();
    const reasons=[];
    let recommended=current;
    if(input.safety_policy_failure||input.compromised_credentials||input.known_data_corruption){
      recommended="OFF"; reasons.push("HARD_OFF");
    }else{
      if(input.commercial_rights_valid===false)reasons.push("COMMERCIAL_RIGHTS_INVALID");
      if(input.critical_evidence_fresh===false)reasons.push("CRITICAL_EVIDENCE_STALE");
      if(input.required_dependency_available===false)reasons.push("REQUIRED_DEPENDENCY_UNAVAILABLE");
      if(Number(input.error_samples||0)>=thresholds.error_sample_min&&Number(input.error_rate||0)>=thresholds.error_rate_shadow)reasons.push("ERROR_RATE_EXCEEDED");
      if(Number(input.conflict_samples||0)>=thresholds.conflict_sample_min&&Number(input.conflict_rate||0)>=thresholds.conflict_rate_shadow)reasons.push("CONFLICT_RATE_EXCEEDED");
      if(reasons.length&&!["OFF","DEPRECATED"].includes(current))recommended="SHADOW";
    }
    return {brain_id:String(input.brain_id||""),current_lifecycle:current,recommended_lifecycle:recommended,healthy:recommended===current&&!reasons.length,reasons,automatic_change:false};
  }
  const api={version:"BOOM-BRAIN-HEALTH-V1",evaluate,defaults:{...DEFAULTS}};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else window.BoomBrainHealth=api;
})();
