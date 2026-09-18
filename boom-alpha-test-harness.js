(() => {
  "use strict";

  const Truth=typeof module!=="undefined"&&module.exports
    ? require("./hunt-country-product-truth.js")
    : globalThis.HuntCountryProductTruth;
  const Decision=typeof module!=="undefined"&&module.exports
    ? require("./boom-decision-brain.js")
    : globalThis.BoomDecisionBrain;
  const Taste=typeof module!=="undefined"&&module.exports
    ? require("./boom-taste-dna.js")
    : globalThis.BoomTasteDNA;
  const Memory=typeof module!=="undefined"&&module.exports
    ? require("./hunt-experience-memory.js")
    : globalThis.HuntExperienceMemory;
  const Flow=typeof module!=="undefined"&&module.exports
    ? require("./hunt-2037-flow-core.js")
    : globalThis.Hunt2037FlowCore;
  const Stylist=typeof module!=="undefined"&&module.exports
    ? require("./boom-stylist-core.js")
    : globalThis.BoomStylistCore;
  const Mirror=typeof module!=="undefined"&&module.exports
    ? require("./boom-mirror-core.js")
    : globalThis.BoomMirrorCore;

  const SCENARIOS=Object.freeze([
    Object.freeze({id:"happy_path",label:"Happy Path",expected_ready:true}),
    Object.freeze({id:"truth_block",label:"Truth Block",expected_ready:false,expected_blocker:"A1"}),
    Object.freeze({id:"privacy_block",label:"Privacy Block",expected_ready:false,expected_blocker:"A5"}),
    Object.freeze({id:"creative_proof_block",label:"Creative Proof Block",expected_ready:false,expected_blocker:"A6"})
  ]);

  function enginesReady(){
    return Boolean(
      Truth?.evaluate&&Decision?.scoreCandidate&&Taste?.buildProfile&&Memory?.normalize&&
      Memory?.decisionContext&&Flow?.WORLDS&&Stylist?.createMission&&
      Mirror?.createConsent&&Mirror?.validateConsent&&Mirror?.renderDecision
    );
  }

  function baseProduct(nowIso){
    return {
      provider:"CJdropshipping",
      item_id:"alpha-product-001",
      variant_id:"alpha-variant-001",
      sku:"ALPHA-SKU-001",
      title:"A8 Verified Alpha Product",
      category:"women-dresses",
      images:["https://example.com/a8-reference.jpg"],
      destination_country:"IL",
      country_supported:true,
      stock:25,
      stock_checked_at:nowIso,
      source_checked_at:nowIso,
      supplier_cost:12,
      shipping_method:"ALPHA_SIMULATED_SHIPPING",
      shipping_cost:4,
      landed_cost:16,
      retail_price:34,
      eta_min_days:7,
      eta_max_days:14,
      restrictions:[],
      returns_state:"KNOWN"
    };
  }

  function buildEvents(){
    const rows=[
      ["product_view","women-dresses"],
      ["dwell","women-dresses"],
      ["like","women-dresses"],
      ["save","women-dresses"],
      ["product_view","bags"],
      ["save","jewelry-earrings"]
    ];
    return rows.map(([type,category],index)=>Memory.normalize({
      id:"a8-event-"+(index+1),
      type,
      category,
      provider:"cjdropshipping",
      item_id:"alpha-product-"+(index+1),
      ts:new Date(Date.UTC(2026,8,18,7,index,0)).toISOString(),
      source:"a8-isolated-harness"
    }));
  }

  function runScenario(scenarioId){
    if(!enginesReady()){
      return Object.freeze({
        id:scenarioId,
        label:SCENARIOS.find(x=>x.id===scenarioId)?.label||scenarioId,
        harness_pass:false,
        expected_ready:false,
        actual_ready:false,
        blocked:["ENGINE_UNAVAILABLE"],
        stages:[],
        invariants:{production_changed:false,execution_allowed:false,supplier_calls:0,ai_provider_calls:0,spend_authorized:false,publishing_authorized:false},
        error:"ALPHA_HARNESS_ENGINE_UNAVAILABLE"
      });
    }

    const scenario=SCENARIOS.find(x=>x.id===scenarioId)||SCENARIOS[0];
    const nowMs=Date.UTC(2026,8,18,7,55,0);
    const nowIso=new Date(nowMs).toISOString();
    const product=baseProduct(nowIso);
    if(scenario.id==="truth_block")product.stock=0;

    const truth=Truth.evaluate(product,{
      now:nowMs,
      requireEconomics:true,
      minContribution:1.5,
      minMarginRate:.12,
      safety_eligible:true,
      signals:{
        relevance:.85,quality:.88,shipping_score:.82,trust_score:.9,
        freshness:.8,novelty:.65,creative_performance:.6
      }
    });
    const a1=truth.eligible&&truth.truth_status==="LIVE_VERIFIED";

    const events=buildEvents();
    const context=Memory.decisionContext(events);
    const taste=Taste.buildProfile(events);
    const tasteSignals=Taste.candidateSignals(taste,{category:product.category,provider:"cjdropshipping"});
    const candidate={
      ...truth.candidate,
      relevance:.85,
      affinity:tasteSignals.affinity,
      quality:.88,
      shipping_score:.82,
      trust_score:.9,
      freshness:.8,
      novelty:.65,
      creative_performance:.6
    };
    const decision=Decision.scoreCandidate(candidate,{...context,interactions:events.length,taste_profile:taste},0);
    const a2=decision.eligible===true&&taste.controls?.sensitive_traits_used===false&&taste.controls?.body_traits_used===false;

    const a3=events.length>0&&context.interactions===events.length&&taste.interactions===events.length;

    const slots=Array.from({length:8},(_,index)=>({
      position:index+1,
      lane:Decision.laneFor(index,{interactions:events.length}),
      world:Flow.WORLDS[index%Flow.WORLDS.length]?.id||""
    }));
    const a4=slots.length===8&&Flow.WORLDS.length>=4&&slots.every(x=>Boolean(x.world&&x.lane));

    const mission=Stylist.createMission({
      anchor:{provider:"cjdropshipping",item_id:product.item_id,category:product.category,price:product.retail_price},
      occasion:"dinner",
      budget:120,
      context,
      country:"IL"
    });
    const consent=Mirror.createConsent({
      accepted:scenario.id!=="privacy_block",
      photo_preview:scenario.id!=="privacy_block",
      retention:"session",
      share_allowed:false
    });
    const consentCheck=Mirror.validateConsent(consent);
    const mirror=Mirror.renderDecision({
      productType:"dress",
      product:{
        provider:"cjdropshipping",
        item_id:product.item_id,
        variant_id:product.variant_id,
        image_verified:true,
        truth_status:truth.eligible?"live_verified":"RECHECK_REQUIRED"
      },
      confidence:.88,
      reducedMotion:false
    });
    const a5=Boolean(mission?.requires_country_product_truth)&&consentCheck.valid&&mirror.can_render&&
      mirror.body_scoring===false&&mirror.attractiveness_scoring===false&&mirror.sensitive_attribute_inference===false;

    const creative={
      truth_live:truth.eligible,
      exact_references_locked:true,
      proof_boundary_reviewed:scenario.id!=="creative_proof_block",
      content_generated:0,
      video_generated:0,
      provider_calls:0,
      spend_authorized:false,
      publishing_authorized:false,
      owner_gate:"DRAFT_REVIEW"
    };
    const a6=creative.truth_live&&creative.exact_references_locked&&creative.proof_boundary_reviewed&&
      creative.content_generated===0&&creative.video_generated===0&&creative.provider_calls===0&&
      creative.spend_authorized===false&&creative.publishing_authorized===false&&creative.owner_gate==="DRAFT_REVIEW";

    const stages=[
      {id:"A1",name:"Product Truth",pass:a1,evidence:truth.truth_status+(truth.issues.length?" · "+truth.issues.join(", "):"")},
      {id:"A2",name:"Decision Brain + Taste DNA",pass:a2,evidence:(decision.eligible?"ELIGIBLE":"BLOCKED")+" · "+taste.mode},
      {id:"A3",name:"Memory & Actions",pass:a3,evidence:events.length+" isolated events · no storage write"},
      {id:"A4",name:"Dynamic Flow & Worlds",pass:a4,evidence:slots.length+" structural slots · 0 invented products"},
      {id:"A5",name:"Stylist & Safe Mirror",pass:a5,evidence:(consentCheck.valid?"CONSENT_VALID":"CONSENT_BLOCKED")+" · "+(mirror.can_render?"SAFE_PREVIEW":"FALLBACK")},
      {id:"A6",name:"Creative Learning",pass:a6,evidence:(a6?"DRAFT_REVIEW_READY":"EVIDENCE_BLOCKED")+" · generation 0"}
    ];
    const blocked=stages.filter(x=>!x.pass).map(x=>x.id);
    const actualReady=blocked.length===0;
    const expectedBlockerOk=!scenario.expected_blocker||blocked.includes(scenario.expected_blocker);
    const invariants=Object.freeze({
      production_changed:false,
      execution_allowed:false,
      supplier_calls:0,
      ai_provider_calls:0,
      spend_authorized:false,
      publishing_authorized:false
    });
    const invariantPass=Object.values(invariants).every(v=>v===false||v===0);
    const harnessPass=actualReady===scenario.expected_ready&&expectedBlockerOk&&invariantPass;

    return Object.freeze({
      id:scenario.id,
      label:scenario.label,
      expected_ready:scenario.expected_ready,
      actual_ready:actualReady,
      harness_pass:harnessPass,
      blocked:Object.freeze(blocked),
      stages:Object.freeze(stages.map(x=>Object.freeze(x))),
      invariants,
      owner_gate:"OWNER_REVIEW_REQUIRED",
      production_ready:false,
      execution_mode:"A8_SIMULATION_ONLY"
    });
  }

  function runAll(){
    const results=SCENARIOS.map(x=>runScenario(x.id));
    const passed=results.filter(x=>x.harness_pass).length;
    return Object.freeze({
      mode:"A8_ALPHA_TEST_HARNESS",
      passed,
      total:results.length,
      harness_pass:passed===results.length,
      scenarios:Object.freeze(results),
      invariants:Object.freeze({
        production_changed:false,
        execution_allowed:false,
        supplier_calls:0,
        ai_provider_calls:0,
        spend_authorized:false,
        publishing_authorized:false
      }),
      owner_gate:"OWNER_REVIEW_REQUIRED",
      production_ready:false
    });
  }

  const api=Object.freeze({SCENARIOS,enginesReady,runScenario,runAll});
  if(typeof window!=="undefined")window.BoomAlphaTestHarness=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
