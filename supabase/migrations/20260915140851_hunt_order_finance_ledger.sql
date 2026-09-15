create table if not exists public.hunt_order_finance_ledger (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid not null unique
    references public.hunt_payment_sessions(id) on delete cascade,
  order_id uuid references public.hunt_orders(id) on delete set null,
  currency text not null default 'USD',
  customer_gross numeric(14,2) not null default 0 check (customer_gross >= 0),
  supplier_product_payable numeric(14,2) not null default 0 check (supplier_product_payable >= 0),
  supplier_shipping_payable numeric(14,2) not null default 0 check (supplier_shipping_payable >= 0),
  processor_reserve numeric(14,2) not null default 0 check (processor_reserve >= 0),
  refund_reserve numeric(14,2) not null default 0 check (refund_reserve >= 0),
  tax_reserve numeric(14,2) not null default 0 check (tax_reserve >= 0),
  other_reserve numeric(14,2) not null default 0 check (other_reserve >= 0),
  contribution_locked numeric(14,2) not null default 0,
  available_profit numeric(14,2) not null default 0 check (available_profit >= 0),
  settlement_status text not null default 'preview'
    check (settlement_status in ('preview','locked','settled','void','refunded','chargeback')),
  supplier_payment_status text not null default 'not_started'
    check (supplier_payment_status in ('not_started','reserved','paid','failed','refunded')),
  owner_payout_status text not null default 'locked'
    check (owner_payout_status in ('locked','available','paid','reversed')),
  is_test boolean not null default true,
  calculation jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hunt_order_finance_ledger enable row level security;

drop policy if exists admins_read_hunt_order_finance_ledger
  on public.hunt_order_finance_ledger;
create policy admins_read_hunt_order_finance_ledger
on public.hunt_order_finance_ledger
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_admin
  )
);

create index if not exists hunt_order_finance_ledger_order_idx
  on public.hunt_order_finance_ledger(order_id, updated_at desc);
create index if not exists hunt_order_finance_ledger_status_idx
  on public.hunt_order_finance_ledger(settlement_status, owner_payout_status, updated_at desc);

insert into public.hunt_runtime_controls(key,enabled,owner_approved,note,updated_at)
values
('hunt_finance_ledger_preview',true,true,
 'Allow internal prelaunch/sandbox finance allocation previews only.',now()),
('hunt_finance_profit_release',false,false,
 'Master gate for releasing settled contribution as owner-available profit. Keep OFF until live payment settlement, supplier payment, refunds/tax handling and launch approval are proven.',now())
on conflict(key) do update set
  note=excluded.note,
  updated_at=now();