(() => {
  "use strict";

  const VERSION="2026-09-19-v1";

  function evaluate(input={}){
    const checks=Object.freeze({
      consent_gated_capture:input.consent_gated_capture===true,
      browser_first_touch:input.browser_first_touch===true,
      browser_last_touch:input.browser_last_touch===true,
      checkout_payload_context:input.checkout_payload_context===true,
      server_session_snapshot:input.server_session_snapshot===true,
      live_server_session_snapshot:input.live_server_session_snapshot===true,
      server_purchase_linkage:input.server_purchase_linkage===true,
      provider_click_validation:input.provider_click_validation===true
    });
    const blockers=[];
    for(const [key,ready] of Object.entries(checks))if(!ready)blockers.push(key+"_missing");

    const localPreview=checks.consent_gated_capture
      && checks.browser_first_touch
      && checks.browser_last_touch
      && checks.checkout_payload_context
      && checks.server_session_snapshot;

    const liveAttributionContext=localPreview
      && checks.live_server_session_snapshot
      && checks.server_purchase_linkage
      && checks.provider_click_validation;

    return Object.freeze({
      version:VERSION,
      state:liveAttributionContext?"OWNER_REVIEW":localPreview?"LOCAL_PREVIEW":"HOLD",
      checks,
      blockers:Object.freeze(blockers),
      local_preview_ready:localPreview,
      live_attribution_context_ready:liveAttributionContext,
      conversion_claim_allowed:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,evaluate});
  if(typeof window!=="undefined")window.BoomAttributionContextReadiness=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();