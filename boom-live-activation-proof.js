(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const RECEIPT=Object.freeze({
    verified_at:"2026-09-19T13:40:31Z",
    migration_version:"20260919133622",
    migration_name:"add_durable_event_identity",
    edge_function:"hunt-commerce-signal",
    edge_function_version:11,
    schema_event_id_column:true,
    unique_event_id_constraint:true,
    public_top_level_event_id_blocked:true,
    public_metadata_event_id_blocked:true,
    legacy_noncanonical_compatible:true,
    runtime_control_enabled:true,
    runtime_control_owner_approved:true,
    duplicate_proof_rows:1,
    canonical_rows_observed:2,
    duplicate_canonical_rows_observed:0,
    durable_database_dedup_verified:true,
    live_event_id_persistence_verified:true,
    analytics_security_advisor_table_finding:false,
    payment_live_enabled:false,
    payplus_callback_accept_paid:false,
    live_payment_unchanged:true
  });

  function evaluate(receipt=RECEIPT){
    const blockers=[];
    if(!receipt.schema_event_id_column)blockers.push("event_id_column_missing");
    if(!receipt.unique_event_id_constraint)blockers.push("unique_event_id_constraint_missing");
    if(!receipt.public_top_level_event_id_blocked)blockers.push("public_top_level_event_id_not_blocked");
    if(!receipt.public_metadata_event_id_blocked)blockers.push("public_metadata_event_id_not_blocked");
    if(!receipt.legacy_noncanonical_compatible)blockers.push("legacy_noncanonical_compatibility_failed");
    if(!receipt.runtime_control_enabled||!receipt.runtime_control_owner_approved)blockers.push("durable_runtime_control_not_enabled");
    if(receipt.duplicate_proof_rows!==1)blockers.push("duplicate_proof_row_count_invalid");
    if(Number(receipt.duplicate_canonical_rows_observed)!==0)blockers.push("duplicate_canonical_rows_detected");
    if(!receipt.durable_database_dedup_verified)blockers.push("durable_database_dedup_unverified");
    if(!receipt.live_event_id_persistence_verified)blockers.push("live_event_id_persistence_unverified");
    if(receipt.payment_live_enabled!==false)blockers.push("payment_live_must_remain_off");
    if(receipt.payplus_callback_accept_paid!==false)blockers.push("payplus_callback_paid_acceptance_must_remain_off");

    return Object.freeze({
      version:VERSION,
      receipt,
      state:blockers.length?"HOLD":"VERIFIED",
      blockers:Object.freeze(blockers),
      activation_verified:blockers.length===0,
      durable_ready:blockers.length===0,
      live_event_id_persistence:blockers.length===0,
      payments_live:false,
      payplus_callback_accept_paid:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RECEIPT,evaluate});
  if(typeof window!=="undefined")window.BoomLiveActivationProof=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();