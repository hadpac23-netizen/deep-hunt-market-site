(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const RECEIPT=Object.freeze({
    verified_at:"2026-09-19T15:05:00Z",
    harness_function:"hunt-payplus-sandbox-evidence",
    harness_version:2,
    harness_active:true,
    staging_only:true,
    one_time_token_required:true,
    runtime_control_enabled:false,
    runtime_control_owner_approved:false,
    token_invalidated:true,
    config_preflight_attempted:true,
    payplus_api_key_configured:false,
    payplus_secret_key_configured:false,
    payplus_payment_page_uid_configured:false,
    payment_link_created:false,
    sandbox_sessions_created:0,
    sandbox_success_proven:false,
    sandbox_reject_proven:false,
    status_observations:0,
    accepted_paid_observations:0,
    hunt_payment_live:false,
    hunt_payplus_callback_accept_paid:false
  });

  function evaluate(input=RECEIPT){
    const configReady=input.payplus_api_key_configured===true
      && input.payplus_secret_key_configured===true
      && input.payplus_payment_page_uid_configured===true;
    const harnessSafe=input.harness_active===true
      && input.staging_only===true
      && input.one_time_token_required===true
      && input.runtime_control_enabled===false
      && input.runtime_control_owner_approved===false
      && input.token_invalidated===true
      && input.hunt_payment_live===false
      && input.hunt_payplus_callback_accept_paid===false;
    const sandboxProven=input.sandbox_success_proven===true&&input.sandbox_reject_proven===true;

    return Object.freeze({
      version:VERSION,
      receipt:input,
      state:configReady&&sandboxProven?"SANDBOX_PROVEN":harnessSafe?"HARNESS_READY_CONFIG_BLOCKED":"HOLD",
      harness_safe:harnessSafe,
      config_ready:configReady,
      sandbox_success_proven:input.sandbox_success_proven===true,
      sandbox_reject_proven:input.sandbox_reject_proven===true,
      provider_status_mapping_ready:configReady&&sandboxProven,
      payment_link_created:input.payment_link_created===true,
      accepted_paid:false,
      payments_live:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RECEIPT,evaluate});
  if(typeof window!=="undefined")window.BoomPayPlusSandboxEvidence=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();