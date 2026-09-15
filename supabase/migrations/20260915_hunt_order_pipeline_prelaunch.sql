alter table public.hunt_orders
  add column if not exists is_test boolean not null default false,
  add column if not exists order_source text not null default 'hunt_checkout',
  add column if not exists shipping_snapshot jsonb not null default '{}'::jsonb;

create unique index if not exists hunt_payment_events_provider_event_uidx
  on public.hunt_payment_events(provider, provider_event_id);

create table if not exists public.hunt_order_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid references public.hunt_payment_sessions(id) on delete cascade,
  order_id uuid references public.hunt_orders(id) on delete set null,
  run_mode text not null check (run_mode in ('dry_run','sandbox','live')),
  stage text not null check (stage in (
    'validated','supplier_created','supplier_paid_simulated',
    'tracking_set','tracking_verified','completed','failed','hold'
  )),
  status text not null check (status in ('running','pass','fail','hold')),
  provider text,
  supplier_order_id text,
  supplier_order_code text,
  tracking_number text,
  evidence jsonb not null default '{}'::jsonb,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hunt_order_pipeline_runs enable row level security;

drop policy if exists admins_read_hunt_order_pipeline_runs on public.hunt_order_pipeline_runs;
create policy admins_read_hunt_order_pipeline_runs
on public.hunt_order_pipeline_runs
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_admin
  )
);

create index if not exists hunt_order_pipeline_runs_session_idx
  on public.hunt_order_pipeline_runs(payment_session_id, created_at desc);
create index if not exists hunt_order_pipeline_runs_status_idx
  on public.hunt_order_pipeline_runs(run_mode, status, created_at desc);

insert into public.hunt_runtime_controls(key,enabled,owner_approved,note,updated_at)
values
('hunt_supplier_order_sandbox',true,true,
 'Sandbox-only CJ order tests. isSandbox=1 required; no real charge, logistics or fulfillment.',now()),
('hunt_supplier_order_live',false,false,
 'Master kill switch for real supplier order creation. Keep OFF until explicit launch approval and E2E proof.',now()),
('hunt_payplus_callback_accept_paid',false,false,
 'Do not mark payment paid from callbacks until PayPlus sandbox callback verification is proven.',now()),
('hunt_tracking_sync_sandbox',true,true,
 'Allow sandbox tracking simulation/sync only.',now())
on conflict(key) do update set
  enabled=excluded.enabled,
  owner_approved=excluded.owner_approved,
  note=excluded.note,
  updated_at=now();
