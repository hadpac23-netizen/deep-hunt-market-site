(() => {
  "use strict";

  const clean=v=>String(v??"").trim();

  function fnv1a(value){
    let h=2166136261;
    for(const ch of String(value??"")){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return (h>>>0).toString(16).padStart(8,"0");
  }

  function normalizedStage(stage={}){
    return Object.freeze({
      id:clean(stage.id).toUpperCase(),
      name:clean(stage.name),
      pass:stage.pass===true,
      evidence:clean(stage.evidence)
    });
  }

  function build({integrationStages=[],harness=null,generatedAt=null}={}){
    const a1to6=(Array.isArray(integrationStages)?integrationStages:[]).map(normalizedStage);
    const a7Pass=a1to6.length===6&&a1to6.every(x=>x.pass);
    const a8Pass=Boolean(harness?.harness_pass===true&&Number(harness?.passed)===Number(harness?.total)&&Number(harness?.total)>0);

    const stages=[
      ...a1to6,
      Object.freeze({
        id:"A7",
        name:"Integration QA & Alpha Readiness",
        pass:a7Pass,
        evidence:a7Pass?"A1–A6 integration evidence passed":"A1–A6 integration evidence incomplete or blocked"
      }),
      Object.freeze({
        id:"A8",
        name:"Alpha Test Harness",
        pass:a8Pass,
        evidence:harness
          ? String(harness.passed||0)+"/"+String(harness.total||0)+" scenarios passed"
          : "Harness evidence unavailable"
      })
    ];

    const blockers=stages.filter(x=>!x.pass).map(x=>Object.freeze({
      id:x.id,
      name:x.name,
      evidence:x.evidence||"No passing evidence"
    }));
    const ownerReviewReady=stages.length===8&&blockers.length===0;

    const boundaries=Object.freeze({
      production_ready:false,
      production_changed:false,
      execution_allowed:false,
      supplier_calls:0,
      ai_provider_calls:0,
      spend_authorized:false,
      publishing_authorized:false,
      payments_activated:false,
      order_routing_activated:false
    });

    const material=JSON.stringify({
      stages:stages.map(x=>({id:x.id,pass:x.pass,evidence:x.evidence})),
      boundaries
    });
    const fingerprint="A9-"+fnv1a(material).toUpperCase();

    return Object.freeze({
      mode:"A9_OWNER_ALPHA_EVIDENCE_PACK",
      generated_at:generatedAt||new Date().toISOString(),
      evidence_fingerprint:fingerprint,
      stage_count:stages.length,
      stages:Object.freeze(stages),
      blockers:Object.freeze(blockers),
      owner_review_ready:ownerReviewReady,
      release_gate:ownerReviewReady?"ALPHA_OWNER_REVIEW_READY":"BLOCKED_EVIDENCE_REQUIRED",
      owner_gate:"OWNER_REVIEW_REQUIRED",
      alpha_activation_authorized:false,
      production_ready:false,
      boundaries,
      next_safe_action:ownerReviewReady
        ?"Owner may review this evidence snapshot. Alpha activation, merge and Production remain separate explicit decisions."
        :"Resolve only the listed evidence blockers, rerun A7/A8, then rebuild A9. Do not activate Alpha or Production."
    });
  }

  function verifyBoundaries(pack={}){
    const b=pack.boundaries||{};
    const issues=[];
    if(pack.production_ready!==false)issues.push("PRODUCTION_READY_MUST_BE_FALSE");
    if(pack.alpha_activation_authorized!==false)issues.push("ALPHA_ACTIVATION_MUST_BE_FALSE");
    if(b.production_ready!==false)issues.push("BOUNDARY_PRODUCTION_READY");
    if(b.production_changed!==false)issues.push("BOUNDARY_PRODUCTION_CHANGED");
    if(b.execution_allowed!==false)issues.push("BOUNDARY_EXECUTION_ALLOWED");
    if(Number(b.supplier_calls)!==0)issues.push("BOUNDARY_SUPPLIER_CALLS");
    if(Number(b.ai_provider_calls)!==0)issues.push("BOUNDARY_AI_PROVIDER_CALLS");
    if(b.spend_authorized!==false)issues.push("BOUNDARY_SPEND");
    if(b.publishing_authorized!==false)issues.push("BOUNDARY_PUBLISHING");
    if(b.payments_activated!==false)issues.push("BOUNDARY_PAYMENTS");
    if(b.order_routing_activated!==false)issues.push("BOUNDARY_ORDER_ROUTING");
    return Object.freeze({valid:issues.length===0,issues:Object.freeze(issues)});
  }

  const api=Object.freeze({fnv1a,normalizedStage,build,verifyBoundaries});
  if(typeof window!=="undefined")window.BoomAlphaEvidencePack=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
