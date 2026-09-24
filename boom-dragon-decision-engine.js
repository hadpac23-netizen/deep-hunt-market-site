(() => {
  "use strict";

  const clean=v=>String(v??"").trim();
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number(v)||0));
  const isoMs=v=>{
    const t=v?Date.parse(String(v)):NaN;
    return Number.isFinite(t)?t:null;
  };

  const MATERIAL_ACTIONS=new Set([
    "production_deploy","external_spend","payment_enable","supplier_live_order",
    "campaign_publish","price_change","coupon_activate","runtime_enable"
  ]);

  function productPoints(p){
    if(!p||p.status==="BLOCKED")return 0;
    if(p.stale)return 4;
    if(p.status==="READY"&&p.live===true)return 20;
    if(p.status==="READY")return 13;
    return 6;
  }
  function journeyPoints(j){
    if(!j||j.status==="BLOCKED")return 0;
    if(j.stale)return 4;
    if(j.purchase_truth?.buyer_ready===true&&j.status==="READY")return 20;
    if(j.mode==="PREPURCHASE_LIVE_BUYER_PREP")return 10;
    return 6;
  }
  function profitPoints(p){
    const s=clean(p?.status).toUpperCase();
    if(s==="REALIZED_FINAL"&&p?.realized===true)return 20;
    if(s==="FULFILLED_PROVISIONAL")return 14;
    if(s==="PAID_PROVISIONAL")return 12;
    if(s==="QUOTE_PROFIT_PREVIEW")return 8;
    if(s==="QUOTE_PROFIT_HOLD")return 3;
    return 0;
  }
  function contentPoints(c){
    if(!c||c.status==="BLOCKED")return 0;
    if(c.readiness?.winner_eligible===true)return 15;
    if((c.counts?.creative_drafts||0)>0)return 6;
    return 2;
  }
  function launchPoints(gates=[]){
    if(!Array.isArray(gates)||!gates.length)return 0;
    const weighted=gates.map(g=>{
      const s=clean(g.status).toUpperCase();
      const w=g.blocks_real_money===true?2:1;
      const value=s==="PASS"?1:s==="PARTIAL"?0.45:s==="HOLD"?0.35:0;
      return {w,value};
    });
    const denom=weighted.reduce((a,x)=>a+x.w,0)||1;
    const raw=weighted.reduce((a,x)=>a+x.w*x.value,0)/denom;
    return Math.round(raw*25);
  }

  function freshnessStatus(source){
    if(!source)return "UNKNOWN";
    if(source.stale===true)return "STALE";
    const ts=isoMs(source.generated_at||source.updated_at||source.observed_at||source.checked_at);
    if(!ts)return "UNKNOWN";
    const age=Date.now()-ts;
    if(age>7*86400000)return "STALE";
    if(age>24*3600000)return "AGING";
    return "FRESH";
  }

  function evidenceEntry(key,label,source,status,detail=""){
    return Object.freeze({
      key,label,status:status||"UNKNOWN",
      freshness:freshnessStatus(source),
      detail:clean(detail),
      source:clean(source?.source||source?.truth_engine||source?.mode||"")
    });
  }

  function hardGateSummary(gates=[]){
    const blockers=(Array.isArray(gates)?gates:[]).filter(g=>
      g?.blocks_real_money===true && ["FAIL","PARTIAL","HOLD"].includes(clean(g.status).toUpperCase())
    );
    return Object.freeze({
      blocked:blockers.length>0,
      count:blockers.length,
      blockers:Object.freeze(blockers.map(g=>Object.freeze({
        gate_key:clean(g.gate_key),
        title:clean(g.title),
        status:clean(g.status).toUpperCase(),
        next_action:clean(g.next_action),
        updated_at:g.updated_at||g.observed_at||null
      })))
    });
  }

  function confidenceFor(inputs,evidence){
    const presence=[
      Boolean(inputs.product),
      Boolean(inputs.journey),
      Boolean(inputs.profit),
      Boolean(inputs.content),
      Array.isArray(inputs.launch_gates)&&inputs.launch_gates.length>0
    ];
    let score=presence.filter(Boolean).length/5;
    const stale=evidence.filter(x=>x.freshness==="STALE").length;
    const unknown=evidence.filter(x=>x.freshness==="UNKNOWN").length;
    score-=stale*0.07+unknown*0.04;
    return clamp(Math.round(score*100));
  }

  function confidenceLabel(v){
    if(v>=80)return "HIGH";
    if(v>=60)return "MEDIUM";
    return "LOW";
  }

  function riskFor(card){
    if(card.hard_gates.blocked)return "HIGH";
    if(card.unknowns.length>=4)return "HIGH";
    if(card.unknowns.length>=2)return "MEDIUM";
    return "LOW";
  }

  function selectNextAction(inputs,hardGates){
    const failed=hardGates.blockers.find(x=>x.status==="FAIL");
    if(failed)return Object.freeze({
      action_class:"PREPARE_FIX",
      target:failed.gate_key||"launch_gate",
      text:failed.next_action||("Resolve "+failed.title),
      owner_gate_required:false,
      execution:"PREPARE_ONLY"
    });
    if(inputs.product?.stale===true)return Object.freeze({
      action_class:"REFRESH_EVIDENCE",
      target:"product_truth",
      text:"Refresh Product Truth before any scale or launch decision.",
      owner_gate_required:false,
      execution:"SHADOW_ONLY"
    });
    if(inputs.journey?.stale===true)return Object.freeze({
      action_class:"REFRESH_EVIDENCE",
      target:"customer_journey",
      text:"Refresh Customer Journey evidence and re-evaluate Buyer/Repeat truth.",
      owner_gate_required:false,
      execution:"SHADOW_ONLY"
    });
    if(inputs.profit?.realized!==true)return Object.freeze({
      action_class:"PROVE_ECONOMICS",
      target:"order_profit",
      text:"Complete one non-test paid → fulfilled → financially finalized order evidence path.",
      owner_gate_required:true,
      execution:"OWNER_GATED"
    });
    if(inputs.content?.readiness?.winner_eligible!==true)return Object.freeze({
      action_class:"RUN_EVIDENCE_TEST",
      target:"content_feedback",
      text:"Prepare one owner-approved canonical Creative ID test and collect attributed purchase + settled profit evidence.",
      owner_gate_required:true,
      execution:"OWNER_GATED"
    });
    return Object.freeze({
      action_class:"OWNER_REVIEW",
      target:"decision",
      text:"Evidence is ready for Owner Gate review before any material action.",
      owner_gate_required:true,
      execution:"OWNER_GATED"
    });
  }

  function assess(raw={}){
    const inputs={
      product:raw.product||null,
      journey:raw.journey||null,
      profit:raw.profit||null,
      content:raw.content||null,
      launch_gates:Array.isArray(raw.launch_gates)?raw.launch_gates:[],
      f50_evidence:Array.isArray(raw.f50_evidence)?raw.f50_evidence:[]
    };

    const dimensions=Object.freeze({
      product_truth:productPoints(inputs.product),
      customer_truth:journeyPoints(inputs.journey),
      profit_truth:profitPoints(inputs.profit),
      content_learning:contentPoints(inputs.content),
      launch_readiness:launchPoints(inputs.launch_gates)
    });
    const score=Object.values(dimensions).reduce((a,b)=>a+b,0);

    const evidence=[
      evidenceEntry("product_truth","Product Truth",inputs.product,inputs.product?.status,inputs.product?.blockers?.join(" · ")),
      evidenceEntry("customer_journey","Customer Journey",inputs.journey,inputs.journey?.status,inputs.journey?.mode),
      evidenceEntry("order_profit","Order → Profit",inputs.profit,inputs.profit?.status,inputs.profit?.issues?.join(" · ")),
      evidenceEntry("content_feedback","Content Feedback",inputs.content,inputs.content?.status,inputs.content?.blockers?.join(" · "))
    ];
    if(inputs.launch_gates.length){
      const newest=inputs.launch_gates.reduce((best,g)=>{
        const t=isoMs(g.updated_at||g.observed_at)||0;
        return t>(best.t||0)?{t,source:g}:best;
      },{t:0,source:null});
      evidence.push(evidenceEntry(
        "launch_readiness","Launch Readiness",newest.source||{},
        inputs.launch_gates.every(g=>clean(g.status).toUpperCase()==="PASS")?"PASS":"MIXED",
        inputs.launch_gates.map(g=>clean(g.gate_key)+":"+clean(g.status)).join(" · ")
      ));
    } else {
      evidence.push(evidenceEntry("launch_readiness","Launch Readiness",null,"UNKNOWN","No launch gate evidence loaded"));
    }

    const hardGates=hardGateSummary(inputs.launch_gates);
    const unknowns=[];
    if(!inputs.product)unknowns.push("PRODUCT_TRUTH_NOT_LOADED");
    else if(inputs.product.stale)unknowns.push("PRODUCT_TRUTH_STALE");
    if(!inputs.journey)unknowns.push("CUSTOMER_JOURNEY_NOT_LOADED");
    else if(inputs.journey.stale)unknowns.push("CUSTOMER_JOURNEY_STALE");
    if(!inputs.profit)unknowns.push("ORDER_PROFIT_NOT_LOADED");
    else if(inputs.profit.realized!==true)unknowns.push("REALIZED_PROFIT_NOT_PROVEN");
    if(!inputs.content)unknowns.push("CONTENT_FEEDBACK_NOT_LOADED");
    else if(inputs.content.readiness?.winner_eligible!==true)unknowns.push("CONTENT_WINNER_NOT_ELIGIBLE");
    if(!inputs.launch_gates.length)unknowns.push("LAUNCH_GATES_NOT_LOADED");

    const confidence=confidenceFor(inputs,evidence);
    let status="TEST";
    if(hardGates.blocked||unknowns.includes("PRODUCT_TRUTH_STALE")||unknowns.includes("CUSTOMER_JOURNEY_STALE"))status="HOLD";
    else if(score>=85&&confidence>=80&&unknowns.length===0)status="READY";
    else if(score<25&&confidence>=70)status="HOLD";

    const nextAction=selectNextAction(inputs,hardGates);
    const ownerGateRequired=nextAction.owner_gate_required===true ||
      MATERIAL_ACTIONS.has(clean(raw.action_class));

    const card={
      version:"dragon-decision-v1",
      generated_at:new Date().toISOString(),
      status,
      readiness_score:score,
      score_kind:"DECISION_READINESS",
      confidence,
      confidence_label:confidenceLabel(confidence),
      dimensions,
      hard_gates:hardGates,
      evidence:Object.freeze(evidence),
      unknowns:Object.freeze(unknowns),
      next_action:nextAction,
      owner_gate_required:ownerGateRequired,
      execution_mode:"SHADOW_ONLY",
      persisted:false,
      risk:null
    };
    card.risk=riskFor(card);
    return Object.freeze(card);
  }

  async function loadLiveContext(){
    const client=window.BOOM_SUPABASE_CLIENT;
    let launch_gates=[],f50_evidence=[];
    if(client){
      try{
        const {data}=await client.from("hunt_launch_readiness_evidence")
          .select("gate_key,gate_group,title,status,blocks_soft_launch,blocks_real_money,source,next_action,observed_at,updated_at")
          .order("gate_group");
        if(Array.isArray(data))launch_gates=data;
      }catch{}
      try{
        const {data}=await client.from("f50_evidence_records")
          .select("source_kind,claim,verified,independent,checked_at")
          .eq("verified",true)
          .eq("independent",true)
          .order("checked_at",{ascending:false})
          .limit(20);
        if(Array.isArray(data))f50_evidence=data;
      }catch{}
    }
    return {launch_gates,f50_evidence};
  }

  async function evaluateBrowser(){
    const live=await loadLiveContext();
    const card=assess({
      product:window.DRAGON_PRODUCT_TRUTH_STATE||null,
      journey:window.DRAGON_CUSTOMER_JOURNEY_STATE||null,
      profit:window.DragonOrderProfit?.readLastPreview?.()||null,
      content:window.DRAGON_CONTENT_FEEDBACK_STATE||null,
      launch_gates:live.launch_gates,
      f50_evidence:live.f50_evidence
    });
    window.DRAGON_DECISION_STATE=card;
    window.dispatchEvent(new CustomEvent("dragon:decision",{detail:card}));
    return card;
  }

  function prepareDecisionRecord(card=window.DRAGON_DECISION_STATE){
    if(!card)return null;
    return Object.freeze({
      decision_key:"dragon:"+new Date(card.generated_at).toISOString().slice(0,13),
      title:"DRAGON CORE Decision Readiness",
      decision_type:"system_readiness",
      status:clean(card.status).toLowerCase(),
      priority:card.risk==="HIGH"?100:card.risk==="MEDIUM"?70:40,
      source_reports:{
        version:card.version,
        readiness_score:card.readiness_score,
        confidence:card.confidence,
        evidence:card.evidence,
        unknowns:card.unknowns,
        hard_gates:card.hard_gates
      },
      rationale:"Shadow-mode deterministic readiness assessment. No execution implied.",
      action_class:card.next_action?.action_class||"NO_ACTION",
      owner_approval_required:card.owner_gate_required===true,
      proposed_action:card.next_action||{},
      result:{execution_mode:"SHADOW_ONLY",persisted:false}
    });
  }

  const api=Object.freeze({
    assess,loadLiveContext,evaluateBrowser,prepareDecisionRecord,
    confidenceLabel,MATERIAL_ACTIONS
  });

  if(typeof window!=="undefined"){
    window.DragonDecisionEngine=api;
    const rerun=()=>setTimeout(evaluateBrowser,50);
    ["dragon:product-truth","dragon:customer-journey","hunt:order-profit-preview","dragon:content-feedback"]
      .forEach(name=>window.addEventListener(name,rerun));
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(evaluateBrowser,350));
    else setTimeout(evaluateBrowser,350);
  }
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();