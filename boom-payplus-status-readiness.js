(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const RECEIPT=Object.freeze({
    verified_at:"2026-09-19T14:46:10Z",
    callback_function:"hunt-payplus-callback",
    callback_version:9,
    callback_active:true,
    hmac_user_agent_gate:true,
    independent_ipn_full_verification:true,
    observation_migration_version:"20260919144610",
    observation_table:"hunt_payplus_status_observations",
    observation_rls_enabled:true,
    observation_public_blocked:true,
    observation_security_advisor_finding:false,
    fake_callback_http_status:401,
    fake_callback_reason:"PAYPLUS_USER_AGENT_INVALID",
    official_charge_method_contract:true,
    j2_not_paid:true,
    j5_not_paid:true,
    j4_charge_requires_sandbox_proof:true,
    refund_requires_sandbox_proof:true,
    unknown_status_holds:true,
    sandbox_success_proven:false,
    sandbox_reject_proven:false,
    provider_status_mapping_ready:false,
    payment_live_enabled:false,
    payplus_callback_accept_paid:false,
    accepted_paid_observations:0
  });

  function evaluate(input=RECEIPT){
    const checks=Object.freeze({
      callback_active:input.callback_active===true,
      hmac_user_agent_gate:input.hmac_user_agent_gate===true,
      independent_ipn_full_verification:input.independent_ipn_full_verification===true,
      observation_rls_enabled:input.observation_rls_enabled===true,
      observation_public_blocked:input.observation_public_blocked===true,
      observation_security_clean:input.observation_security_advisor_finding===false,
      fake_callback_blocked:Number(input.fake_callback_http_status)===401,
      official_charge_method_contract:input.official_charge_method_contract===true,
      j2_not_paid:input.j2_not_paid===true,
      j5_not_paid:input.j5_not_paid===true,
      unknown_status_holds:input.unknown_status_holds===true,
      payments_off:input.payment_live_enabled===false&&input.payplus_callback_accept_paid===false
    });
    const blockers=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k+"_missing");
    const hardened=blockers.length===0;
    const sandboxProven=input.sandbox_success_proven===true&&input.sandbox_reject_proven===true;
    const mappingReady=hardened&&sandboxProven&&input.provider_status_mapping_ready===true;

    return Object.freeze({
      version:VERSION,
      receipt:input,
      state:mappingReady?"MAPPING_READY":hardened?"CALLBACK_HARDENED":"HOLD",
      checks,
      blockers:Object.freeze(blockers),
      callback_hardened:hardened,
      sandbox_success_proven:input.sandbox_success_proven===true,
      sandbox_reject_proven:input.sandbox_reject_proven===true,
      provider_status_mapping_ready:mappingReady,
      accepted_paid:false,
      payments_live:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RECEIPT,evaluate});
  if(typeof window!=="undefined")window.BoomPayPlusStatusReadiness=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();