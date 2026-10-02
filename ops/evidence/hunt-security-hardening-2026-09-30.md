# HUNT Security Hardening Evidence — 2026-09-30

## Scope
Launch-candidate security closure for PR26. No Payment Live, Supplier Live Order, merge, or customer payment activation was enabled.

## Critical finding fixed
`public.profiles` was trusted by HUNT admin RLS through `profiles.is_admin`, while the self-profile INSERT policy only required `auth.uid() = id`. Authenticated users also had INSERT privilege on privileged profile columns, creating a potential self-admin escalation path.

Applied database migration `lock_profile_privileged_insert_fields`:
- self-profile INSERT is now `TO authenticated` only;
- `auth.uid()` must equal profile `id`;
- `is_admin=false`, `is_founder=false`, `founder_number IS NULL`;
- `is_banned=false`, `suspended_until IS NULL`;
- `ai_credits=30`, `followers_count=0`, `following_count=0`.

Applied database migration `harden_profile_update_policies`:
- self UPDATE is now explicitly `TO authenticated`;
- both `USING` and `WITH CHECK` enforce the same user id;
- admin UPDATE is explicitly `TO authenticated` and requires `is_admin_user()` for both existing and resulting rows.

## HUNT RLS / function / view audit
- 0 `public.hunt_%` tables found with RLS disabled.
- 0 HUNT policies found using `user_metadata` / `raw_user_meta_data` for authorization.
- HUNT `SECURITY DEFINER` audit found one function: `hunt_eprolo_country_runtime_input(text)`.
- That function has `search_path=''`, checks for `service_role`, and is not executable by `anon`, `authenticated`, or `PUBLIC`.
- `is_admin_user()` is SECURITY INVOKER, has `search_path=''`, and is executable by authenticated users only.
- Public HUNT views exposed to clients use `security_invoker=true`; HUNT views without security-invoker are not granted SELECT to anon/authenticated.
- An anon-role runtime check returned 0 rows from `hunt_daily_owner_metrics`.

## Private shadow pricing defense-in-depth
Applied database migration `deny_client_access_shadow_pricing`:
- restrictive deny policy for `anon` and `authenticated` on `private.hunt_variant_market_shadow_pricing`.
- After this change, the prior Security Advisor INFO (`RLS enabled no policy`) cleared.

## Current Security Advisor truth
After hardening, Security Advisor reports only:
- `auth_leaked_password_protection` — WARN.

Supabase organization tier is currently `free`. Supabase documentation states leaked-password protection is available on Pro and above. HUNT's customer auth UI does not expose password sign-in; it uses Email Magic Link plus enabled social providers.

This WARN is therefore recorded as a platform-plan limitation, not as a closed control. Re-evaluate when upgrading Supabase or if password authentication is introduced.

## Owner gates preserved
- Payment Live: OFF
- Supplier Live Order: OFF
- PR26: Draft / unmerged
- No production payment activation performed
