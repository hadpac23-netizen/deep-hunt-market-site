(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const RECEIPT=Object.freeze({
    verified_at:"2026-09-19T14:23:00Z",
    migration_version:"20260919142109",
    hardening_migration_version:"20260919142135",
    proof_payment_session_id:"04173c44-da56-4363-aa7e-f6a9d77887a8",
    table_exists:true,
    rls_enabled:true,
    anon_blocked:true,
    authenticated_blocked:true,
    service_role_granted:true,
    raw_click_ids_excluded:true,
    payment_session_unique_link:true,
    provider_validation_gate:true,
    security_advisor_ledger_finding:false,
    total_rows:23,
    with_click_digest:3,
    pending_provider_validation:3,
    provider_verified:0,
    server_confirmed_purchases:0,
    conversion_claim_allowed:0,
    proof_click_provider:"GOOGLE_ADS",
    proof_click_id_type:"gclid",
    proof_digest_length:64,
    proof_digest_equals_raw:false,
    proof_context_status:"BROWSER_CONTEXT_UNVERIFIED",
    proof_purchase_status:"NOT_CONFIRMED",
    proof_payment_mode:"prelaunch",
    proof_paid_at:null,
    proof_order_id:null,
    proof_provider_request_uid:null,
    proof_provider_redirect_url:null,
    payment_live_enabled:false,
    payplus_callback_accept_paid:false
  });

  function evaluate(input=RECEIPT){
    const total=Math.max(0,Number(input.total_rows)||0);
    const withClick=Math.max(0,Number(input.with_click_digest)||0);
    const pending=Math.max(0,Number(input.pending_provider_validation)||0);
    const verified=Math.max(0,Number(input.provider_verified)||0);
    const linkedPurchases=Math.max(0,Number(input.server_confirmed_purchases)||0);
    const claimable=Math.max(0,Number(input.conversion_claim_allowed)||0);

    const checks=Object.freeze({
      table_exists:input.table_exists===true,
      rls_enabled:input.rls_enabled===true,
      anon_blocked:input.anon_blocked===true,
      authenticated_blocked:input.authenticated_blocked===true,
      service_role_granted:input.service_role_granted===true,
      raw_click_ids_excluded:input.raw_click_ids_excluded===true,
      payment_session_unique_link:input.payment_session_unique_link===true,
      provider_validation_gate:input.provider_validation_gate===true,
      payment_controls_off:input.payment_live_enabled===false&&input.payplus_callback_accept_paid===false
    });

    const blockers=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k+"_missing");
    const ready=blockers.length===0;

    return Object.freeze({
      version:VERSION,
      receipt:input,
      state:ready?"LEDGER_READY":"HOLD",
      checks,
      blockers:Object.freeze(blockers),
      total_rows:total,
      with_click_digest:withClick,
      pending_provider_validation:pending,
      provider_verified:verified,
      server_confirmed_purchases:linkedPurchases,
      conversion_claim_allowed:claimable,
      ledger_ready:ready,
      provider_click_validation:verified>0,
      paid_attribution_ready:false,
      payments_live:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RECEIPT,evaluate});
  if(typeof window!=="undefined")window.BoomCampaignAttributionLedger=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();