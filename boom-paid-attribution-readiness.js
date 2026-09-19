(() => {
  "use strict";

  const VERSION="2026-09-19-v1";

  function evaluate(input={}){
    const checks=Object.freeze({
      browser_event_id_generation:input.browser_event_id_generation===true,
      ga4_configured:input.ga4_configured===true,
      first_party_signal_live:input.first_party_signal_live===true,
      live_event_id_persistence:input.live_event_id_persistence===true,
      durable_server_dedup:input.durable_server_dedup===true,
      server_purchase_confirmation:input.server_purchase_confirmation===true,
      campaign_touchpoint_persistence:input.campaign_touchpoint_persistence===true,
      purchase_touchpoint_linkage:input.purchase_touchpoint_linkage===true,
      provider_click_validation:input.provider_click_validation===true,
      paid_destination_connection:input.paid_destination_connection===true,
      owner_paid_approval:input.owner_paid_approval===true
    });

    const blockers=[];
    if(!checks.browser_event_id_generation)blockers.push("browser_event_id_generation_missing");
    if(!checks.first_party_signal_live)blockers.push("first_party_signal_missing");
    if(!checks.live_event_id_persistence)blockers.push("live_event_id_persistence_missing");
    if(!checks.durable_server_dedup)blockers.push("durable_server_dedup_missing");
    if(!checks.server_purchase_confirmation)blockers.push("server_purchase_confirmation_missing");
    if(!checks.campaign_touchpoint_persistence)blockers.push("campaign_touchpoint_persistence_missing");
    if(!checks.purchase_touchpoint_linkage)blockers.push("purchase_touchpoint_linkage_missing");
    if(!checks.provider_click_validation)blockers.push("provider_click_validation_missing");
    if(!checks.paid_destination_connection)blockers.push("paid_destination_not_connected");
    if(!checks.owner_paid_approval)blockers.push("owner_paid_approval_required");

    const measurementCore=checks.browser_event_id_generation
      && checks.first_party_signal_live
      && checks.live_event_id_persistence;
    const attributionCore=measurementCore
      && checks.durable_server_dedup
      && checks.server_purchase_confirmation
      && checks.campaign_touchpoint_persistence
      && checks.purchase_touchpoint_linkage
      && checks.provider_click_validation;

    return Object.freeze({
      version:VERSION,
      state:attributionCore?"OWNER_REVIEW":measurementCore?"PARTIAL":"HOLD",
      checks,
      blockers:Object.freeze(blockers),
      measurement_core_ready:measurementCore,
      paid_attribution_ready:attributionCore,
      local_preview_event_id_patch:input.local_preview_event_id_patch===true,
      live_function_version:Number(input.live_function_version||0),
      server_event_id_persisted:checks.live_event_id_persistence,
      paid_destination_send:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,evaluate});
  if(typeof window!=="undefined")window.BoomPaidAttributionReadiness=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();