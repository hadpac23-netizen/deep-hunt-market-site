create table if not exists public.hunt_promotion_verifications (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.hunt_promotion_observations(id) on delete cascade,
  verification_method text not null,
  result text not null,
  source_verified boolean not null default false,
  structure_verified boolean not null default false,
  checkout_verified boolean not null default false,
  landed_cost_complete boolean not null default false,
  observed_total numeric,
  currency text,
  verdict text not null default 'WAIT',
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (verification_method in ('provider_api','authorized_storefront_test','merchant_checkout_test','internal_review')),
  check (result in ('passed','failed','insufficient_evidence','expired')),
  check (verdict in ('BUY','WAIT','SWITCH','SKIP')),
  check (observed_total is null or observed_total >= 0)
);

alter table public.hunt_promotion_verifications enable row level security;
revoke all on table public.hunt_promotion_verifications from anon, authenticated;

create index if not exists hunt_promotion_verifications_observation_idx
  on public.hunt_promotion_verifications (observation_id, verified_at desc);

create index if not exists hunt_promotion_verifications_result_idx
  on public.hunt_promotion_verifications (result, verdict, verified_at desc);
