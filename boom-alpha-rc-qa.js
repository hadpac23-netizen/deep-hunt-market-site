(() => {
  "use strict";

  const CATEGORIES=Object.freeze(["prerequisites","functional","responsive","accessibility","safety","fallback","regression"]);

  function check(id,category,label,pass,evidence){
    return Object.freeze({
      id:String(id||""),
      category:String(category||""),
      label:String(label||""),
      pass:pass===true,
      evidence:String(evidence??"")
    });
  }

  function run({preview=null,evidencePack=null,harness=null,domAudit={}}={}){
    const journey=Array.isArray(preview?.journey)?preview.journey:[];
    const devices=Array.isArray(preview?.devices)?preview.devices:[];
    const ids=new Set(devices.map(x=>Number(x.width)));
    const checks=[
      check("P1","prerequisites","A8 harness passes",Boolean(harness?.harness_pass===true&&harness?.passed===harness?.total&&harness?.total>0),harness?String(harness.passed)+"/"+String(harness.total):"missing"),
      check("P2","prerequisites","A9 evidence is Owner-review ready",Boolean(evidencePack?.owner_review_ready===true&&evidencePack?.release_gate==="ALPHA_OWNER_REVIEW_READY"),String(evidencePack?.release_gate||"missing")),
      check("P3","prerequisites","A10 private RC preview is ready",preview?.preview_ready===true,String(preview?.preview_ready??false)),

      check("F1","functional","All six RC journey steps are ready",journey.length===6&&journey.every(x=>x.ready===true),journey.filter(x=>x.ready===true).length+"/"+journey.length),
      check("F2","functional","Journey contains Discover",journey.some(x=>x.id==="discover"&&x.ready===true),"discover"),
      check("F3","functional","Journey contains Product Truth",journey.some(x=>x.id==="product"&&x.ready===true),"product"),
      check("F4","functional","Journey contains Memory / History",journey.some(x=>x.id==="memory"&&x.ready===true),"memory"),
      check("F5","functional","Journey contains Stylist / Safe Mirror",journey.some(x=>x.id==="stylist"&&x.ready===true),"stylist"),
      check("F6","functional","Journey contains Creative Owner Gate",journey.some(x=>x.id==="creative"&&x.ready===true),"creative"),
      check("F7","functional","Journey contains Checkout fallback",journey.some(x=>x.id==="checkout"&&x.ready===true),"checkout"),

      check("R1","responsive","Mobile 390 contract exists",ids.has(390),[...ids].join(",")),
      check("R2","responsive","Tablet 768 contract exists",ids.has(768),[...ids].join(",")),
      check("R3","responsive","Desktop 1280 contract exists",ids.has(1280),[...ids].join(",")),
      check("R4","responsive","Wide 1440 contract exists",ids.has(1440),[...ids].join(",")),

      check("A1","accessibility","Document language is declared",domAudit.lang==="he",String(domAudit.lang||"missing")),
      check("A2","accessibility","RTL direction is declared",domAudit.dir==="rtl",String(domAudit.dir||"missing")),
      check("A3","accessibility","Viewport meta exists",domAudit.viewport===true,String(domAudit.viewport===true)),
      check("A4","accessibility","No duplicate DOM ids",Number(domAudit.duplicate_ids||0)===0,String(domAudit.duplicate_ids??"unknown")),
      check("A5","accessibility","All Alpha action buttons have explicit type",Number(domAudit.alpha_buttons_without_type||0)===0,String(domAudit.alpha_buttons_without_type??"unknown")),

      check("S1","safety","RC remains Owner private",preview?.visibility==="OWNER_PRIVATE_STUDIO",String(preview?.visibility||"missing")),
      check("S2","safety","Alpha activation remains off",preview?.alpha_activation_authorized===false,String(preview?.alpha_activation_authorized)),
      check("S3","safety","Production remains not ready",preview?.production_ready===false&&preview?.production_changed===false,String(preview?.production_ready)+"/"+String(preview?.production_changed)),
      check("S4","safety","Payments remain off",preview?.payments_activated===false,String(preview?.payments_activated)),
      check("S5","safety","Order routing remains off",preview?.order_routing_activated===false,String(preview?.order_routing_activated)),
      check("S6","safety","Supplier and AI provider calls remain zero",Number(preview?.supplier_calls)===0&&Number(preview?.provider_calls)===0,String(preview?.supplier_calls)+"/"+String(preview?.provider_calls)),
      check("S7","safety","Spend and publishing remain off",preview?.spend_authorized===false&&preview?.publishing_authorized===false,String(preview?.spend_authorized)+"/"+String(preview?.publishing_authorized)),

      check("B1","fallback","Current storefront remains fallback",preview?.current_storefront_fallback===true,String(preview?.current_storefront_fallback)),
      check("B2","fallback","Checkout remains simulation-only",preview?.checkout_mode==="SIMULATION_ONLY",String(preview?.checkout_mode||"missing")),

      check("G1","regression","A9 evidence fingerprint is carried into RC",Boolean(preview?.evidence_fingerprint&&preview?.evidence_fingerprint===evidencePack?.evidence_fingerprint),String(preview?.evidence_fingerprint||"missing")),
      check("G2","regression","A8 negative scenarios all pass their expected fail-closed behavior",Boolean(harness?.scenarios?.length===4&&harness.scenarios.every(x=>x.harness_pass===true)),String(harness?.scenarios?.filter?.(x=>x.harness_pass===true)?.length||0)+"/4"),
      check("G3","regression","A9 boundary pack remains non-executable",Boolean(evidencePack?.boundaries?.execution_allowed===false&&evidencePack?.boundaries?.payments_activated===false&&evidencePack?.boundaries?.order_routing_activated===false),"execution/payments/routing off")
    ];

    const failed=checks.filter(x=>!x.pass);
    const groups=CATEGORIES.map(category=>{
      const rows=checks.filter(x=>x.category===category);
      return Object.freeze({
        category,
        passed:rows.filter(x=>x.pass).length,
        total:rows.length,
        pass:rows.length>0&&rows.every(x=>x.pass)
      });
    });
    const pass=failed.length===0&&groups.every(x=>x.pass);

    return Object.freeze({
      mode:"A11_FULL_RC_QA_REGRESSION",
      rc_qa_pass:pass,
      checks:Object.freeze(checks),
      groups:Object.freeze(groups),
      passed:checks.length-failed.length,
      total:checks.length,
      blockers:Object.freeze(failed.map(x=>x.id)),
      owner_gate:"OWNER_REVIEW_REQUIRED",
      a12_eligible:pass,
      alpha_activation_authorized:false,
      production_ready:false,
      production_changed:false,
      payments_activated:false,
      order_routing_activated:false,
      spend_authorized:false,
      publishing_authorized:false,
      next_safe_action:pass
        ?"A11 passed. Build A12 Final Owner Go/No-Go evidence gate; do not merge or activate Production."
        :"Fix only the failed RC QA checks and rerun A11. A12 remains blocked."
    });
  }

  const api=Object.freeze({CATEGORIES,run});
  if(typeof window!=="undefined")window.BoomAlphaRCQA=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
