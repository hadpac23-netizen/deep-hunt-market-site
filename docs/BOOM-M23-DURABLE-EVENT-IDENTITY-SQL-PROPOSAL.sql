-- BOOM M23 DURABLE EVENT IDENTITY — SOURCE PROPOSAL
-- APPLIED AS MIGRATION 20260919133622_add_durable_event_identity on 2026-09-19.
-- Canonical repo migration: supabase/migrations/20260919133622_add_durable_event_identity.sql.
--
-- Observed 2026-09-19:
-- analytics_events rows: 4630
-- top-level event_id column: absent
-- unique event_id constraint/index: absent
-- stored metadata event_id values: 0
--
-- Historical rows MUST remain event_id = NULL.
-- Do not fabricate canonical IDs for events whose original browser identity was never persisted.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.analytics_events
  add column event_id text null;

alter table public.analytics_events
  add constraint analytics_events_event_id_length_check
  check (event_id is null or (length(event_id) between 1 and 160));

alter table public.analytics_events
  add constraint analytics_events_event_id_key unique (event_id);

-- Preserve direct anonymous/authenticated experience logging, but reserve canonical
-- event identity for the trusted Edge Function / backend path.
drop policy if exists "anyone can log their own events" on public.analytics_events;

create policy "public can log noncanonical analytics"
on public.analytics_events
for insert
to anon, authenticated
with check (
  event_id is null
  and not (coalesce(metadata, '{}'::jsonb) ? 'event_id')
);

commit;

-- Required verification after an approved migration:
-- 1. analytics_events.event_id exists and is nullable
-- 2. analytics_events_event_id_key is UNIQUE
-- 3. old rows remain NULL
-- 4. anon/authenticated cannot insert top-level or metadata canonical event_id
-- 5. service-side insert can write event_id
-- 6. duplicate service-side event_id is atomically ignored/rejected by the database