create table if not exists public.hunt_purchase_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'draft',
  category text not null,
  query text not null,
  quantity smallint not null default 1,
  budget_max numeric,
  currency text,
  country_code text,
  region_code text,
  deadline_at timestamptz,
  constraints jsonb not null default '{}'::jsonb,
  allow_grouping boolean not null default false,
  anonymous_market_key text,
  safety_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','open','matched','accepted','closed','expired','cancelled')),
  check (quantity between 1 and 100),
  check (budget_max is null or budget_max >= 0),
  check (currency is null or currency ~ '^[A-Z]{3}$'),
  check (country_code is null or country_code ~ '^[A-Z]{2}$')
);
create table if not exists public.hunt_mission_offers (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.hunt_purchase_missions(id) on delete cascade,
  store_id uuid not null references public.merchant_stores(id) on delete cascade,
  merchant_product_id uuid references public.merchant_products(id) on delete set null,
  external_offer_id text,
  title text not null,
  offer_type text not null default 'standard',
  quantity smallint not null,
  landed_total numeric not null,
  currency text not null,
  shipping_amount numeric,
  tax_amount numeric,
  duties_amount numeric,
  delivery_by timestamptz,
  checkout_verified boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (offer_type in ('standard','percent_off','amount_off','bogo','buy_x_get_y','bundle','coupon','free_shipping','custom')),
  check (status in ('submitted','shortlisted','accepted','rejected','expired','withdrawn')),
  check (quantity between 1 and 100),
  check (landed_total >= 0),
  check (shipping_amount is null or shipping_amount >= 0),
  check (tax_amount is null or tax_amount >= 0),
  check (duties_amount is null or duties_amount >= 0),
  check (currency ~ '^[A-Z]{3}$'),
  unique (mission_id, store_id, external_offer_id)
);

create table if not exists public.hunt_demand_pools (
  id uuid primary key default gen_random_uuid(),
  market_key text not null unique,
  category text not null,
  normalized_intent text not null,
  total_quantity integer not null default 0,
  member_count integer not null default 0,
  country_code text,
  currency text,
  status text not null default 'collecting',
  quote_requested_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_quantity >= 0),
  check (member_count >= 0),
  check (status in ('collecting','quote_requested','offer_received','closed','expired')),
  check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  check (currency is null or currency ~ '^[A-Z]{3}$')
);

create table if not exists public.hunt_demand_pool_members (
  pool_id uuid not null references public.hunt_demand_pools(id) on delete cascade,
  mission_id uuid not null references public.hunt_purchase_missions(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (pool_id, mission_id),
  unique (mission_id)
);

alter table public.hunt_purchase_missions enable row level security;
alter table public.hunt_mission_offers enable row level security;
alter table public.hunt_demand_pools enable row level security;
alter table public.hunt_demand_pool_members enable row level security;
revoke all on table public.hunt_purchase_missions from anon, authenticated;
revoke all on table public.hunt_mission_offers from anon, authenticated;
revoke all on table public.hunt_demand_pools from anon, authenticated;
revoke all on table public.hunt_demand_pool_members from anon, authenticated;

create index if not exists hunt_purchase_missions_open_idx
  on public.hunt_purchase_missions (status, category, country_code, deadline_at);

create index if not exists hunt_mission_offers_rank_idx
  on public.hunt_mission_offers (mission_id, status, landed_total, valid_until);

create index if not exists hunt_demand_pools_collecting_idx
  on public.hunt_demand_pools (status, category, country_code, member_count desc);
