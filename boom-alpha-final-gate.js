(() => {
  "use strict";

  const DECISIONS=Object.freeze({
    GO:"GO_FOR_PRIVATE_ALPHA_ACTIVATION_PLANNING",
    NO_GO:"NO_GO_HOLD",
    PENDING:"PENDING_OWNER"
  });

  function build({qa=null,preview=null,evidencePack=null}={}){
    const qaPass=Boolean(qa?.rc_qa_pass===true&&qa?.a12_eligible===true&&qa?.passed===qa?.total&&qa?.total>0);
    const previewPass=Boolean(preview?.preview_ready===true&&preview?.production_ready===false&&preview?.payments_activated===false&&preview?.order_routing_activated===false);
    const evidencePass=Boolean(evidencePack?.owner_review_ready===true&&evidencePack?.release_gate==="ALPHA_OWNER_REVIEW_READY"&&evidencePack?.production_ready===false);
    const blockers=[];
    if(!qaPass)blockers.push("A11_RC_QA_NOT_PASSED");
    if(!previewPass)blockers.push("A10_RC_PREVIEW_NOT_READY");
    if(!evidencePass)blockers.push("A9_EVIDENCE_NOT_READY");
    const ready=blockers.length===0;

    return Object.freeze({
      mode:"A12_FINAL_OWNER_GO_NO_GO_GATE",
      final_gate_ready:ready,
      decision_status:DECISIONS.PENDING,
      allowed_decisions:Object.freeze(ready?[DECISIONS.GO,DECISIONS.NO_GO]:[DECISIONS.NO_GO]),
      evidence:Object.freeze({
        a9_fingerprint:String(evidencePack?.evidence_fingerprint||""),
        a10_journey_ready:Number(preview?.journey?.filter?.(x=>x.ready)?.length||0),
        a10_journey_total:Number(preview?.journey?.length||0),
        a10_viewports:Number(preview?.devices?.length||0),
        a11_checks_passed:Number(qa?.passed||0),
        a11_checks_total:Number(qa?.total||0),
        a11_groups_passed:Number(qa?.groups?.filter?.(x=>x.pass)?.length||0),
        a11_groups_total:Number(qa?.groups?.length||0)
      }),
      blockers:Object.freeze(blockers),
      owner_decision_required:true,
      merge_authorized:false,
      private_alpha_activation_authorized:false,
      production_activation_authorized:false,
      payments_activated:false,
      order_routing_activated:false,
      spend_authorized:false,
      publishing_authorized:false,
      provider_execution_authorized:false,
      supplier_execution_authorized:false,
      next_safe_action:ready
        ?"Owner chooses GO for private Alpha activation planning or NO-GO to hold. Neither choice merges or activates Production."
        :"NO-GO/HOLD only until blockers are resolved."
    });
  }

  function recordDecision(gate={},decision=""){
    const value=String(decision||"").trim();
    const allowed=Array.isArray(gate.allowed_decisions)?gate.allowed_decisions:[];
    if(!allowed.includes(value)){
      return Object.freeze({...gate,decision_status:DECISIONS.PENDING,decision_recorded:false,decision_error:"DECISION_NOT_ALLOWED"});
    }
    return Object.freeze({
      ...gate,
      decision_status:value,
      decision_recorded:true,
      decision_error:"",
      merge_authorized:false,
      private_alpha_activation_authorized:false,
      production_activation_authorized:false,
      payments_activated:false,
      order_routing_activated:false,
      spend_authorized:false,
      publishing_authorized:false,
      provider_execution_authorized:false,
      supplier_execution_authorized:false,
      next_safe_action:value===DECISIONS.GO
        ?"Prepare a separate private Alpha activation plan for explicit Owner approval. Do not merge or activate Production."
        :"Hold the RC. Resolve Owner concerns before any activation planning."
    });
  }

  function verifyBoundaries(gate={}){
    const issues=[];
    if(gate.merge_authorized!==false)issues.push("MERGE_MUST_BE_FALSE");
    if(gate.private_alpha_activation_authorized!==false)issues.push("PRIVATE_ALPHA_ACTIVATION_MUST_BE_FALSE");
    if(gate.production_activation_authorized!==false)issues.push("PRODUCTION_ACTIVATION_MUST_BE_FALSE");
    if(gate.payments_activated!==false)issues.push("PAYMENTS_MUST_BE_OFF");
    if(gate.order_routing_activated!==false)issues.push("ORDER_ROUTING_MUST_BE_OFF");
    if(gate.spend_authorized!==false)issues.push("SPEND_MUST_BE_OFF");
    if(gate.publishing_authorized!==false)issues.push("PUBLISHING_MUST_BE_OFF");
    if(gate.provider_execution_authorized!==false)issues.push("PROVIDER_EXECUTION_MUST_BE_OFF");
    if(gate.supplier_execution_authorized!==false)issues.push("SUPPLIER_EXECUTION_MUST_BE_OFF");
    return Object.freeze({valid:issues.length===0,issues:Object.freeze(issues)});
  }

  const api=Object.freeze({DECISIONS,build,recordDecision,verifyBoundaries});
  if(typeof window!=="undefined")window.BoomAlphaFinalGate=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
