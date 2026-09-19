-- BOOM M30 — PAYPLUS STATUS OBSERVATIONS
-- Canonical migration mirrored from live migration 20260919144610.
-- Backend-only observation table. Never writes payment/order state.

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table if not exists public.hunt_payplus_status_observations (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid not null
    references public.hunt_payment_sessions(id) on delete cascade,
  provider_event_id text not null,
  environment text not null
    check (environment in ('sandbox','live')),
  charge_method smallint null
    check (charge_method is null or charge_method between 0 and 5),
  charge_method_name text null,
  provider_status text null,
  provider_code text null,
  provider_description text null,
  mapping_state text not null,
  signature_verified boolean not null default false,
  ipn_full_verified boolean not null default false,
  accepted_paid boolean not null default false
    check (accepted_paid = false),
  created_at timestamptz not null default now(),
  unique(payment_session_id,provider_event_id)
);

alter table public.hunt_payplus_status_observations enable row level security;
revoke all on table public.hunt_payplus_status_observations from public, anon, authenticated;
grant select,insert,update,delete on table public.hunt_payplus_status_observations to service_role;

drop policy if exists "No public PayPlus status observation access"
  on public.hunt_payplus_status_observations;
create policy "No public PayPlus status observation access"
on public.hunt_payplus_status_observations
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists hunt_payplus_status_observations_state_idx
  on public.hunt_payplus_status_observations(environment,mapping_state,created_at desc);