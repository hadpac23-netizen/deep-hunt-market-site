(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const RECEIPT=Object.freeze({
    verified_at:"2026-09-19T13:56:00Z",
    edge_function:"hunt-payment-session",
    edge_function_version:13,
    commerce_gate_preserved:true,
    payment_live_gate_preserved:true,
    consent_required:true,
    attribution_allowlist_only:true,
    attribution_pii_excluded:true,
    prelaunch_probe_session_id:"019bc28d-94e2-48da-9aae-98de00de9aff",
    prelaunch_probe_payment_ready:false,
    prelaunch_probe_mode:"prelaunch",
    prelaunch_probe_status:"prelaunch",
    prelaunch_probe_paid_at:null,
    prelaunch_probe_order_id:null,
    prelaunch_probe_provider_request_uid:null,
    prelaunch_probe_provider_redirect_url:null,
    attribution_status:"browser_context_unverified",
    attribution_verified:false,
    first_utm_source:"m26_probe",
    last_utm_campaign:"live_attribution_context",
    provider_click_id_present:true,
    payment_event_type:"prelaunch_session_created",
    payment_live_enabled:false,
    payplus_callback_accept_paid:false
  });

  function evaluate(receipt=RECEIPT){
    const blockers=[];
    if(!receipt.commerce_gate_preserved)blockers.push("commerce_gate_not_preserved");
    if(!receipt.payment_live_gate_preserved)blockers.push("payment_live_gate_not_preserved");
    if(!receipt.consent_required)blockers.push("consent_gate_missing");
    if(!receipt.attribution_allowlist_only)blockers.push("attribution_allowlist_missing");
    if(!receipt.attribution_pii_excluded)blockers.push("attribution_pii_boundary_failed");
    if(receipt.prelaunch_probe_payment_ready!==false)blockers.push("probe_payment_ready_must_be_false");
    if(receipt.prelaunch_probe_mode!=="prelaunch")blockers.push("probe_mode_not_prelaunch");
    if(receipt.prelaunch_probe_status!=="prelaunch")blockers.push("probe_status_not_prelaunch");
    if(receipt.prelaunch_probe_paid_at!==null)blockers.push("probe_paid_at_must_be_null");
    if(receipt.prelaunch_probe_order_id!==null)blockers.push("probe_order_id_must_be_null");
    if(receipt.prelaunch_probe_provider_request_uid!==null)blockers.push("provider_request_uid_must_be_null");
    if(receipt.prelaunch_probe_provider_redirect_url!==null)blockers.push("provider_redirect_url_must_be_null");
    if(receipt.attribution_status!=="browser_context_unverified")blockers.push("attribution_status_invalid");
    if(receipt.attribution_verified!==false)blockers.push("browser_attribution_must_remain_unverified");
    if(receipt.payment_event_type!=="prelaunch_session_created")blockers.push("unexpected_payment_event_type");
    if(receipt.payment_live_enabled!==false)blockers.push("payment_live_must_remain_off");
    if(receipt.payplus_callback_accept_paid!==false)blockers.push("paid_callback_acceptance_must_remain_off");

    return Object.freeze({
      version:VERSION,
      receipt,
      state:blockers.length?"HOLD":"BACKEND_VERIFIED",
      blockers:Object.freeze(blockers),
      backend_live_verified:blockers.length===0,
      frontend_live_verified:false,
      live_context_end_to_end:false,
      conversion_claim_allowed:false,
      payments_live:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RECEIPT,evaluate});
  if(typeof window!=="undefined")window.BoomLiveAttributionContext=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();