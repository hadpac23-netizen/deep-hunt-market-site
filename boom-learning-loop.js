(() => {
  "use strict";
  function decide(experiment={},evidence={}){
    const status=String(experiment.status||"draft");
    if(experiment.paid===true&&experiment.owner_approval_status!=="approved")
      return Object.freeze({decision:"hold",reason:"Paid experiment is owner-locked.",next:"Wait for explicit owner approval."});
    const sample=Number(evidence.sampleSize||0),min=Number(experiment.min_sample_size||0);
    if(status==="draft")return Object.freeze({decision:"prepare",reason:"Experiment is still a draft.",next:"Finish treatment, control, KPI and guardrails."});
    if(status==="ready")return Object.freeze({decision:"run",reason:"Experiment is ready and within current guardrails.",next:"Start only on the allowed owned/organic surface."});
    if(status==="testing"&&min>0&&sample<min)return Object.freeze({decision:"collect",reason:"Sample "+sample+"/"+min+" is not sufficient.",next:"Keep collecting; do not declare a winner."});
    if(status==="testing"&&!Number.isFinite(Number(evidence.liftPct)))return Object.freeze({decision:"collect",reason:"No comparable outcome evidence yet.",next:"Measure treatment vs control using the primary KPI."});
    const lift=Number(evidence.liftPct||0);
    if(lift>5&&evidence.guardrailBreached!==true)return Object.freeze({decision:"candidate_win",reason:"Measured lift "+lift.toFixed(1)+"% with no supplied guardrail breach.",next:"Red-team the result, then owner reviews adoption."});
    if(lift<-5)return Object.freeze({decision:"candidate_loss",reason:"Measured lift "+lift.toFixed(1)+"%.",next:"Stop/rollback treatment and record the learning."});
    return Object.freeze({decision:"inconclusive",reason:"Evidence does not justify a winner.",next:"Refine the hypothesis or collect more data."});
  }
  const api=Object.freeze({decide});
  if(typeof window!=="undefined")window.BoomLearningLoop=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();