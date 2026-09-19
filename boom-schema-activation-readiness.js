(() => {
  "use strict";

  const VERSION="2026-09-19-v1";

  function evaluate(input={}){
    const checks=Object.freeze({
      live_schema_inspected:input.live_schema_inspected===true,
      rls_enabled:input.rls_enabled===true,
      current_public_insert_policy_identified:input.current_public_insert_policy_identified===true,
      public_insert_privileges_identified:input.public_insert_privileges_identified===true,
      event_id_absent_confirmed:input.event_id_absent_confirmed===true,
      unique_event_id_absent_confirmed:input.unique_event_id_absent_confirmed===true,
      historical_event_id_absence_confirmed:input.historical_event_id_absence_confirmed===true,
      sql_proposal_ready:input.sql_proposal_ready===true,
      public_canonical_guard_in_proposal:input.public_canonical_guard_in_proposal===true,
      backend_secret_bypass_verified:input.backend_secret_bypass_verified===true,
      feature_flag_default_off:input.feature_flag_default_off===true,
      edge_compatibility_patch_ready:input.edge_compatibility_patch_ready===true,
      operational_rollback_ready:input.operational_rollback_ready===true,
      schema_rollback_ready:input.schema_rollback_ready===true,
      table_specific_security_advisor_clear:input.table_specific_security_advisor_clear===true
    });

    const blockers=[];
    for(const [key,ready] of Object.entries(checks))if(!ready)blockers.push(key+"_missing");

    const activationReady=blockers.length===0;
    return Object.freeze({
      version:VERSION,
      state:activationReady?"OWNER_REVIEW":"HOLD",
      checks,
      blockers:Object.freeze(blockers),
      activation_ready:activationReady,
      live_schema_changed:false,
      migration_applied:false,
      function_deployed:false,
      feature_flag_enabled:false,
      historical_backfill_allowed:false,
      preferred_rollback:"OPERATIONAL",
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,evaluate});
  if(typeof window!=="undefined")window.BoomSchemaActivationReadiness=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();