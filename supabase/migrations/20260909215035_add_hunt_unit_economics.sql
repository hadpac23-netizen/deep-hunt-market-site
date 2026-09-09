create table if not exists public.hunt_unit_economics_quotes (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  item_id text not null,
  market_code text,
  channel text not null,
  currency text not null,
  supplier_cost numeric,
  shipping_cost numeric,
  payment_fee numeric,
  tax_cost numeric,
  duties_cost numeric,
  fulfillment_cost numeric,
  returns_reserve numeric,
  acquisition_cost numeric,
  creator_cost numeric,
  other_cost numeric,
  retail_price numeric,
  affiliate_commission numeric,
  arena_success_fee numeric,
  gross_revenue numeric,
  contribution_profit numeric,
  contribution_margin_pct numeric,
  minimum_profit_amount numeric,
  minimum_margin_pct numeric,
  inputs_complete boolean not null default false,
  gate_status text not null default 'WAIT',
  evidence jsonb not null default '{}'::jsonb,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (channel in ('STANDARD_RETAIL','ARENA_SUCCESS_FEE','AFFILIATE_FALLBACK')),
  check (currency ~ '^[A-Z]{3}$'),
  check (market_code is null or market_code ~ '^[A-Z]{2}$'),
  check (gate_status in ('WAIT','PASS','FAIL')),
  check (supplier_cost is null or supplier_cost >= 0),
  check (shipping_cost is null or shipping_cost >= 0),
  check (payment_fee is null or payment_fee >= 0),
  check (tax_cost is null or tax_cost >= 0),
  check (duties_cost is null or duties_cost >= 0),
  check (fulfillment_cost is null or fulfillment_cost >= 0),
  check (returns_reserve is null or returns_reserve >= 0),
  check (acquisition_cost is null or acquisition_cost >= 0),
  check (creator_cost is null or creator_cost >= 0),
  check (other_cost is null or other_cost >= 0),
  check (retail_price is null or retail_price >= 0),
  check (affiliate_commission is null or affiliate_commission >= 0),
  check (arena_success_fee is null or arena_success_fee >= 0),
  check (gross_revenue is null or gross_revenue >= 0),
  check (minimum_profit_amount is null or minimum_profit_amount >= 0),
  check (minimum_margin_pct is null or (minimum_margin_pct >= 0 and minimum_margin_pct <= 100))
);

alter table public.hunt_unit_economics_quotes enable row level security;
revoke all on table public.hunt_unit_economics_quotes from anon, authenticated;

create unique index if not exists hunt_unit_economics_quote_unique
  on public.hunt_unit_economics_quotes (
    provider,
    item_id,
    coalesce(market_code,''),
    channel,
    currency
  );

create index if not exists hunt_unit_economics_gate_idx
  on public.hunt_unit_economics_quotes (
    gate_status,
    channel,
    valid_until
  );
create table if not exists public.hunt_revenue_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.hunt_orders(id) on delete set null,
  channel text not null,
  source_ref text,
  currency text not null,
  gross_revenue numeric not null default 0,
  contribution_profit numeric not null default 0,
  confirmed boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (channel in ('STANDARD_RETAIL','ARENA_SUCCESS_FEE','AFFILIATE_FALLBACK','SPONSORED','MERCHANT_PRO')),
  check (currency ~ '^[A-Z]{3}$'),
  check (gross_revenue >= 0)
);

alter table public.hunt_revenue_events enable row level security;
revoke all on table public.hunt_revenue_events from anon, authenticated;

create index if not exists hunt_revenue_events_order_idx
  on public.hunt_revenue_events (order_id)
  where order_id is not null;

create index if not exists hunt_revenue_events_confirmed_idx
  on public.hunt_revenue_events (confirmed, occurred_at desc);

create index if not exists hunt_revenue_events_channel_idx
  on public.hunt_revenue_events (channel, occurred_at desc);
