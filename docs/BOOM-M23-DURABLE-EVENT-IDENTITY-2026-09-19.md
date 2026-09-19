# BOOM M23 — Durable Event Identity — 2026-09-19

## Objective
Make canonical measurement identity durable and atomic at the database layer before M20 can treat browser/server dedup as ready.

## Live database inspection
Observed in the connected boom-social-world Supabase project:
- analytics_events rows: 4,630
- analytics_events.event_id column: absent
- unique event_id constraint/index: absent
- stored metadata event_id values: 0
- live hunt-commerce-signal: version 8

Therefore durable cross-worker event dedup is not currently live.

## Historical truth
Existing rows do not contain their original canonical browser event IDs.
M23 explicitly forbids fabricating/backfilling synthetic event IDs for those historical rows.
After an approved schema change, old rows remain event_id = NULL.

Postgres UNIQUE permits multiple NULL values, so history can remain truthful while new canonical events receive uniqueness.

## SQL proposal
A review-only SQL proposal exists at:
docs/BOOM-M23-DURABLE-EVENT-IDENTITY-SQL-PROPOSAL.sql

It is deliberately not placed in supabase/migrations because Supabase CLI is not installed locally and no production schema change is approved.

The proposal:
- adds nullable analytics_events.event_id
- adds length validation
- adds UNIQUE(event_id)
- replaces broad public canonical-event insertion with an explicit anon/authenticated policy that permits only noncanonical rows
- blocks public insertion of top-level or metadata event_id

This preserves current direct browser experience-event logging while reserving canonical identity for the trusted backend path.

## Edge Function preview
The local hunt-commerce-signal source now has two modes.

Default flag OFF:
- preserves the current preview behavior
- stores event_id only in metadata
- durable_cross_worker_dedup = false

HUNT_DURABLE_EVENT_IDENTITY_ENABLED=true:
- requires event_id
- sends top-level event_id
- uses PostgREST on_conflict=event_id
- requests resolution=ignore-duplicates
- returns durable_cross_worker_dedup = true only on this database-backed path

The feature flag must not be enabled before the schema/policy verification passes.

## M20 integration
M20 durable_server_dedup now consumes M23 durable_ready.
Therefore Paid Attribution stays blocked until the database, policy and live Edge Function are all proven.

## Safety / deployment boundary
No SQL was executed.
No migration was applied.
No Edge Function was deployed.
No environment flag was changed.
No historical row was modified.
No payment, campaign or production behavior changed.

## Invariants
HISTORICAL_BACKFILL_ALLOWED: false
DATABASE_CHANGED: false
FUNCTION_DEPLOYED: false
DURABLE_READY: false
PAID_ATTRIBUTION_READY: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED