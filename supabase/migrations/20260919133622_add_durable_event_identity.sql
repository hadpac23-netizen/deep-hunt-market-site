set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.analytics_events
  add column event_id text null;

alter table public.analytics_events
  add constraint analytics_events_event_id_length_check
  check (event_id is null or (length(event_id) between 1 and 160));

alter table public.analytics_events
  add constraint analytics_events_event_id_key unique (event_id);

drop policy if exists "anyone can log their own events" on public.analytics_events;

create policy "public can log noncanonical analytics"
on public.analytics_events
for insert
to anon, authenticated
with check (
  event_id is null
  and not (coalesce(metadata, '{}'::jsonb) ? 'event_id')
);