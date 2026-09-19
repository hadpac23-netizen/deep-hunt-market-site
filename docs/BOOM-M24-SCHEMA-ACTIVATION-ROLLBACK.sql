-- BOOM M24 — SCHEMA ACTIVATION ROLLBACK PLAN
-- REVIEW-ONLY. NOT APPLIED.
--
-- Preferred rollback is OPERATIONAL, not schema-destructive:
--   1. set HUNT_DURABLE_EVENT_IDENTITY_ENABLED=false
--   2. redeploy/restore the previously verified hunt-commerce-signal version
--   3. keep the nullable event_id column + UNIQUE + hardened public policy in place
-- This preserves any canonical event IDs already written and avoids reopening public canonical writes.
--
-- Full schema rollback is LAST RESORT and should only be considered after
-- the durable writer has been disabled and event_id data retention has been reviewed.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Restore legacy browser INSERT policy only if the event_id column is actually being removed.
drop policy if exists "public can log noncanonical analytics" on public.analytics_events;

create policy "anyone can log their own events"
on public.analytics_events
for insert
to public
with check (true);

alter table public.analytics_events
  drop constraint if exists analytics_events_event_id_key;

alter table public.analytics_events
  drop constraint if exists analytics_events_event_id_length_check;

alter table public.analytics_events
  drop column if exists event_id;

commit;

-- BEFORE full schema rollback:
-- - durable feature flag must be OFF
-- - Edge Function must no longer send top-level event_id
-- - owner must explicitly accept loss of any stored canonical event_id values
-- - export/retain evidence if durable production events already exist
--
-- AFTER rollback:
-- - verify RLS remains enabled
-- - verify legacy INSERT path works
-- - verify live function reports durable_cross_worker_dedup=false
-- - M23/M24/M20 must return HOLD / not-ready