(() => {
  "use strict";

  const DEVICES=Object.freeze([
    Object.freeze({id:"mobile",label:"Mobile",width:390,height:844}),
    Object.freeze({id:"tablet",label:"Tablet",width:768,height:1024}),
    Object.freeze({id:"desktop",label:"Desktop",width:1280,height:800}),
    Object.freeze({id:"wide",label:"Wide",width:1440,height:900})
  ]);

  const JOURNEY=Object.freeze([
    Object.freeze({id:"discover",label:"Discover",requires:["A1","A2","A4"],contract:"Verified products + explainable discovery"}),
    Object.freeze({id:"product",label:"Product",requires:["A1"],contract:"Product Truth before persuasion"}),
    Object.freeze({id:"memory",label:"Like / Save / History",requires:["A3"],contract:"User-controlled memory with no hidden profile write"}),
    Object.freeze({id:"stylist",label:"Stylist / Safe Mirror",requires:["A5"],contract:"Consent-first preview; no body or attractiveness scoring"}),
    Object.freeze({id:"creative",label:"Creative",requires:["A6"],contract:"Draft-only creative with proof boundary and Owner Gate"}),
    Object.freeze({id:"checkout",label:"Checkout Fallback",requires:["A7","A8","A9"],contract:"No live payment; existing storefront remains fallback"})
  ]);

  function build({evidencePack=null,harness=null}={}){
    const evidenceOk=Boolean(
      evidencePack?.mode==="A9_OWNER_ALPHA_EVIDENCE_PACK" &&
      evidencePack?.owner_review_ready===true &&
      evidencePack?.release_gate==="ALPHA_OWNER_REVIEW_READY" &&
      evidencePack?.production_ready===false &&
      evidencePack?.alpha_activation_authorized===false &&
      evidencePack?.boundaries?.payments_activated===false &&
      evidencePack?.boundaries?.order_routing_activated===false
    );
    const harnessOk=Boolean(harness?.harness_pass===true&&Number(harness?.passed)===Number(harness?.total)&&Number(harness?.total)>0);
    const stageMap=new Map((evidencePack?.stages||[]).map(x=>[String(x.id||"").toUpperCase(),x.pass===true]));
    const screens=JOURNEY.map(step=>{
      const missing=step.requires.filter(id=>stageMap.get(id)!==true);
      return Object.freeze({
        ...step,
        ready:evidenceOk&&harnessOk&&missing.length===0,
        missing:Object.freeze(missing),
        data_mode:"SNAPSHOT_ONLY",
        live_mutation:false
      });
    });
    const blockers=[];
    if(!evidenceOk)blockers.push("A9_EVIDENCE_NOT_READY");
    if(!harnessOk)blockers.push("A8_HARNESS_NOT_READY");
    for(const screen of screens){
      if(screen.missing.length)blockers.push(screen.id.toUpperCase()+"_MISSING_"+screen.missing.join("_"));
    }
    const previewReady=blockers.length===0&&screens.every(x=>x.ready);
    return Object.freeze({
      mode:"A10_ALPHA_RC_PREVIEW",
      preview_ready:previewReady,
      visibility:"OWNER_PRIVATE_STUDIO",
      source:"A9_EVIDENCE_SNAPSHOT",
      evidence_fingerprint:String(evidencePack?.evidence_fingerprint||""),
      devices:DEVICES,
      journey:Object.freeze(screens),
      blockers:Object.freeze(blockers),
      current_storefront_fallback:true,
      checkout_mode:"SIMULATION_ONLY",
      payments_activated:false,
      order_routing_activated:false,
      provider_calls:0,
      supplier_calls:0,
      spend_authorized:false,
      publishing_authorized:false,
      alpha_activation_authorized:false,
      production_ready:false,
      production_changed:false,
      owner_gate:"OWNER_REVIEW_REQUIRED",
      next_safe_action:previewReady
        ?"Inspect the private RC preview across all four viewport contracts, then move to A11 full RC QA. Do not merge or activate Production."
        :"Resolve the listed evidence blockers before preview QA."
    });
  }

  function verify(preview={}){
    const issues=[];
    if(preview.visibility!=="OWNER_PRIVATE_STUDIO")issues.push("PREVIEW_MUST_BE_PRIVATE");
    if(preview.current_storefront_fallback!==true)issues.push("STOREFRONT_FALLBACK_REQUIRED");
    if(preview.checkout_mode!=="SIMULATION_ONLY")issues.push("CHECKOUT_MUST_BE_SIMULATION_ONLY");
    if(preview.payments_activated!==false)issues.push("PAYMENTS_MUST_BE_OFF");
    if(preview.order_routing_activated!==false)issues.push("ORDER_ROUTING_MUST_BE_OFF");
    if(Number(preview.provider_calls)!==0)issues.push("PROVIDER_CALLS_MUST_BE_ZERO");
    if(Number(preview.supplier_calls)!==0)issues.push("SUPPLIER_CALLS_MUST_BE_ZERO");
    if(preview.spend_authorized!==false)issues.push("SPEND_MUST_BE_OFF");
    if(preview.publishing_authorized!==false)issues.push("PUBLISHING_MUST_BE_OFF");
    if(preview.alpha_activation_authorized!==false)issues.push("ALPHA_ACTIVATION_MUST_BE_OFF");
    if(preview.production_ready!==false)issues.push("PRODUCTION_READY_MUST_BE_FALSE");
    if(preview.production_changed!==false)issues.push("PRODUCTION_CHANGED_MUST_BE_FALSE");
    if(preview.owner_gate!=="OWNER_REVIEW_REQUIRED")issues.push("OWNER_GATE_REQUIRED");
    return Object.freeze({valid:issues.length===0,issues:Object.freeze(issues)});
  }

  const api=Object.freeze({DEVICES,JOURNEY,build,verify});
  if(typeof window!=="undefined")window.BoomAlphaRCPreview=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
