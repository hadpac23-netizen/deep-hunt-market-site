(() => {
  "use strict";
  const fallbackPolicy={
    version:"BOOM-EVIDENCE-CONFIDENCE-V1",
    mode:"ADVISORY_ONLY",
    classes:{
      stock:{fresh_hours:1,recheck_hours:6,stale_hours:24},
      shipping_quote:{fresh_hours:6,recheck_hours:24,stale_hours:72},
      supplier_terms:{fresh_hours:168,recheck_hours:720,stale_hours:2160},
      commercial_rights:{fresh_hours:720,recheck_hours:2160,stale_hours:4320},
      market_signal:{fresh_hours:6,recheck_hours:24,stale_hours:72},
      product_truth:{fresh_hours:168,recheck_hours:720,stale_hours:2160}
    },
    floor_confidence:{FRESH:.80,RECHECK:.50,STALE:0}
  };
  const policy=(typeof module!=="undefined"&&module.exports)
    ? require("./boom-evidence-confidence-policy.json")
    : (window.BoomEvidenceConfidencePolicy||fallbackPolicy);
  const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
  function evaluate(input={},nowMs=Date.now()){
    const type=String(input.type||"");
    const rule=policy.classes[type];
    if(!rule)return {type,state:"UNKNOWN",confidence:0,recheck_required:true,automatic_change:false};
    const observed=Date.parse(input.observed_at||"");
    if(!Number.isFinite(observed))return {type,state:"UNKNOWN",confidence:0,recheck_required:true,automatic_change:false};
    const ageHours=Math.max(0,(Number(nowMs)-observed)/36e5);
    let state="FRESH";
    if(ageHours>=rule.stale_hours)state="STALE";
    else if(ageHours>=rule.recheck_hours)state="RECHECK";
    const base=clamp(input.base_confidence ?? 1);
    const floor=Number(policy.floor_confidence[state]||0);
    const confidence=state==="FRESH"?Math.max(floor,base):Math.min(base,floor);
    return {type,state,age_hours:Number(ageHours.toFixed(2)),confidence:Number(confidence.toFixed(2)),
      recheck_required:state!=="FRESH",automatic_change:false};
  }
  const api={version:policy.version,evaluate,policy};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else window.BoomEvidenceConfidence=api;
})();