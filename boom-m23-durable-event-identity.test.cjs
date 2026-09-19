const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const studio=fs.readFileSync("boom-growth-os.js","utf8");
const identity=fs.readFileSync("boom-durable-event-identity.js","utf8");
const edge=fs.readFileSync("supabase/functions/hunt-commerce-signal/index.ts","utf8");
const sql=fs.readFileSync("docs/BOOM-M23-DURABLE-EVENT-IDENTITY-SQL-PROPOSAL.sql","utf8");

for(const token of [
  "M23 · DURABLE EVENT IDENTITY",
  'id="bg-durable-identity-state"',
  'id="bg-durable-identity-stats"',
  'id="bg-durable-identity-checks"',
  'id="bg-durable-identity-blockers"',
  'boom-durable-event-identity.js?v=m23'
]) assert(html.includes(token),"M23 Studio surface missing: "+token);

for(const token of [
  "const DurableIdentity=window.BoomDurableEventIdentity",
  "schema_event_id_column:false",
  "unique_event_id_constraint:false",
  "public_canonical_insert_blocked:false",
  "historical_rows:4630",
  "historical_rows_with_event_id:0",
  "durable_server_dedup:durableEventIdentity.durable_ready===true",
  'domain:"durable_event_identity"',
  "renderDurableEventIdentity(data)"
]) assert(studio.includes(token),"M23 Studio integration missing: "+token);

for(const token of [
  "SCHEMA_REQUIRED",
  "historical_backfill_allowed:false",
  "database_changed:false",
  "function_deployed:false",
  "durable_ready:durableReady",
  "execute_actions:false"
]) assert(identity.includes(token),"M23 readiness contract missing: "+token);

for(const token of [
  'HUNT_DURABLE_EVENT_IDENTITY_ENABLED',
  '?on_conflict=event_id',
  'resolution=ignore-duplicates,return=representation',
  'event_id:eventId',
  'durable_cross_worker_dedup:true',
  'paid_attribution:false'
]) assert(edge.includes(token),"M23 Edge preview missing: "+token);

for(const token of [
  "SQL PROPOSAL ONLY",
  "NOT A MIGRATION FILE. NOT APPLIED.",
  "add column event_id text null",
  "analytics_events_event_id_key unique (event_id)",
  'to anon, authenticated',
  "event_id is null",
  "not (coalesce(metadata, '{}'::jsonb) ? 'event_id')",
  "Historical rows MUST remain event_id = NULL"
]) assert(sql.includes(token),"M23 SQL proposal guard missing: "+token);

assert(!sql.includes("update public.analytics_events set event_id"),"M23 must not fabricate historical event IDs");
console.log("boom_m23_durable_event_identity_contract=PASS");