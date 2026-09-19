const assert=require("node:assert");
const R=require("./boom-schema-activation-readiness.js");

const ready=R.evaluate({
  live_schema_inspected:true,
  rls_enabled:true,
  current_public_insert_policy_identified:true,
  public_insert_privileges_identified:true,
  event_id_absent_confirmed:true,
  unique_event_id_absent_confirmed:true,
  historical_event_id_absence_confirmed:true,
  sql_proposal_ready:true,
  public_canonical_guard_in_proposal:true,
  backend_secret_bypass_verified:true,
  feature_flag_default_off:true,
  edge_compatibility_patch_ready:true,
  operational_rollback_ready:true,
  schema_rollback_ready:true,
  table_specific_security_advisor_clear:true
});
assert.strictEqual(ready.state,"OWNER_REVIEW");
assert.strictEqual(ready.activation_ready,true);
assert.strictEqual(ready.migration_applied,false);
assert.strictEqual(ready.function_deployed,false);
assert.strictEqual(ready.feature_flag_enabled,false);
assert.strictEqual(ready.historical_backfill_allowed,false);
assert.strictEqual(ready.preferred_rollback,"OPERATIONAL");
assert.strictEqual(ready.execute_actions,false);

const bad=R.evaluate({rls_enabled:true});
assert.strictEqual(bad.state,"HOLD");
assert.strictEqual(bad.activation_ready,false);
assert(bad.blockers.includes("sql_proposal_ready_missing"));
console.log("boom_schema_activation_readiness=PASS");