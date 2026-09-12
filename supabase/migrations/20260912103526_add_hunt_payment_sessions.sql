create table if not exists public.hunt_payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.hunt_orders(id) on delete set null,
  provider text not null default 'payplus',
  mode text not null default 'prelaunch' check (mode in ('prelaunch','sandbox','live')),
  status text not null default 'created' check (status in ('created','prelaunch','pending','authorized','paid','failed','cancelled','expired','refunded')),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  product_amount numeric not null check (product_amount >= 0),
  shipping_amount numeric not null default 0 check (shipping_amount >= 0),
  total_amount numeric not null check (total_amount >= 0),
  line_items jsonb not null default '[]'::jsonb,
  cart_digest text not null,
  idempotency_key text not null unique,
  provider_request_uid text,
  provider_transaction_uid text,
  provider_hosted_fields_uid text,
  provider_redirect_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hunt_payment_sessions_user_created_idx
  on public.hunt_payment_sessions(user_id, created_at desc);
create index if not exists hunt_payment_sessions_status_created_idx
  on public.hunt_payment_sessions(status, created_at desc);
create unique index if not exists hunt_payment_sessions_provider_request_uid_uniq
  on public.hunt_payment_sessions(provider_request_uid)
  where provider_request_uid is not null;

alter table public.hunt_payment_sessions enable row level security;

drop policy if exists "users_read_own_hunt_payment_sessions" on public.hunt_payment_sessions;
create policy "users_read_own_hunt_payment_sessions"
on public.hunt_payment_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.hunt_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid not null references public.hunt_payment_sessions(id) on delete cascade,
  provider text not null,
  event_type text not null,
  provider_event_id text,
  payload_digest text,
  created_at timestamptz not null default now()
);

create unique index if not exists hunt_payment_events_provider_event_uniq
  on public.hunt_payment_events(provider, provider_event_id)
  where provider_event_id is not null;
create index if not exists hunt_payment_events_session_created_idx
  on public.hunt_payment_events(payment_session_id, created_at desc);

alter table public.hunt_payment_events enable row level security;

drop policy if exists "users_read_own_hunt_payment_events" on public.hunt_payment_events;
create policy "users_read_own_hunt_payment_events"
on public.hunt_payment_events
for select
to authenticated
using (
  exists (
    select 1
    from public.hunt_payment_sessions s
    where s.id = payment_session_id
      and s.user_id = (select auth.uid())
  )
);
