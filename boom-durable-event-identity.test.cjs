const assert=require("node:assert");
const D=require("./boom-durable-event-identity.js");

const current=D.evaluate({
  browser_event_id_generation:true,
  schema_event_id_column:false,
  unique_event_id_constraint:false,
  public_canonical_insert_blocked:false,
  local_sql_blueprint_ready:true,
  local_function_patch_ready:true,
  live_function_atomic_dedup:false,
  live_function_version:8,
  historical_rows:4630,
  historical_rows_with_event_id:0
});
assert.strictEqual(current.state,"SCHEMA_REQUIRED");
assert.strictEqual(current.local_preview_ready,true);
assert.strictEqual(current.schema_ready,false);
assert.strictEqual(current.durable_ready,false);
assert.strictEqual(current.historical_backfill_allowed,false);
assert(current.blockers.includes("event_id_column_missing"));

const ready=D.evaluate({
  browser_event_id_generation:true,
  schema_event_id_column:true,
  unique_event_id_constraint:true,
  public_canonical_insert_blocked:true,
  local_sql_blueprint_ready:true,
  local_function_patch_ready:true,
  live_function_atomic_dedup:true
});
assert.strictEqual(ready.state,"OWNER_REVIEW");
assert.strictEqual(ready.durable_ready,true);
assert.strictEqual(ready.database_changed,false);
assert.strictEqual(ready.execute_actions,false);
console.log("boom_durable_event_identity=PASS");