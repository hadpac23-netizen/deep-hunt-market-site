-- BOOM M29 — PURCHASE ATTRIBUTION BRIDGE
-- Canonical migration mirrored from live migration 20260919143150.
-- Read-only truth view. Does not create orders, mark payments paid, or release profit.

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace view public.hunt_purchase_attribution_bridge
with (security_invoker = true)
as
select
  s.id as payment_session_id,
  s.mode as payment_mode,
  s.status as payment_status,
  s.paid_at,
  s.order_id,
  o.is_test as order_is_test,
  o.status as order_status,

  exists (
    select 1
    from public.hunt_payment_events e
    where e.payment_session_id = s.id
      and e.event_type in ('payment_confirmed','callback_verified_paid','provider_paid_confirmed')
  ) as provider_payment_confirmation,

  (s.paid_at is not null) as paid_timestamp_present,
  (
    s.order_id is not null
    and o.id is not null
    and o.is_test = false
  ) as real_order_linked,

  (a.id is not null) as attribution_ledger_present,
  coalesce(a.context_status,'NO_CONTEXT') as attribution_context_status,
  (a.id is not null and a.context_status <> 'NO_CONTEXT') as campaign_context_present,
  a.click_provider,
  a.click_id_type,
  a.provider_validation_status,
  (a.provider_validation_status = 'VERIFIED') as provider_click_validation,

  (
    s.paid_at is not null
    and s.order_id is not null
    and o.id is not null
    and o.is_test = false
    and exists (
      select 1
      from public.hunt_payment_events e2
      where e2.payment_session_id = s.id
        and e2.event_type in ('payment_confirmed','callback_verified_paid','provider_paid_confirmed')
    )
  ) as server_purchase_confirmation,

  (
    s.paid_at is not null
    and s.order_id is not null
    and o.id is not null
    and o.is_test = false
    and a.id is not null
    and a.context_status <> 'NO_CONTEXT'
    and exists (
      select 1
      from public.hunt_payment_events e3
      where e3.payment_session_id = s.id
        and e3.event_type in ('payment_confirmed','callback_verified_paid','provider_paid_confirmed')
    )
  ) as purchase_touchpoint_linkage,

  f.id as finance_ledger_id,
  (f.id is not null) as finance_ledger_present,
  f.is_test as finance_is_test,
  f.settlement_status,
  f.contribution_locked,
  f.available_profit,
  (
    f.id is not null
    and f.is_test = false
    and f.order_id = s.order_id
    and f.settlement_status in ('locked','settled')
  ) as profit_evidence_ready,

  (
    s.paid_at is not null
    and s.order_id is not null
    and o.id is not null
    and o.is_test = false
    and a.id is not null
    and a.context_status <> 'NO_CONTEXT'
    and a.provider_validation_status = 'VERIFIED'
    and exists (
      select 1
      from public.hunt_payment_events e4
      where e4.payment_session_id = s.id
        and e4.event_type in ('payment_confirmed','callback_verified_paid','provider_paid_confirmed')
    )
  ) as conversion_claim_allowed

from public.hunt_payment_sessions s
left join public.hunt_orders o on o.id = s.order_id
left join public.hunt_attribution_ledger a on a.payment_session_id = s.id
left join public.hunt_order_finance_ledger f on f.payment_session_id = s.id;

revoke all on table public.hunt_purchase_attribution_bridge from public, anon, authenticated;
grant select on table public.hunt_purchase_attribution_bridge to service_role;