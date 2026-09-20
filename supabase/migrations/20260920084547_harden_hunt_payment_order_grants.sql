-- Defense-in-depth: minimize direct Data API privileges for HUNT payment/order state.
-- RLS remains authoritative for row visibility; Edge Functions/service credentials own writes.
-- This migration intentionally does not alter existing RLS policies.

revoke all privileges on table public.hunt_payment_sessions from anon, authenticated;
revoke all privileges on table public.hunt_payment_events from anon, authenticated;
revoke all privileges on table public.hunt_orders from anon, authenticated;
revoke all privileges on table public.hunt_order_events from anon, authenticated;
revoke all privileges on table public.hunt_fulfillment_orders from anon, authenticated;
revoke all privileges on table public.hunt_order_pipeline_runs from anon, authenticated;
revoke all privileges on table public.hunt_unit_economics from anon, authenticated;
revoke all privileges on table public.hunt_payplus_status_observations from anon, authenticated;

-- Signed-in users may read only rows allowed by the existing SELECT RLS policies.
grant select on table public.hunt_payment_sessions to authenticated;
grant select on table public.hunt_payment_events to authenticated;
grant select on table public.hunt_orders to authenticated;
grant select on table public.hunt_order_events to authenticated;
grant select on table public.hunt_fulfillment_orders to authenticated;
grant select on table public.hunt_order_pipeline_runs to authenticated;
grant select on table public.hunt_unit_economics to authenticated;

-- Runtime controls are owner/admin-managed through an existing admin-only ALL policy.
-- Remove anon access and strip authenticated privileges to only the DML required by that policy.
revoke all privileges on table public.hunt_runtime_controls from anon, authenticated;
grant select, insert, update, delete on table public.hunt_runtime_controls to authenticated;

comment on table public.hunt_payment_sessions is
  'HUNT payment state. Direct client writes are forbidden; server-side payment functions own mutation.';
comment on table public.hunt_orders is
  'HUNT order state. Direct client writes are forbidden; server-side fulfillment functions own mutation.';
comment on table public.hunt_payplus_status_observations is
  'Server-only PayPlus callback evidence. No anon/authenticated Data API access.';
