-- Server-only table hardening. QA only until explicit Production approval.
-- These tables are accessed by trusted server-side paths, not direct clients.

revoke all privileges on table public.app_secrets from anon;
revoke all privileges on table public.app_secrets from authenticated;
revoke all privileges on table public.hunt_deal_partner_outreach from anon;
revoke all privileges on table public.hunt_deal_partner_outreach from authenticated;
revoke all privileges on table public.hunt_deal_partner_requests from anon;
revoke all privileges on table public.hunt_deal_partner_requests from authenticated;
revoke all privileges on table public.hunt_partner_candidates from anon;
revoke all privileges on table public.hunt_partner_candidates from authenticated;
revoke all privileges on table public.hunt_shelf_coverage from anon;
revoke all privileges on table public.hunt_shelf_coverage from authenticated;
revoke all privileges on table public.merchant_checkout_integrations from anon;
revoke all privileges on table public.merchant_checkout_integrations from authenticated;
revoke all privileges on table public.merchant_checkout_variants from anon;
revoke all privileges on table public.merchant_checkout_variants from authenticated;

drop policy if exists "Server-only direct client deny" on public.app_secrets;
create policy "Server-only direct client deny" on public.app_secrets
for all to anon, authenticated using (false) with check (false);
drop policy if exists "Server-only direct client deny" on public.hunt_deal_partner_outreach;
create policy "Server-only direct client deny" on public.hunt_deal_partner_outreach
for all to anon, authenticated using (false) with check (false);

drop policy if exists "Server-only direct client deny" on public.hunt_deal_partner_requests;
create policy "Server-only direct client deny" on public.hunt_deal_partner_requests
for all to anon, authenticated using (false) with check (false);

drop policy if exists "Server-only direct client deny" on public.hunt_partner_candidates;
create policy "Server-only direct client deny" on public.hunt_partner_candidates
for all to anon, authenticated using (false) with check (false);

drop policy if exists "Server-only direct client deny" on public.hunt_shelf_coverage;
create policy "Server-only direct client deny" on public.hunt_shelf_coverage
for all to anon, authenticated using (false) with check (false);

drop policy if exists "Server-only direct client deny" on public.merchant_checkout_integrations;
create policy "Server-only direct client deny" on public.merchant_checkout_integrations
for all to anon, authenticated using (false) with check (false);

drop policy if exists "Server-only direct client deny" on public.merchant_checkout_variants;
create policy "Server-only direct client deny" on public.merchant_checkout_variants
for all to anon, authenticated using (false) with check (false);
