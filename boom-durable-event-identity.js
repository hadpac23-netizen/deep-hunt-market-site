(() => {
  "use strict";

  const VERSION="2026-09-19-v1";

  function evaluate(input={}){
    const checks=Object.freeze({
      browser_event_id_generation:input.browser_event_id_generation===true,
      schema_event_id_column:input.schema_event_id_column===true,
      unique_event_id_constraint:input.unique_event_id_constraint===true,
      public_canonical_insert_blocked:input.public_canonical_insert_blocked===true,
      local_sql_blueprint_ready:input.local_sql_blueprint_ready===true,
      local_function_patch_ready:input.local_function_patch_ready===true,
      live_function_atomic_dedup:input.live_function_atomic_dedup===true
    });

    const blockers=[];
    if(!checks.schema_event_id_column)blockers.push("event_id_column_missing");
    if(!checks.unique_event_id_constraint)blockers.push("unique_event_id_constraint_missing");
    if(!checks.public_canonical_insert_blocked)blockers.push("public_canonical_insert_guard_missing");
    if(!checks.live_function_atomic_dedup)blockers.push("live_atomic_dedup_missing");

    const schemaReady=checks.schema_event_id_column
      && checks.unique_event_id_constraint
      && checks.public_canonical_insert_blocked;
    const previewReady=checks.browser_event_id_generation
      && checks.local_sql_blueprint_ready
      && checks.local_function_patch_ready;
    const durableReady=schemaReady
      && checks.browser_event_id_generation
      && checks.live_function_atomic_dedup;

    return Object.freeze({
      version:VERSION,
      state:durableReady?"OWNER_REVIEW":previewReady?"SCHEMA_REQUIRED":"HOLD",
      checks,
      blockers:Object.freeze(blockers),
      schema_ready:schemaReady,
      local_preview_ready:previewReady,
      durable_ready:durableReady,
      live_function_version:Number(input.live_function_version||0),
      historical_rows:Number(input.historical_rows||0),
      historical_rows_with_event_id:Number(input.historical_rows_with_event_id||0),
      historical_backfill_allowed:false,
      database_changed:false,
      function_deployed:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,evaluate});
  if(typeof window!=="undefined")window.BoomDurableEventIdentity=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();