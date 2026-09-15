
drop index if exists public.hunt_payment_events_provider_event_uidx;
create unique index hunt_payment_events_provider_event_uidx
  on public.hunt_payment_events(provider, provider_event_id);
