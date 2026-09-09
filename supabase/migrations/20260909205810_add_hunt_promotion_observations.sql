create table if not exists public.hunt_promotion_observations (
  id uuid primary key default gen_random_uuid(),
  source_provider text not null,
  source_kind text not null,
  source_offer_id text not null,
  title text not null default '',
  deal_type text not null,
  buy_quantity smallint,
  get_quantity smallint,
  reward_percent_off numeric,
  reward_amount_off numeric,
  minimum_purchase_amount numeric,
  coupon_code text,
  free_shipping boolean not null default false,
  terms_text text,
  source_url text not null,
  market_scope jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  valid_from timestamptz,
  valid_until timestamptz,
  observed_at timestamptz not null default now(),
  checkout_verified boolean not null default false,
  verification_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_provider, source_offer_id),
  check (source_url like 'https://%'),
  check (deal_type in ('percent_off','amount_off','buy_x_get_y','bogo','bundle','tiered','coupon','free_shipping','free_gift','combined')),
  check (buy_quantity is null or buy_quantity > 0),
  check (get_quantity is null or get_quantity > 0),
  check (reward_percent_off is null or (reward_percent_off > 0 and reward_percent_off <= 100)),
  check (reward_amount_off is null or reward_amount_off > 0),
  check (minimum_purchase_amount is null or minimum_purchase_amount >= 0),
  check (verification_status in ('pending_review','verified','rejected','expired'))
);

alter table public.hunt_promotion_observations enable row level security;
revoke all on table public.hunt_promotion_observations from anon, authenticated;

create index if not exists hunt_promotion_observations_status_idx
  on public.hunt_promotion_observations (verification_status, observed_at desc);

create index if not exists hunt_promotion_observations_provider_idx
  on public.hunt_promotion_observations (source_provider, valid_until);
