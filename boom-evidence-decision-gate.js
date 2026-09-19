(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const REQUIREMENTS=Object.freeze({
    owned:Object.freeze(["product_source_freshness","verified_unit_economics","experiment_registry"]),
    external_discovery:Object.freeze(["product_source_freshness","business_identity","experiment_registry"]),
    paid:Object.freeze(["product_source_freshness","verified_unit_economics","paid_attribution","experiment_registry"]),
    lifecycle:Object.freeze(["lifecycle_observations"]),
    creator:Object.freeze(["creator_observations"]),
    agentic:Object.freeze(["product_source_freshness","business_identity"])
  });
  const MOVE_LANE=Object.freeze({
    RUN_OWNED_TEST:"owned",
    TEST_EXTERNAL_DISCOVERY:"external_discovery",
    TEST_PAID:"paid"
  });

  function missingFor(lane,evidence={}){
    const usable=new Set(evidence.usable_domains||[]);
    return (REQUIREMENTS[lane]||[]).filter(domain=>!usable.has(domain));
  }

  function gateLane(name,lane={},evidence={}){
    const missing=missingFor(name,evidence);
    const testLike=String(lane.state||"")==="TEST_CANDIDATE";
    if(!testLike||missing.length===0)return Object.freeze({...lane,evidence_missing:Object.freeze(missing),evidence_gate:testLike?"PASS":"NOT_REQUIRED"});
    return Object.freeze({
      ...lane,
      state:"EVIDENCE_HOLD",
      reason:"Decision evidence is incomplete: "+missing.join(", ")+".",
      next:"Close the missing evidence domains before testing this lane.",
      evidence_missing:Object.freeze(missing),
      evidence_gate:"HOLD"
    });
  }

  function apply(decision={},evidence={}){
    const lanes={};
    for(const [name,lane] of Object.entries(decision.lanes||{}))lanes[name]=gateLane(name,lane,evidence);

    const primary={...(decision.primary_move||{})};
    const primaryLane=MOVE_LANE[String(primary.code||"")];
    const primaryMissing=primaryLane?missingFor(primaryLane,evidence):[];
    if(primaryLane&&String(primary.state||"")==="TEST_CANDIDATE"&&primaryMissing.length){
      primary.code="COLLECT_EVIDENCE";
      primary.state="EVIDENCE_HOLD";
      primary.why="The proposed test lacks decision-grade proof: "+primaryMissing.join(", ")+".";
      primary.next="Close M17 evidence gaps, then re-evaluate the original "+primaryLane+" test.";
    }

    const diagnostics={
      ...(decision.diagnostics||{}),
      evidence_verified:Number(evidence.verified||0),
      evidence_missing:Number(evidence.missing||0),
      evidence_structural:Number(evidence.structural||0),
      evidence_stale:Number(evidence.stale||0),
      evidence_gated_lanes:Object.values(lanes).filter(x=>x.state==="EVIDENCE_HOLD").length,
      can_scale:Boolean(decision.diagnostics?.can_scale)
        && missingFor("paid",evidence).length===0
    };

    return Object.freeze({
      ...decision,
      primary_move:Object.freeze(primary),
      lanes:Object.freeze(lanes),
      diagnostics:Object.freeze(diagnostics),
      evidence_gate_applied:true,
      recommendations_only:true,
      external_publish:false,
      paid_spend:false,
      lifecycle_send:false,
      creator_publish:false,
      creator_payout:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,REQUIREMENTS,missingFor,gateLane,apply});
  if(typeof window!=="undefined")window.BoomEvidenceDecisionGate=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();