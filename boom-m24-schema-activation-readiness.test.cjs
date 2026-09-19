const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const readiness=fs.readFileSync("boom-schema-activation-readiness.js","utf8");
const proposal=fs.readFileSync("docs/BOOM-M23-DURABLE-EVENT-IDENTITY-SQL-PROPOSAL.sql","utf8");
const rollback=fs.readFileSync("docs/BOOM-M24-SCHEMA-ACTIVATION-ROLLBACK.sql","utf8");

for(const token of [
  "M24 · SCHEMA ACTIVATION READINESS",
  'id="bg-schema-activation-state"',
  'id="bg-schema-activation-stats"',
  'id="bg-schema-activation-checks"',
  'id="bg-schema-activation-rollback"',
  'boom-schema-activation-readiness.js?v=m24'
]) assert(html.includes(token),"M24 Studio surface missing: "+token);

for(const token of [
  "const SchemaActivation=window.BoomSchemaActivationReadiness",
  "live_schema_inspected:true",
  "rls_enabled:true",
  "current_public_insert_policy_identified:true",
  "public_insert_privileges_identified:true",
  "event_id_absent_confirmed:true",
  "unique_event_id_absent_confirmed:true",
  "table_specific_security_advisor_clear:true",
  "renderSchemaActivation(data)"
]) assert(studio.includes(token),"M24 Studio preflight missing: "+token);

for(const token of [
  'state:activationReady?"OWNER_REVIEW":"HOLD"',
  "live_schema_changed:false",
  "migration_applied:false",
  "function_deployed:false",
  "feature_flag_enabled:false",
  "historical_backfill_allowed:false",
  'preferred_rollback:"OPERATIONAL"',
  "execute_actions:false"
]) assert(readiness.includes(token),"M24 readiness invariant missing: "+token);

for(const token of [
  "set local lock_timeout = '5s'",
  "set local statement_timeout = '30s'",
  "add column event_id text null",
  "analytics_events_event_id_key unique (event_id)",
  'to anon, authenticated'
]) assert(proposal.includes(token),"M24 activation proposal guard missing: "+token);

for(const token of [
  "REVIEW-ONLY. NOT APPLIED.",
  "Preferred rollback is OPERATIONAL",
  "HUNT_DURABLE_EVENT_IDENTITY_ENABLED=false",
  "LAST RESORT",
  "drop constraint if exists analytics_events_event_id_key",
  "drop column if exists event_id"
]) assert(rollback.includes(token),"M24 rollback contract missing: "+token);

assert(!rollback.includes("update public.analytics_events set event_id"),"M24 rollback must not fabricate or rewrite event identity");
console.log("boom_m24_schema_activation_readiness_contract=PASS");