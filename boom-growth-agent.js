(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  function lane(state,reason,next,extra={}){
    return Object.freeze({state,reason,next,...extra});
  }

  function decide({plan={},data={},measurement={},marketing={}}={}){
    const launch=plan.launch||{};
    const passports=data.passportSummary||{total:0,channels:{}};
    const feed=data.googleFeedPreview||{};
    const control=data.controlSummary||{};
    const creative=data.creativeBatch||{};
    const offers=data.offerSummary||{};
    const lifecycle=data.lifecyclePlan||{};
    const creator=data.creatorSystem||{};
    const agentic=marketing.agentic||{};
    const reasons=[];

    const verifiedEconomics=n(plan.verifiedEconomicsCount);
    const sessions=n(plan.funnel?.sessions);
    const safeDrafts=n(creative.safe_drafts);
    const externalCandidates=n(control.external?.promote_candidate);
    const paidCandidates=n(control.paid?.test_candidate);
    const scaleCandidates=n(control.scale?.scale_candidate);
    const feedExportReady=n(feed.export_ready);
    const feedPublishReady=n(feed.publish_ready);
    const paidMeasurementReady=measurement.paid_attribution_ready===true;
    const serverEventReady=measurement.server_event_id_persisted===true;
    const ownerPaidApproved=measurement.owner_paid_approval===true;

    const lanes={};

    if(launch.canSoftLaunch!==true){
      lanes.owned=lane("HOLD","Soft-launch gate is not open.","Resolve launch readiness before increasing exposure.");
    }else if(verifiedEconomics<3){
      lanes.owned=lane("PREPARE","Too few verified profitable economics checks.","Verify stronger SKU × destination economics before broader traffic.");
    }else{
      lanes.owned=lane("TEST_CANDIDATE","Owned surfaces can collect evidence without paid acquisition.","Run a controlled onsite/organic experiment with a defined KPI and guardrails.");
    }

    if(feedExportReady<=0){
      lanes.external_discovery=lane("HOLD","No ProductInput/feed draft currently satisfies the full truth contract.","Close feed blockers before external catalog distribution.");
    }else if(feedPublishReady<=0){
      lanes.external_discovery=lane("PREPARE","Some feed drafts are export-ready but no connected publish-ready offers exist.","Complete official account/channel connection and owner review.");
    }else{
      lanes.external_discovery=lane("TEST_CANDIDATE","Truthful connected discovery inventory exists.","Run a small owner-reviewed organic discovery test.");
    }

    if(paidCandidates<=0){
      lanes.paid=lane("HOLD","No SKU passes the current paid-test control tower.","Do not buy traffic; improve economics, feed truth and measurement.");
    }else if(!paidMeasurementReady||!serverEventReady){
      lanes.paid=lane("HOLD","Paid attribution/dedup is not complete.","Finish persistent event identity and attribution before spend.");
    }else if(!ownerPaidApproved||launch.canRunPaidMarketing!==true){
      lanes.paid=lane("OWNER_HOLD","Paid execution remains owner/launch gated.","Prepare experiment only; do not spend.");
    }else{
      lanes.paid=lane("TEST_CANDIDATE","At least one SKU passes economics and measurement gates.","Run only a capped controlled paid experiment with a holdout/control.");
    }

    if(lifecycle.send_candidates>0){
      lanes.lifecycle=lane("OWNER_HOLD","Lifecycle candidates exist but external messaging is owner-gated.","Review consent, provider and message before any send.");
    }else{
      lanes.lifecycle=lane("HOLD","No lifecycle external send candidate passes all consent/evidence gates.","Build consent/send-history/frequency infrastructure and wait for real triggers.");
    }

    if(creator.state==="PREPARE"){
      lanes.creator=lane("PREPARE","Creator commerce system gates are structurally ready.","Register a creator asset with rights/economics/attribution evidence for review.");
    }else{
      lanes.creator=lane("HOLD","Creator registry/rights/economics/attribution are not all ready.","Do not publish, boost or pay creators until M07 blockers close.");
    }

    const gateway=data.agenticGateway||{};
    const gatewayState=String(gateway.state||"HOLD");
    if(gatewayState==="OWNER_REVIEW"||gatewayState==="CHECKOUT_PREPARE"||gatewayState==="CART_PREPARE"){
      lanes.agentic=lane("TEST_CANDIDATE","M09 gateway has a validated agentic capability path.","Test discovery/cart handoff only within the capabilities M09 marks ready; keep checkout/payment separately gated.");
    }else if(gatewayState==="DISCOVERY_PREPARE"){
      lanes.agentic=lane("PREPARE","M09 validates discovery data but the public gateway/profile path is not live.","Complete official profile/connection review without enabling checkout.");
    }else if(n(agentic.discovery_data_ready)>0){
      lanes.agentic=lane("HOLD","Product data may be agent-readable, but M09 gateway capability gates are not ready.","Close M09 profile, policy, auth and capability blockers before any agentic test.");
    }else{
      lanes.agentic=lane("HOLD","Agent-readable product truth and M09 gateway readiness are incomplete.","Enrich Product Truth and close M09 capability blockers first.");
    }

    if(safeDrafts<=0)reasons.push("safe_creative_drafts_missing");
    if(n(offers.coupon_candidate)+n(offers.shipping_candidate)+n(offers.bundle_candidate)<=0)reasons.push("meaningful_offer_candidate_missing");
    if(sessions<20)reasons.push("traffic_sample_small");
    if(scaleCandidates<=0)reasons.push("scale_evidence_missing");
    if(externalCandidates<=0)reasons.push("external_promotion_candidates_missing");

    let primaryMove;
    if(lanes.owned.state==="HOLD"){
      primaryMove={code:"FIX_LAUNCH_GATE",state:"HOLD",why:lanes.owned.reason,next:lanes.owned.next};
    }else if(verifiedEconomics<3){
      primaryMove={code:"VERIFY_ECONOMICS",state:"PREPARE",why:"Economics coverage is still the limiting evidence layer.",next:"Verify profitable SKU × destination combinations before acquisition tests."};
    }else if(feedExportReady<=0){
      primaryMove={code:"ENRICH_PRODUCT_TRUTH",state:"PREPARE",why:"External discovery is blocked by product/feed truth.",next:"Close description, availability, merchant/policy, freshness and market-label blockers."};
    }else if(lanes.owned.state==="TEST_CANDIDATE"&&sessions<20){
      primaryMove={code:"RUN_OWNED_TEST",state:"TEST_CANDIDATE",why:"Owned traffic is the safest next learning source.",next:"Run one controlled onsite/organic test and collect enough evidence before paid acquisition."};
    }else if(lanes.external_discovery.state==="TEST_CANDIDATE"){
      primaryMove={code:"TEST_EXTERNAL_DISCOVERY",state:"TEST_CANDIDATE",why:"External discovery has truthful publish-ready inventory.",next:"Run an owner-reviewed organic discovery test with canonical measurement."};
    }else if(lanes.paid.state==="TEST_CANDIDATE"){
      primaryMove={code:"TEST_PAID",state:"TEST_CANDIDATE",why:"Paid economics and measurement gates are satisfied.",next:"Run a capped paid experiment; do not scale until incrementality and post-acquisition profit are observed."};
    }else{
      primaryMove={code:"COLLECT_EVIDENCE",state:"PREPARE",why:"No higher-risk action is justified by current evidence.",next:"Collect conversion, economics and post-purchase evidence on owned surfaces."};
    }

    const canScale=scaleCandidates>0
      && lanes.paid.state==="TEST_CANDIDATE"
      && measurement.incrementality_ready===true
      && measurement.post_acquisition_profit_ready===true;

    return Object.freeze({
      version:VERSION,
      primary_move:Object.freeze(primaryMove),
      lanes:Object.freeze(lanes),
      diagnostics:Object.freeze({
        verified_economics:verifiedEconomics,
        sessions,
        feed_export_ready:feedExportReady,
        feed_publish_ready:feedPublishReady,
        safe_creative_drafts:safeDrafts,
        external_candidates:externalCandidates,
        paid_test_candidates:paidCandidates,
        scale_candidates:scaleCandidates,
        can_scale:canScale,
        reasons:Object.freeze(uniq(reasons))
      }),
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

  const api=Object.freeze({VERSION,decide});
  if(typeof window!=="undefined")window.BoomGrowthAgent=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
