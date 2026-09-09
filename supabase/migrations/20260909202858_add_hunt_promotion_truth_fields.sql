alter table public.hunt_promotion_campaigns
  add column if not exists deal_type text not null default 'editorial',
  add column if not exists buy_quantity smallint,
  add column if not exists get_quantity smallint,
  add column if not exists reward_percent_off numeric,
  add column if not exists reward_amount_off numeric,
  add column if not exists minimum_purchase_amount numeric,
  add column if not exists coupon_code text,
  add column if not exists free_shipping boolean not null default false,
  add column if not exists terms_text text,
  add column if not exists source_url text,
  add column if not exists verification_method text,
  add column if not exists verified_at timestamptz,
  add column if not exists checkout_verified boolean not null default false,
  add column if not exists market_scope jsonb not null default '{}'::jsonb,
  add column if not exists evidence jsonb not null default '{}'::jsonb;

alter table public.hunt_promotion_items
  add column if not exists promotion_role text not null default 'featured',
  add column if not exists required_quantity smallint not null default 1;

create index if not exists hunt_promotion_campaigns_deal_type_idx
  on public.hunt_promotion_campaigns (deal_type, status, ends_at);

create index if not exists hunt_promotion_campaigns_verified_idx
  on public.hunt_promotion_campaigns (verified_at desc)
  where checkout_verified = true;
