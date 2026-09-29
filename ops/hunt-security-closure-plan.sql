-- HUNT Launch Closure security hardening plan
-- BRANCH-ONLY PLAN. DO NOT APPLY AUTOMATICALLY.
-- Apply only after review because RLS can affect internal roles.
--
-- Live observations 2026-09-29:
-- private schema tables below have no anon/authenticated/PUBLIC grants.
-- Five have RLS disabled. hunt_variant_market_shadow_pricing has RLS enabled with no policy.
--
-- Desired model: deny-by-default for Data API roles; internal service/postgres access reviewed separately.

begin;

revoke all on table private.hunt_catalog_route_index from anon, authenticated;
revoke all on table private.hunt_ops_exceptions from anon, authenticated;
revoke all on table private.hunt_pdp_qa_runs from anon, authenticated;
revoke all on table private.hunt_supplier_refresh_policy from anon, authenticated;
revoke all on table private.hunt_tax_reserve_rules from anon, authenticated;
revoke all on table private.hunt_variant_market_shadow_pricing from anon, authenticated;

alter table private.hunt_catalog_route_index enable row level security;
alter table private.hunt_ops_exceptions enable row level security;
alter table private.hunt_pdp_qa_runs enable row level security;
alter table private.hunt_supplier_refresh_policy enable row level security;
alter table private.hunt_tax_reserve_rules enable row level security;

-- Intentionally no anon/authenticated policies.
-- private.hunt_variant_market_shadow_pricing already has RLS enabled and remains deny-by-default.

commit;

-- Separate dashboard action required before Payment Live:
-- Enable Supabase Auth leaked-password protection.
