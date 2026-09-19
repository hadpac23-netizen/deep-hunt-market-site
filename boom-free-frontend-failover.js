(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const RECEIPT=Object.freeze({
    verified_at:"2026-09-19T14:07:00Z",
    primary_host:"netlify",
    primary_host_status:"usage_exceeded",
    primary_http_status:503,
    paid_host_upgrade_performed:false,
    fallback_host:"github_pages",
    fallback_url:"https://hadpac23-netizen.github.io/deep-hunt-market-site/",
    fallback_source_branch:"m26-pages-fallback",
    fallback_source_path:"/",
    fallback_commit:"2709295a634faf8562b6e0be8824744a6ec3688e",
    fallback_build_status:"built",
    fallback_build_updated_at:"2026-09-19T14:05:14Z",
    fallback_files_http_200:true,
    fallback_attribution_code_served:true,
    fallback_checkout_shipping_ui_served:true,
    browser_consent_verified:true,
    browser_first_touch_source:"m26_browser",
    browser_last_touch_campaign:"pages_e2e",
    browser_click_id:"m26-browser-click-20260919",
    browser_checkout_verified:true,
    browser_checkout_status_copy:"Price, stock and shipping verified. Payment is still disabled during pre-launch.",
    browser_payment_button_disabled:true,
    db_payment_session_id:"b86c34cd-cf81-472c-8416-f6e456f49bf2",
    db_payment_mode:"prelaunch",
    db_payment_status:"prelaunch",
    db_paid_at:null,
    db_order_id:null,
    db_provider_request_uid:null,
    db_provider_redirect_url:null,
    db_attribution_status:"browser_context_unverified",
    db_attribution_verified:false,
    db_payment_event_type:"prelaunch_session_created",
    payment_live_enabled:false,
    payplus_callback_accept_paid:false,
    rollback_pages_source_branch:"main",
    rollback_pages_source_path:"/"
  });

  function evaluate(receipt=RECEIPT){
    const blockers=[];
    if(receipt.primary_host_status!=="usage_exceeded")blockers.push("primary_outage_reason_unverified");
    if(receipt.paid_host_upgrade_performed!==false)blockers.push("paid_host_upgrade_must_remain_false");
    if(receipt.fallback_build_status!=="built")blockers.push("fallback_build_not_built");
    if(!receipt.fallback_files_http_200)blockers.push("fallback_files_unavailable");
    if(!receipt.fallback_attribution_code_served)blockers.push("fallback_attribution_code_missing");
    if(!receipt.fallback_checkout_shipping_ui_served)blockers.push("fallback_checkout_ui_missing");
    if(!receipt.browser_consent_verified)blockers.push("browser_consent_unverified");
    if(!receipt.browser_checkout_verified)blockers.push("browser_checkout_unverified");
    if(!receipt.browser_payment_button_disabled)blockers.push("browser_payment_button_not_disabled");
    if(receipt.db_payment_mode!=="prelaunch"||receipt.db_payment_status!=="prelaunch")blockers.push("db_session_not_prelaunch");
    if(receipt.db_paid_at!==null||receipt.db_order_id!==null)blockers.push("db_purchase_state_must_be_empty");
    if(receipt.db_provider_request_uid!==null||receipt.db_provider_redirect_url!==null)blockers.push("provider_payment_session_must_be_absent");
    if(receipt.db_attribution_status!=="browser_context_unverified"||receipt.db_attribution_verified!==false)blockers.push("attribution_truth_boundary_failed");
    if(receipt.db_payment_event_type!=="prelaunch_session_created")blockers.push("unexpected_payment_event");
    if(receipt.payment_live_enabled!==false||receipt.payplus_callback_accept_paid!==false)blockers.push("payment_controls_must_remain_off");

    return Object.freeze({
      version:VERSION,
      receipt,
      state:blockers.length?"HOLD":"FALLBACK_E2E_VERIFIED",
      blockers:Object.freeze(blockers),
      fallback_frontend_live:blockers.length===0,
      attribution_e2e_verified:blockers.length===0,
      primary_netlify_available:false,
      free_hosting_path_active:blockers.length===0,
      paid_host_upgrade:false,
      conversion_claim_allowed:false,
      payments_live:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RECEIPT,evaluate});
  if(typeof window!=="undefined")window.BoomFreeFrontendFailover=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();